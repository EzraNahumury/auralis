#![cfg_attr(not(feature = "std"), no_std, no_main)]

// AgentRegistry — Onchain binding between a user's wallet and their delegated
// Reviewer Agent signing key, plus the voting policy the agent should follow.
//
// VotingEngine reads `owner_of(agent_key)` to verify that an incoming vote
// transaction is being signed by a legitimately-delegated agent.
//
// Why onchain (vs. an internal backend table):
//  - Trustless authentication for VotingEngine (no centralized backend trust)
//  - Public, timestamped policy declarations (cannot be retro-edited)
//  - User-initiated revocation effective in the next block
//  - Cross-group reputation can be linked to (user, agent) tuples
#[ink::contract]
mod agent_registry {
    use ink::storage::Mapping;

    pub type PolicyCid = [u8; 32]; // IPFS CID of the full policy / prompt template

    /// Voting persona — drives Reviewer Agent decisions off-chain.
    /// The semantic meaning lives in the agent's prompt template; this enum
    /// is just the on-chain attestation of which persona the user picked.
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum Policy {
        Conservative,    // lean reject unless strong evidence
        TrustDefault,    // lean approve unless red flags
        StrictEmergency, // approve only for verified emergencies
        Custom,          // policy_cid points to a user-authored prompt
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct AgentBinding {
        pub user: AccountId,        // wallet of the human owner
        pub agent_key: AccountId,   // delegated signer the agent uses
        pub policy: Policy,
        pub policy_cid: PolicyCid,  // IPFS hash of the detailed prompt/config
        pub active: bool,
        pub registered_at_ms: u64,
        pub last_updated_ms: u64,
        pub revision: u32,          // bumped on every policy/key change
    }

    #[ink(storage)]
    pub struct AgentRegistry {
        owner: AccountId,
        // Forward index — used by VotingEngine on every vote.
        binding_by_agent: Mapping<AccountId, AgentBinding>,
        // Reverse index — user wallet -> their currently-active agent key.
        agent_of_user: Mapping<AccountId, AccountId>,
        // Counter of total bindings ever registered (for stats / off-chain pagination).
        total_registered: u64,
    }

    #[ink(event)]
    pub struct AgentRegistered {
        #[ink(topic)]
        user: AccountId,
        #[ink(topic)]
        agent_key: AccountId,
        policy: Policy,
        policy_cid: PolicyCid,
    }

    #[ink(event)]
    pub struct PolicyUpdated {
        #[ink(topic)]
        user: AccountId,
        old_policy: Policy,
        new_policy: Policy,
        new_policy_cid: PolicyCid,
        revision: u32,
    }

    #[ink(event)]
    pub struct AgentReplaced {
        #[ink(topic)]
        user: AccountId,
        #[ink(topic)]
        old_agent_key: AccountId,
        #[ink(topic)]
        new_agent_key: AccountId,
        revision: u32,
    }

    #[ink(event)]
    pub struct AgentRevoked {
        #[ink(topic)]
        user: AccountId,
        #[ink(topic)]
        agent_key: AccountId,
    }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        NotOwner,
        NoAgentBound,
        AgentAlreadyBound,    // this user already has an active agent
        AgentKeyTaken,        // this agent_key is bound to a different user
        InactiveBinding,
        InvalidAgentKey,      // tried to bind agent_key == user wallet
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl AgentRegistry {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                binding_by_agent: Mapping::default(),
                agent_of_user: Mapping::default(),
                total_registered: 0,
            }
        }

        /// User delegates `agent_key` as their Reviewer Agent signer.
        /// Must be called by the human wallet, not by the agent.
        #[ink(message)]
        pub fn register_agent(
            &mut self,
            agent_key: AccountId,
            policy: Policy,
            policy_cid: PolicyCid,
        ) -> Result<()> {
            let user = self.env().caller();

            if agent_key == user {
                return Err(Error::InvalidAgentKey);
            }
            if self.agent_of_user.contains(user) {
                return Err(Error::AgentAlreadyBound);
            }
            if let Some(existing) = self.binding_by_agent.get(agent_key) {
                if existing.active {
                    return Err(Error::AgentKeyTaken);
                }
            }

            let now = self.env().block_timestamp();
            let binding = AgentBinding {
                user,
                agent_key,
                policy,
                policy_cid,
                active: true,
                registered_at_ms: now,
                last_updated_ms: now,
                revision: 1,
            };

            self.binding_by_agent.insert(agent_key, &binding);
            self.agent_of_user.insert(user, &agent_key);
            self.total_registered = self.total_registered.saturating_add(1);

            self.env().emit_event(AgentRegistered {
                user,
                agent_key,
                policy,
                policy_cid,
            });
            Ok(())
        }

        /// User updates their voting policy (e.g. swap Conservative → TrustDefault).
        /// Bumps revision so off-chain orchestrator can detect change and
        /// re-load the new prompt config.
        #[ink(message)]
        pub fn update_policy(
            &mut self,
            new_policy: Policy,
            new_policy_cid: PolicyCid,
        ) -> Result<()> {
            let user = self.env().caller();
            let agent_key = self.agent_of_user.get(user).ok_or(Error::NoAgentBound)?;
            let mut binding = self
                .binding_by_agent
                .get(agent_key)
                .ok_or(Error::NoAgentBound)?;
            if !binding.active {
                return Err(Error::InactiveBinding);
            }

            let old_policy = binding.policy;
            binding.policy = new_policy;
            binding.policy_cid = new_policy_cid;
            binding.last_updated_ms = self.env().block_timestamp();
            binding.revision = binding.revision.saturating_add(1);

            self.binding_by_agent.insert(agent_key, &binding);

            self.env().emit_event(PolicyUpdated {
                user,
                old_policy,
                new_policy,
                new_policy_cid,
                revision: binding.revision,
            });
            Ok(())
        }

        /// Rotate the agent signing key (e.g. compromised key, new server).
        /// Keeps revision history continuous.
        #[ink(message)]
        pub fn replace_agent(&mut self, new_agent_key: AccountId) -> Result<()> {
            let user = self.env().caller();

            if new_agent_key == user {
                return Err(Error::InvalidAgentKey);
            }
            let old_agent_key = self.agent_of_user.get(user).ok_or(Error::NoAgentBound)?;
            if let Some(existing) = self.binding_by_agent.get(new_agent_key) {
                if existing.active {
                    return Err(Error::AgentKeyTaken);
                }
            }

            let mut binding = self
                .binding_by_agent
                .get(old_agent_key)
                .ok_or(Error::NoAgentBound)?;
            if !binding.active {
                return Err(Error::InactiveBinding);
            }

            // Mark old binding inactive but keep it for historical lookup.
            binding.active = false;
            self.binding_by_agent.insert(old_agent_key, &binding);

            // Insert new binding inheriting policy from old.
            let now = self.env().block_timestamp();
            let new_binding = AgentBinding {
                user,
                agent_key: new_agent_key,
                policy: binding.policy,
                policy_cid: binding.policy_cid,
                active: true,
                registered_at_ms: binding.registered_at_ms,
                last_updated_ms: now,
                revision: binding.revision.saturating_add(1),
            };
            self.binding_by_agent.insert(new_agent_key, &new_binding);
            self.agent_of_user.insert(user, &new_agent_key);

            self.env().emit_event(AgentReplaced {
                user,
                old_agent_key,
                new_agent_key,
                revision: new_binding.revision,
            });
            Ok(())
        }

        /// User revokes their agent. Future votes signed by this `agent_key`
        /// will be rejected by VotingEngine because `owner_of` returns None.
        #[ink(message)]
        pub fn revoke_agent(&mut self) -> Result<()> {
            let user = self.env().caller();
            let agent_key = self.agent_of_user.get(user).ok_or(Error::NoAgentBound)?;
            let mut binding = self
                .binding_by_agent
                .get(agent_key)
                .ok_or(Error::NoAgentBound)?;
            if !binding.active {
                return Err(Error::InactiveBinding);
            }

            binding.active = false;
            binding.last_updated_ms = self.env().block_timestamp();
            self.binding_by_agent.insert(agent_key, &binding);
            self.agent_of_user.remove(user);

            self.env().emit_event(AgentRevoked { user, agent_key });
            Ok(())
        }

        // ----- Read-only views (used heavily by VotingEngine) -----

        /// VotingEngine calls this on every `cast_vote` to map agent_key → user.
        /// Returns None if the binding is missing or has been revoked.
        #[ink(message)]
        pub fn owner_of(&self, agent_key: AccountId) -> Option<AccountId> {
            self.binding_by_agent
                .get(agent_key)
                .filter(|b| b.active)
                .map(|b| b.user)
        }

        #[ink(message)]
        pub fn agent_of(&self, user: AccountId) -> Option<AccountId> {
            self.agent_of_user.get(user)
        }

        #[ink(message)]
        pub fn policy_of(&self, user: AccountId) -> Option<Policy> {
            let agent = self.agent_of_user.get(user)?;
            self.binding_by_agent.get(agent).map(|b| b.policy)
        }

        #[ink(message)]
        pub fn get_binding(&self, agent_key: AccountId) -> Option<AgentBinding> {
            self.binding_by_agent.get(agent_key)
        }

        #[ink(message)]
        pub fn is_active(&self, agent_key: AccountId) -> bool {
            self.binding_by_agent
                .get(agent_key)
                .map(|b| b.active)
                .unwrap_or(false)
        }

        #[ink(message)]
        pub fn total_registered(&self) -> u64 {
            self.total_registered
        }
    }

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        fn user(b: u8) -> AccountId { AccountId::from([b; 32]) }

        fn set_caller(c: AccountId) {
            test::set_caller::<ink::env::DefaultEnvironment>(c);
        }

        #[ink::test]
        fn register_and_lookup() {
            let mut reg = AgentRegistry::new();
            set_caller(user(0x01));
            reg.register_agent(user(0xA1), Policy::Conservative, [0u8; 32]).unwrap();

            assert_eq!(reg.owner_of(user(0xA1)), Some(user(0x01)));
            assert_eq!(reg.agent_of(user(0x01)), Some(user(0xA1)));
            assert_eq!(reg.policy_of(user(0x01)), Some(Policy::Conservative));
            assert!(reg.is_active(user(0xA1)));
        }

        #[ink::test]
        fn cannot_bind_self_as_agent() {
            let mut reg = AgentRegistry::new();
            set_caller(user(0x01));
            let r = reg.register_agent(user(0x01), Policy::TrustDefault, [0u8; 32]);
            assert_eq!(r, Err(Error::InvalidAgentKey));
        }

        #[ink::test]
        fn cannot_double_register() {
            let mut reg = AgentRegistry::new();
            set_caller(user(0x01));
            reg.register_agent(user(0xA1), Policy::Conservative, [0u8; 32]).unwrap();
            let r = reg.register_agent(user(0xA2), Policy::Conservative, [0u8; 32]);
            assert_eq!(r, Err(Error::AgentAlreadyBound));
        }

        #[ink::test]
        fn revoke_clears_owner_of() {
            let mut reg = AgentRegistry::new();
            set_caller(user(0x01));
            reg.register_agent(user(0xA1), Policy::Conservative, [0u8; 32]).unwrap();
            reg.revoke_agent().unwrap();
            assert_eq!(reg.owner_of(user(0xA1)), None);
            assert_eq!(reg.agent_of(user(0x01)), None);
        }

        #[ink::test]
        fn replace_rotates_key_and_inherits_policy() {
            let mut reg = AgentRegistry::new();
            set_caller(user(0x01));
            reg.register_agent(user(0xA1), Policy::StrictEmergency, [9u8; 32]).unwrap();
            reg.replace_agent(user(0xA2)).unwrap();

            assert_eq!(reg.owner_of(user(0xA1)), None); // old inactive
            assert_eq!(reg.owner_of(user(0xA2)), Some(user(0x01)));
            assert_eq!(reg.policy_of(user(0x01)), Some(Policy::StrictEmergency));
        }
    }
}
