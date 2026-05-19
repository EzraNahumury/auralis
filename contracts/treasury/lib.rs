#![cfg_attr(not(feature = "std"), no_std, no_main)]

// Treasury — Holds POT funds for every Auralis group. Funds may ONLY be
// released by the VotingEngine after a withdrawal request is approved.
//
// SECURITY:
//  - Strict checks-effects-interactions in `release()` to prevent reentrancy.
//  - Per-request replay guard via `executed_requests`.
//  - Whitelist-gated deposit (only registered ArisanGroup contracts).
#[ink::contract]
mod treasury {
    use ink::storage::Mapping;

    pub type GroupId = u64;
    pub type RequestId = u64;

    #[ink(storage)]
    pub struct Treasury {
        owner: AccountId,
        voting_engine: AccountId,
        // group_id -> ArisanGroup contract address (whitelist)
        group_of: Mapping<GroupId, AccountId>,
        // reverse: ArisanGroup addr -> group_id (used in deposit_funds auth)
        arisan_group_to_id: Mapping<AccountId, GroupId>,
        // per-group POT balance held in escrow
        group_balances: Mapping<GroupId, Balance>,
        // anti-replay for VotingEngine.release calls
        executed_requests: Mapping<RequestId, bool>,
    }

    #[ink(event)]
    pub struct FundsDeposited {
        #[ink(topic)]
        group_id: GroupId,
        #[ink(topic)]
        from: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct FundsReleased {
        #[ink(topic)]
        group_id: GroupId,
        #[ink(topic)]
        req_id: RequestId,
        #[ink(topic)]
        to: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct FundsRefunded {
        #[ink(topic)]
        group_id: GroupId,
        #[ink(topic)]
        member: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct ArisanGroupRegistered {
        #[ink(topic)]
        group_id: GroupId,
        #[ink(topic)]
        arisan_group_addr: AccountId,
    }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        NotOwner,
        NotVotingEngine,
        NotWhitelistedGroup,
        GroupAlreadyRegistered,
        GroupNotFound,
        InsufficientBalance,
        AlreadyReleased,
        ZeroAmount,
        TransferFailed,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl Treasury {
        #[ink(constructor)]
        pub fn new(voting_engine: AccountId) -> Self {
            Self {
                owner: Self::env().caller(),
                voting_engine,
                group_of: Mapping::default(),
                arisan_group_to_id: Mapping::default(),
                group_balances: Mapping::default(),
                executed_requests: Mapping::default(),
            }
        }

        /// Receive POT on behalf of a group. Caller MUST be the registered
        /// ArisanGroup contract for `group_id`.
        #[ink(message, payable)]
        pub fn deposit_funds(&mut self, group_id: GroupId) -> Result<()> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            // CHECKS
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }
            let registered_id = self
                .arisan_group_to_id
                .get(caller)
                .ok_or(Error::NotWhitelistedGroup)?;
            if registered_id != group_id {
                return Err(Error::NotWhitelistedGroup);
            }

            // EFFECTS
            let prev = self.group_balances.get(group_id).unwrap_or(0);
            self.group_balances
                .insert(group_id, &prev.saturating_add(amount));

            // EMIT
            self.env().emit_event(FundsDeposited {
                group_id,
                from: caller,
                amount,
            });
            Ok(())
        }

        /// Release funds — gated to VotingEngine only.
        ///
        /// SECURITY: Strict checks-effects-interactions, and `env::transfer`
        /// failure is converted to a panic so the runtime reverts ALL state
        /// changes (debit + executed marker). In ink!, `Result::Err` does NOT
        /// revert state — only panic does. (Audit item H-3.)
        #[ink(message)]
        pub fn release(
            &mut self,
            req_id: RequestId,
            group_id: GroupId,
            recipient: AccountId,
            amount: Balance,
        ) -> Result<()> {
            // ---- CHECKS ----
            if self.env().caller() != self.voting_engine {
                return Err(Error::NotVotingEngine);
            }
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }
            if self.executed_requests.get(req_id).unwrap_or(false) {
                return Err(Error::AlreadyReleased);
            }
            let bal = self
                .group_balances
                .get(group_id)
                .ok_or(Error::GroupNotFound)?;
            if bal < amount {
                return Err(Error::InsufficientBalance);
            }

            // ---- EFFECTS ----
            self.executed_requests.insert(req_id, &true);
            self.group_balances.insert(group_id, &bal.saturating_sub(amount));

            // ---- INTERACTIONS ----
            // Panic-on-failure forces a full tx revert, restoring the
            // debit + executed marker. This is the ink! equivalent of
            // Solidity's `require(success, "transfer failed")`.
            self.env()
                .transfer(recipient, amount)
                .expect("treasury: env::transfer failed");

            self.env().emit_event(FundsReleased {
                group_id,
                req_id,
                to: recipient,
                amount,
            });
            Ok(())
        }

        /// Refund a member (group dissolve / emergency).
        /// Same CEI pattern + panic-on-transfer-failure as `release`.
        /// Gated to VotingEngine — refunds must be vote-decided.
        #[ink(message)]
        pub fn refund(
            &mut self,
            group_id: GroupId,
            member: AccountId,
            amount: Balance,
        ) -> Result<()> {
            if self.env().caller() != self.voting_engine {
                return Err(Error::NotVotingEngine);
            }
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }
            let bal = self
                .group_balances
                .get(group_id)
                .ok_or(Error::GroupNotFound)?;
            if bal < amount {
                return Err(Error::InsufficientBalance);
            }

            self.group_balances.insert(group_id, &bal.saturating_sub(amount));

            self.env()
                .transfer(member, amount)
                .expect("treasury: env::transfer failed (refund)");

            self.env().emit_event(FundsRefunded {
                group_id,
                member,
                amount,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn balance_of(&self, group_id: GroupId) -> Balance {
            self.group_balances.get(group_id).unwrap_or(0)
        }

        /// Owner registers a freshly-deployed ArisanGroup as a deposit source
        /// for a group_id. Each ArisanGroup may be registered to exactly one group.
        #[ink(message)]
        pub fn register_arisan_group(
            &mut self,
            group_id: GroupId,
            arisan_group_addr: AccountId,
        ) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            if self.group_of.contains(group_id) {
                return Err(Error::GroupAlreadyRegistered);
            }
            self.group_of.insert(group_id, &arisan_group_addr);
            self.arisan_group_to_id
                .insert(arisan_group_addr, &group_id);

            self.env().emit_event(ArisanGroupRegistered {
                group_id,
                arisan_group_addr,
            });
            Ok(())
        }

        /// Owner can rotate the VotingEngine address (e.g. after redeploy).
        /// Fixes audit item M-4.
        #[ink(message)]
        pub fn set_voting_engine(&mut self, new_voting_engine: AccountId) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            self.voting_engine = new_voting_engine;
            Ok(())
        }

        #[ink(message)]
        pub fn voting_engine(&self) -> AccountId {
            self.voting_engine
        }

        #[ink(message)]
        pub fn is_executed(&self, req_id: RequestId) -> bool {
            self.executed_requests.get(req_id).unwrap_or(false)
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn empty_group_has_zero_balance() {
            let t = Treasury::new(AccountId::from([0xAA; 32]));
            assert_eq!(t.balance_of(1), 0);
        }
    }
}
