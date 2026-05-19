#![cfg_attr(not(feature = "std"), no_std, no_main)]

// ArisanGroup — Per-group brain of the Auralis protocol.
//
// Owns the group's roster, schedule, and round bookkeeping. Receives deposits
// (forwards POT to Treasury), accepts withdrawal requests from members, and
// is the final caller that triggers fund release once VotingEngine approves.
//
// Cross-contract topology:
//   GroupRegistry  ──registers──▶  ArisanGroup
//   ArisanGroup    ──deposits──▶  Treasury        (forwards POT on every deposit)
//   ArisanGroup    ──emits event──▶ Requester Agent (off-chain) ─▶ VotingEngine
//   VotingEngine   ──execute()──▶ ArisanGroup     (only after weighted approval)
//   ArisanGroup    ──release()──▶ Treasury        (pays out POT to requester)
#[ink::contract]
mod arisan_group {
    use ink::storage::Mapping;
    use ink::env::call::{build_call, ExecutionInput, Selector};
    use ink::env::DefaultEnvironment;

    pub type RequestId = u64;
    pub type ReasoningCid = [u8; 32];

    const MS_PER_DAY: u64 = 24 * 60 * 60 * 1000;

    // ----- Cross-contract selectors -----
    // Treasury's messages, derived from their ink! message names.
    // `ink::selector_bytes!` returns the deterministic 4-byte selector ink!
    // computes from the message name.
    const SEL_TREASURY_DEPOSIT_FUNDS: [u8; 4] = ink::selector_bytes!("deposit_funds");
    const SEL_TREASURY_RELEASE: [u8; 4] = ink::selector_bytes!("release");

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum RequestStatus {
        Pending,    // submitted, awaiting VotingEngine outcome
        Approved,   // VotingEngine reported APPROVED, not yet executed
        Rejected,   // VotingEngine reported REJECTED
        Executed,   // funds released from Treasury
    }

    #[derive(Debug, Clone, PartialEq, Eq, Default)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct MemberInfo {
        pub joined_at_ms: u64,
        pub total_deposits: u32,
        pub on_time_deposits: u32,
        pub consecutive_on_time: u32,
        pub active: bool,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct WithdrawalRequest {
        pub requester: AccountId,
        pub amount: Balance,
        pub reason_cid: ReasoningCid,
        pub status: RequestStatus,
        pub round_when_requested: u32,
        pub created_at_ms: u64,
    }

    #[ink(storage)]
    pub struct ArisanGroup {
        // ----- Identity / wiring -----
        group_id: u64,
        founder: AccountId,
        group_registry: AccountId,
        treasury: AccountId,
        voting_engine: AccountId,

        // ----- Group parameters (immutable after construction) -----
        contribution_amount: Balance,
        period_days: u32,
        max_members: u32,
        created_at_ms: u64,

        // ----- Roster -----
        members: Mapping<AccountId, MemberInfo>,
        member_count: u32,

        // ----- Deposit bookkeeping -----
        // (member, round) -> deposited?
        deposit_marker: Mapping<(AccountId, u32), bool>,
        // round -> count of deposits in that round
        deposits_in_round: Mapping<u32, u32>,

        // ----- Withdrawal requests -----
        next_request_id: RequestId,
        requests: Mapping<RequestId, WithdrawalRequest>,
    }

    #[ink(event)]
    pub struct MemberAdded {
        #[ink(topic)]
        member: AccountId,
    }

    #[ink(event)]
    pub struct DepositMade {
        #[ink(topic)]
        member: AccountId,
        amount: Balance,
        round: u32,
        on_time: bool,
    }

    /// Listened to by the off-chain Requester Agent.
    #[ink(event)]
    pub struct WithdrawalRequested {
        #[ink(topic)]
        req_id: RequestId,
        #[ink(topic)]
        requester: AccountId,
        amount: Balance,
        reason_cid: ReasoningCid,
        round: u32,
    }

    #[ink(event)]
    pub struct WithdrawalFinalized {
        #[ink(topic)]
        req_id: RequestId,
        approved: bool,
        confidence_bps: u32,
    }

    #[ink(event)]
    pub struct WithdrawalExecuted {
        #[ink(topic)]
        req_id: RequestId,
        #[ink(topic)]
        recipient: AccountId,
        amount: Balance,
    }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        NotRegistry,
        NotVotingEngine,
        NotMember,
        AlreadyMember,
        GroupFull,
        WrongDepositAmount,
        AlreadyDepositedThisRound,
        ZeroAmount,
        AmountExceedsBalance,
        RequestNotFound,
        RequestNotApproved,
        AlreadyExecuted,
        AlreadyFinalized,
        TreasuryCallFailed,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl ArisanGroup {
        #[ink(constructor)]
        pub fn new(
            group_id: u64,
            group_registry: AccountId,
            treasury: AccountId,
            voting_engine: AccountId,
            founder: AccountId,
            contribution_amount: Balance,
            period_days: u32,
            max_members: u32,
        ) -> Self {
            let now = Self::env().block_timestamp();
            // Construct first with default Mappings (so each field gets the
            // storage's resolved key type), then insert the founder member.
            let mut instance = Self {
                group_id,
                founder,
                group_registry,
                treasury,
                voting_engine,
                contribution_amount,
                period_days,
                max_members,
                created_at_ms: now,
                members: Mapping::default(),
                member_count: 1,
                deposit_marker: Mapping::default(),
                deposits_in_round: Mapping::default(),
                next_request_id: 1,
                requests: Mapping::default(),
            };
            instance.members.insert(
                founder,
                &MemberInfo {
                    joined_at_ms: now,
                    total_deposits: 0,
                    on_time_deposits: 0,
                    consecutive_on_time: 0,
                    active: true,
                },
            );
            instance
        }

        /// Adds a new member. Only the GroupRegistry contract may call this —
        /// the registry enforces the group's join policy first.
        #[ink(message)]
        pub fn add_member(&mut self, new_member: AccountId) -> Result<()> {
            if self.env().caller() != self.group_registry {
                return Err(Error::NotRegistry);
            }
            if self.members.get(new_member).map(|m| m.active).unwrap_or(false) {
                return Err(Error::AlreadyMember);
            }
            if self.member_count >= self.max_members {
                return Err(Error::GroupFull);
            }
            self.members.insert(
                new_member,
                &MemberInfo {
                    joined_at_ms: self.env().block_timestamp(),
                    total_deposits: 0,
                    on_time_deposits: 0,
                    consecutive_on_time: 0,
                    active: true,
                },
            );
            self.member_count = self.member_count.saturating_add(1);
            self.env().emit_event(MemberAdded { member: new_member });
            Ok(())
        }

        /// Member contributes `contribution_amount` POT for the current round.
        /// POT is forwarded to Treasury; this contract holds NO funds itself.
        ///
        /// Order: checks → call Treasury → on success, update bookkeeping.
        /// Reverses textbook CEI because Treasury is trusted code (deployed
        /// alongside this contract) and does not call back into ArisanGroup.
        /// If Treasury rejects, bookkeeping must NOT mark the deposit as made.
        #[ink(message, payable)]
        pub fn deposit(&mut self) -> Result<()> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            // ---- CHECKS ----
            let mut info = self.members.get(caller).ok_or(Error::NotMember)?;
            if !info.active {
                return Err(Error::NotMember);
            }
            if amount != self.contribution_amount {
                return Err(Error::WrongDepositAmount);
            }

            let round = self.current_round();
            if self.deposit_marker.get((caller, round)).unwrap_or(false) {
                return Err(Error::AlreadyDepositedThisRound);
            }

            // ---- INTERACTIONS — forward POT to Treasury ----
            // Treasury's deposit_funds returns Result<(), TreasuryError>; we
            // decode the error variant as u8 (its SCALE discriminant) because
            // we don't have direct access to Treasury's Error enum without a
            // cross-crate dependency. A non-zero discriminant means Treasury
            // rejected the call.
            let call_result = build_call::<DefaultEnvironment>()
                .call(self.treasury)
                .transferred_value(amount)
                .exec_input(
                    ExecutionInput::new(Selector::new(SEL_TREASURY_DEPOSIT_FUNDS))
                        .push_arg(self.group_id),
                )
                .returns::<core::result::Result<(), u8>>()
                .try_invoke();

            match call_result {
                Ok(Ok(Ok(()))) => { /* success */ }
                _ => return Err(Error::TreasuryCallFailed),
            }

            // ---- EFFECTS (only after Treasury accepted the funds) ----
            self.deposit_marker.insert((caller, round), &true);
            let new_count = self
                .deposits_in_round
                .get(round)
                .unwrap_or(0)
                .saturating_add(1);
            self.deposits_in_round.insert(round, &new_count);

            let on_time = true; // TODO (audit M-2): detect late vs on-time
            info.total_deposits = info.total_deposits.saturating_add(1);
            info.on_time_deposits = info.on_time_deposits.saturating_add(1);
            info.consecutive_on_time = info.consecutive_on_time.saturating_add(1);
            self.members.insert(caller, &info);

            self.env().emit_event(DepositMade {
                member: caller,
                amount,
                round,
                on_time,
            });
            Ok(())
        }

        /// Member opens a withdrawal request. Emits an event that the off-chain
        /// Requester Agent picks up to start the pre-validation flow.
        #[ink(message)]
        pub fn request_withdrawal(
            &mut self,
            amount: Balance,
            reason_cid: ReasoningCid,
        ) -> Result<RequestId> {
            let caller = self.env().caller();
            let info = self.members.get(caller).ok_or(Error::NotMember)?;
            if !info.active {
                return Err(Error::NotMember);
            }
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            let req_id = self.next_request_id;
            self.next_request_id = self.next_request_id.saturating_add(1);
            let round = self.current_round();
            let now = self.env().block_timestamp();

            self.requests.insert(
                req_id,
                &WithdrawalRequest {
                    requester: caller,
                    amount,
                    reason_cid,
                    status: RequestStatus::Pending,
                    round_when_requested: round,
                    created_at_ms: now,
                },
            );

            self.env().emit_event(WithdrawalRequested {
                req_id,
                requester: caller,
                amount,
                reason_cid,
                round,
            });
            Ok(req_id)
        }

        /// Called by VotingEngine after `finalize()`. Records the outcome.
        /// If approved, the request becomes ready for `execute()`.
        ///
        /// AUDIT H-1 fix: only `Pending` requests can transition. Prevents
        /// VotingEngine from flipping an already-Executed request back to
        /// Rejected via a buggy or replayed call.
        #[ink(message)]
        pub fn on_voting_finalized(
            &mut self,
            req_id: RequestId,
            approved: bool,
            confidence_bps: u32,
        ) -> Result<()> {
            if self.env().caller() != self.voting_engine {
                return Err(Error::NotVotingEngine);
            }
            let mut req = self.requests.get(req_id).ok_or(Error::RequestNotFound)?;

            // Status guard — only Pending may finalize.
            if req.status != RequestStatus::Pending {
                return Err(Error::AlreadyFinalized);
            }

            req.status = if approved {
                RequestStatus::Approved
            } else {
                RequestStatus::Rejected
            };
            self.requests.insert(req_id, &req);

            self.env().emit_event(WithdrawalFinalized {
                req_id,
                approved,
                confidence_bps,
            });
            Ok(())
        }

        /// Anyone may trigger payout once a request is Approved.
        /// Calls Treasury.release() — Treasury verifies the caller (us) was
        /// itself called from VotingEngine, so the trust chain holds.
        ///
        /// Order: status check → mark Executed → call Treasury → emit.
        /// In ink!, `Result::Err` does not revert state, so we use ONE
        /// principle: if Treasury.release returns an error, we revert our
        /// status flip manually before returning. (Treasury's internal panic
        /// on `env::transfer` failure handles the harder case for us.)
        #[ink(message)]
        pub fn execute(&mut self, req_id: RequestId) -> Result<()> {
            let mut req = self.requests.get(req_id).ok_or(Error::RequestNotFound)?;
            match req.status {
                RequestStatus::Approved => {}
                RequestStatus::Executed => return Err(Error::AlreadyExecuted),
                _ => return Err(Error::RequestNotApproved),
            }

            // EFFECTS (optimistically mark Executed)
            req.status = RequestStatus::Executed;
            self.requests.insert(req_id, &req);

            // INTERACTIONS — Treasury.release(req_id, group_id, recipient, amount)
            let call_result = build_call::<DefaultEnvironment>()
                .call(self.treasury)
                .exec_input(
                    ExecutionInput::new(Selector::new(SEL_TREASURY_RELEASE))
                        .push_arg(req_id)
                        .push_arg(self.group_id)
                        .push_arg(req.requester)
                        .push_arg(req.amount),
                )
                .returns::<core::result::Result<(), u8>>()
                .try_invoke();

            match call_result {
                Ok(Ok(Ok(()))) => { /* success */ }
                _ => {
                    // Revert the optimistic status flip — ink! does not auto-revert
                    // on `Result::Err`. Without this, repeated execute() calls would
                    // hit `AlreadyExecuted` even though no funds moved.
                    req.status = RequestStatus::Approved;
                    self.requests.insert(req_id, &req);
                    return Err(Error::TreasuryCallFailed);
                }
            }

            self.env().emit_event(WithdrawalExecuted {
                req_id,
                recipient: req.requester,
                amount: req.amount,
            });
            Ok(())
        }

        // ----- Read-only views -----

        /// Current round number, 1-indexed. Computed from block timestamp — no
        /// storage writes needed on round rollover.
        #[ink(message)]
        pub fn current_round(&self) -> u32 {
            let elapsed_ms = self.env().block_timestamp().saturating_sub(self.created_at_ms);
            let period_ms = (self.period_days as u64).saturating_mul(MS_PER_DAY);
            if period_ms == 0 {
                return 1;
            }
            let rounds = elapsed_ms.checked_div(period_ms).unwrap_or(0);
            u32::try_from(rounds).unwrap_or(u32::MAX).saturating_add(1)
        }

        #[ink(message)]
        pub fn get_member(&self, account: AccountId) -> Option<MemberInfo> {
            self.members.get(account)
        }

        #[ink(message)]
        pub fn member_count(&self) -> u32 {
            self.member_count
        }

        #[ink(message)]
        pub fn has_deposited_in_round(&self, account: AccountId, round: u32) -> bool {
            self.deposit_marker.get((account, round)).unwrap_or(false)
        }

        #[ink(message)]
        pub fn deposits_in_round_count(&self, round: u32) -> u32 {
            self.deposits_in_round.get(round).unwrap_or(0)
        }

        #[ink(message)]
        pub fn get_request(&self, req_id: RequestId) -> Option<WithdrawalRequest> {
            self.requests.get(req_id)
        }

        #[ink(message)]
        pub fn group_id(&self) -> u64 {
            self.group_id
        }

        #[ink(message)]
        pub fn contribution_amount(&self) -> Balance {
            self.contribution_amount
        }
    }

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    #[cfg(test)]
    mod tests {
        use super::*;

        fn alice() -> AccountId {
            AccountId::from([0x01; 32])
        }
        fn dummy_addr(b: u8) -> AccountId {
            AccountId::from([b; 32])
        }

        fn new_group() -> ArisanGroup {
            ArisanGroup::new(
                1,
                dummy_addr(0xAA), // group_registry
                dummy_addr(0xBB), // treasury
                dummy_addr(0xCC), // voting_engine
                alice(),          // founder
                100,              // contribution_amount
                30,               // period_days
                5,                // max_members
            )
        }

        #[ink::test]
        fn founder_is_first_member() {
            let g = new_group();
            assert_eq!(g.member_count(), 1);
            assert!(g.get_member(alice()).map(|m| m.active).unwrap_or(false));
        }

        #[ink::test]
        fn current_round_starts_at_one() {
            let g = new_group();
            assert_eq!(g.current_round(), 1);
        }

        #[ink::test]
        fn non_member_cannot_request_withdrawal() {
            let mut g = new_group();
            // simulate a different caller (bob)
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(dummy_addr(0x02));
            let res = g.request_withdrawal(50, [0u8; 32]);
            assert_eq!(res, Err(Error::NotMember));
        }
    }
}
