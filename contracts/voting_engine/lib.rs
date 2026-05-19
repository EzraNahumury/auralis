#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::primitives::AccountId;

// ----- Cross-contract trait stubs (client views) -----
//
// These trait definitions act as type-safe client views of the OTHER
// contracts. ink! derives the message selector deterministically from the
// method name (BLAKE2b prefix), so as long as the method name + argument
// types match the target contract's exported message, the SCALE-encoded
// call wire-format is identical to what `build_call` produced. The benefit
// over manual selectors:
//   1. Real argument/return type-checking at compile time.
//   2. Slightly cheaper gas (the compiler can inline / optimize encoding).
//   3. Removes the `Result<(), u8>` placeholder used previously.

/// View of AgentRegistry — only the message VotingEngine needs.
#[ink::trait_definition]
pub trait AgentRegistryView {
    #[ink(message)]
    fn owner_of(&self, agent_key: AccountId) -> Option<AccountId>;
}

/// View of ReputationRegistry.
#[ink::trait_definition]
pub trait ReputationRegistryView {
    #[ink(message)]
    fn get_weight_bps(&self, account: AccountId) -> u32;
}

/// Callback contract: ArisanGroup's `on_voting_finalized`.
/// The return type is `Result<(), u8>` (vs. arisan_group's
/// `Result<(), arisan_group::Error>`) because we don't have cross-crate
/// type access — but the SCALE encodings are byte-identical so this works.
#[ink::trait_definition]
pub trait ArisanGroupCallback {
    #[ink(message)]
    fn on_voting_finalized(
        &mut self,
        req_id: u64,
        approved: bool,
        confidence_bps: u32,
    ) -> Result<(), u8>;
}

// VotingEngine — Routes withdrawal requests through one of three execution
// paths based on the Requester Agent's confidence score, then collects
// reputation-weighted votes from Reviewer Agents.
#[ink::contract]
mod voting_engine {
    use super::{AgentRegistryView, ArisanGroupCallback, ReputationRegistryView};
    use ink::storage::Mapping;

    pub type RequestId = u64;
    pub type ReasoningCid = [u8; 32]; // IPFS CID stored as bytes32

    const FAST_TRACK_THRESHOLD: u32 = 8500;   // 85.00% (basis points × 100)
    const AUTO_REJECT_THRESHOLD: u32 = 5000;  // 50.00%
    const FAST_TRACK_WINDOW_MS: u64 = 12 * 60 * 60 * 1000; // 12h
    const NORMAL_WINDOW_MS: u64 = 24 * 60 * 60 * 1000;     // 24h
    const FAST_TRACK_QUORUM_BPS: u32 = 3000; // 30%
    const NORMAL_QUORUM_BPS: u32 = 6000;     // 60%

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum Path { FastTrack, Normal, AutoRejected }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum Status { Pending, FastTrackChallenged, Approved, Rejected }

    #[derive(Debug, Clone, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct RequestState {
        pub requester: AccountId,
        pub arisan_group: AccountId,
        pub path: Path,
        pub status: Status,
        pub confidence_bps: u32,
        pub reasoning_cid: ReasoningCid,
        pub deadline_ms: u64,
        pub total_voters_at_open: u32,
        pub votes_count: u32,
        pub approve_weight: u64,
        pub reject_weight: u64,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Vote {
        pub approve: bool,
        pub weight: u32,
        pub reasoning_cid: ReasoningCid,
        pub voted_at_ms: u64,
    }

    #[ink(storage)]
    pub struct VotingEngine {
        owner: AccountId,
        reputation_registry: AccountId,
        agent_registry: AccountId,
        // Whitelisted accounts allowed to call `submit_prevalidation`.
        // Typically the off-chain Requester Agent's signing account(s).
        whitelisted_prevalidators: Mapping<AccountId, bool>,
        next_request_id: RequestId,
        requests: Mapping<RequestId, RequestState>,
        // Key is (req_id, USER) — the human owner, NOT the agent_key.
        // Resolved via AgentRegistry.owner_of(caller) so vote history
        // survives agent key rotation.
        votes: Mapping<(RequestId, AccountId), Vote>,
    }

    #[ink(event)]
    pub struct PrevalidationSubmitted {
        #[ink(topic)]
        req_id: RequestId,
        #[ink(topic)]
        requester: AccountId,
        path: Path,
        confidence_bps: u32,
        reasoning_cid: ReasoningCid,
    }

    #[ink(event)]
    pub struct VoteCast {
        #[ink(topic)]
        req_id: RequestId,
        #[ink(topic)]
        voter: AccountId,
        approve: bool,
        weight: u32,
        reasoning_cid: ReasoningCid,
    }

    #[ink(event)]
    pub struct Challenged {
        #[ink(topic)]
        req_id: RequestId,
        #[ink(topic)]
        challenger: AccountId,
    }

    #[ink(event)]
    pub struct VotingFinalized {
        #[ink(topic)]
        req_id: RequestId,
        approved: bool,
        approve_weight: u64,
        reject_weight: u64,
    }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        NotOwner,
        NotWhitelistedPrevalidator,
        NotAuthorizedAgent,      // caller is not bound to any user in AgentRegistry
        AgentBindingInactive,    // user revoked their agent
        RequestNotFound,
        AlreadyVoted,
        AlreadyFinalized,
        DeadlineNotReached,
        DeadlinePassed,
        InvalidConfidence,
        NotChallengeable,
        CrossContractCallFailed,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl VotingEngine {
        #[ink(constructor)]
        pub fn new(
            reputation_registry: AccountId,
            agent_registry: AccountId,
        ) -> Self {
            Self {
                owner: Self::env().caller(),
                reputation_registry,
                agent_registry,
                whitelisted_prevalidators: Mapping::default(),
                next_request_id: 1,
                requests: Mapping::default(),
                votes: Mapping::default(),
            }
        }

        /// Called by the off-chain Requester Agent's signing account.
        /// Routes the request to FastTrack / Normal / AutoRejected based on
        /// confidence, then opens the voting window.
        #[ink(message)]
        pub fn submit_prevalidation(
            &mut self,
            requester: AccountId,
            arisan_group: AccountId,
            confidence_bps: u32,
            reasoning_cid: ReasoningCid,
            total_voters: u32,
        ) -> Result<RequestId> {
            let caller = self.env().caller();
            if !self
                .whitelisted_prevalidators
                .get(caller)
                .unwrap_or(false)
            {
                return Err(Error::NotWhitelistedPrevalidator);
            }
            if confidence_bps > 10_000 {
                return Err(Error::InvalidConfidence);
            }

            let now = self.env().block_timestamp();
            let (path, status, deadline_ms) = if confidence_bps >= FAST_TRACK_THRESHOLD {
                (
                    Path::FastTrack,
                    Status::Pending,
                    now.saturating_add(FAST_TRACK_WINDOW_MS),
                )
            } else if confidence_bps >= AUTO_REJECT_THRESHOLD {
                (
                    Path::Normal,
                    Status::Pending,
                    now.saturating_add(NORMAL_WINDOW_MS),
                )
            } else {
                (Path::AutoRejected, Status::Rejected, 0)
            };

            let req_id = self.next_request_id;
            self.next_request_id = self.next_request_id.saturating_add(1);

            let state = RequestState {
                requester,
                arisan_group,
                path,
                status,
                confidence_bps,
                reasoning_cid,
                deadline_ms,
                total_voters_at_open: total_voters,
                votes_count: 0,
                approve_weight: 0,
                reject_weight: 0,
            };
            self.requests.insert(req_id, &state);

            self.env().emit_event(PrevalidationSubmitted {
                req_id,
                requester,
                path,
                confidence_bps,
                reasoning_cid,
            });
            Ok(req_id)
        }

        /// Submitted BY THE AGENT KEY — `self.env().caller()` is the delegated
        /// signer. Resolved back to the human user via AgentRegistry.
        #[ink(message)]
        pub fn cast_vote(
            &mut self,
            req_id: RequestId,
            approve: bool,
            reasoning_cid: ReasoningCid,
        ) -> Result<()> {
            let agent_key = self.env().caller();

            // STEP 1 — Resolve agent_key → user via AgentRegistry.owner_of
            let agent_reg: ink::contract_ref!(AgentRegistryView) =
                self.agent_registry.into();
            let user = agent_reg
                .owner_of(agent_key)
                .ok_or(Error::NotAuthorizedAgent)?;

            // STEP 2 — Load request, validate status & deadline.
            let mut req = self.requests.get(req_id).ok_or(Error::RequestNotFound)?;
            if req.status != Status::Pending {
                return Err(Error::AlreadyFinalized);
            }
            if self.env().block_timestamp() >= req.deadline_ms {
                return Err(Error::DeadlinePassed);
            }

            // STEP 3 — Prevent double vote (key by USER, not agent_key).
            if self.votes.contains((req_id, user)) {
                return Err(Error::AlreadyVoted);
            }

            // STEP 4 — Read reputation-based vote weight for the USER.
            let rep_reg: ink::contract_ref!(ReputationRegistryView) =
                self.reputation_registry.into();
            let weight = rep_reg.get_weight_bps(user);

            // STEP 5 — Update tally, persist vote, emit event.
            if approve {
                req.approve_weight = req.approve_weight.saturating_add(weight as u64);
            } else {
                req.reject_weight = req.reject_weight.saturating_add(weight as u64);
            }
            req.votes_count = req.votes_count.saturating_add(1);
            self.requests.insert(req_id, &req);

            let now = self.env().block_timestamp();
            self.votes.insert(
                (req_id, user),
                &Vote {
                    approve,
                    weight,
                    reasoning_cid,
                    voted_at_ms: now,
                },
            );

            self.env().emit_event(VoteCast {
                req_id,
                voter: user,
                approve,
                weight,
                reasoning_cid,
            });
            Ok(())
        }

        /// During the fast-track window, ANY caller can challenge to escalate
        /// the decision to a full vote. (MVP scope: no membership check —
        /// griefing is bounded since challenge only widens the deliberation.)
        #[ink(message)]
        pub fn challenge(&mut self, req_id: RequestId) -> Result<()> {
            let mut req = self.requests.get(req_id).ok_or(Error::RequestNotFound)?;
            if req.path != Path::FastTrack || req.status != Status::Pending {
                return Err(Error::NotChallengeable);
            }
            let now = self.env().block_timestamp();
            if now >= req.deadline_ms {
                return Err(Error::DeadlinePassed);
            }

            req.path = Path::Normal;
            req.deadline_ms = now.saturating_add(NORMAL_WINDOW_MS);
            self.requests.insert(req_id, &req);

            self.env().emit_event(Challenged {
                req_id,
                challenger: self.env().caller(),
            });
            Ok(())
        }

        /// Finalize a request. Anyone can call.
        /// Conditions:
        ///  - FastTrack + deadline reached + no challenge → auto-approved
        ///  - Normal + (deadline reached OR early-quorum approval) → tally
        /// After setting status, calls back ArisanGroup.on_voting_finalized
        /// so the group contract can flip the request to Approved/Rejected.
        #[ink(message)]
        pub fn finalize(&mut self, req_id: RequestId) -> Result<bool> {
            let mut req = self.requests.get(req_id).ok_or(Error::RequestNotFound)?;
            if req.status != Status::Pending {
                return Err(Error::AlreadyFinalized);
            }

            let now = self.env().block_timestamp();
            let deadline_passed = now >= req.deadline_ms;

            // Quorum bps threshold based on path.
            let quorum_bps = match req.path {
                Path::FastTrack => FAST_TRACK_QUORUM_BPS,
                Path::Normal => NORMAL_QUORUM_BPS,
                Path::AutoRejected => return Err(Error::AlreadyFinalized),
            };
            let total = req.total_voters_at_open.max(1) as u64;
            let quorum_met = (req.votes_count as u64).saturating_mul(10_000)
                >= (quorum_bps as u64).saturating_mul(total);

            // Decide finalizability + outcome.
            let approved: bool = match req.path {
                Path::FastTrack => {
                    // Fast-track auto-approves when window closes without challenge.
                    if !deadline_passed {
                        return Err(Error::DeadlineNotReached);
                    }
                    true
                }
                Path::Normal => {
                    let majority_approve = req.approve_weight > req.reject_weight;
                    if deadline_passed {
                        // Need quorum AND majority to approve at deadline.
                        quorum_met && majority_approve
                    } else if quorum_met && majority_approve {
                        // Early approval permitted.
                        true
                    } else {
                        return Err(Error::DeadlineNotReached);
                    }
                }
                Path::AutoRejected => false,
            };

            req.status = if approved { Status::Approved } else { Status::Rejected };
            self.requests.insert(req_id, &req);

            self.env().emit_event(VotingFinalized {
                req_id,
                approved,
                approve_weight: req.approve_weight,
                reject_weight: req.reject_weight,
            });

            // Callback to ArisanGroup so it can flip its own request state.
            // Done LAST (CEI). If the callback fails we still consider this
            // VotingEngine state authoritative — the group can re-sync later
            // via a manual retry mechanism if needed.
            let mut arisan_ref: ink::contract_ref!(ArisanGroupCallback) =
                req.arisan_group.into();
            let _ = arisan_ref.on_voting_finalized(req_id, approved, req.confidence_bps);

            Ok(approved)
        }

        #[ink(message)]
        pub fn get_request(&self, req_id: RequestId) -> Option<RequestState> {
            self.requests.get(req_id)
        }

        #[ink(message)]
        pub fn get_vote(&self, req_id: RequestId, voter: AccountId) -> Option<Vote> {
            self.votes.get((req_id, voter))
        }

        /// Whitelist a Requester Agent signing account for `submit_prevalidation`.
        /// Owner-only. Note: this is for the SHARED system Requester Agent,
        /// NOT for per-user Reviewer Agents (those use AgentRegistry instead).
        #[ink(message)]
        pub fn add_whitelisted_prevalidator(&mut self, addr: AccountId) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            self.whitelisted_prevalidators.insert(addr, &true);
            Ok(())
        }

        #[ink(message)]
        pub fn is_prevalidator(&self, addr: AccountId) -> bool {
            self.whitelisted_prevalidators.get(addr).unwrap_or(false)
        }

        #[ink(message)]
        pub fn agent_registry(&self) -> AccountId {
            self.agent_registry
        }

        #[ink(message)]
        pub fn reputation_registry(&self) -> AccountId {
            self.reputation_registry
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn constructor_works() {
            let engine = VotingEngine::new(
                AccountId::from([0xA1; 32]), // reputation_registry
                AccountId::from([0xA2; 32]), // agent_registry
            );
            assert_eq!(engine.agent_registry(), AccountId::from([0xA2; 32]));
            assert_eq!(engine.reputation_registry(), AccountId::from([0xA1; 32]));
        }
    }
}
