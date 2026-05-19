#![cfg_attr(not(feature = "std"), no_std, no_main)]

// BadgeNFT — Soulbound (non-transferable) NFT for Auralis attestations.
// Mints are gated to the ReputationRegistry contract only.
#[ink::contract]
mod badge_nft {
    use ink::storage::Mapping;

    pub type BadgeId = u64;

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum BadgeType {
        ConsistentPayer,    // +50 rep, after 12 on-time deposits
        TrustedMember,      // +75 rep, vote agreement >= 80% over 20 votes
        GroupFounder,       // +30 rep, group with >= 5 active members
        DisputeFree,        // +40 rep, 6 months no challenges
        CrossGroupVeteran,  // +60 rep, active in 3+ groups for 3+ months
    }

    #[ink(storage)]
    pub struct BadgeNFT {
        owner: AccountId,
        minter: AccountId,                                 // ReputationRegistry
        next_badge_id: BadgeId,
        badge_owner: Mapping<BadgeId, AccountId>,
        badge_kind: Mapping<BadgeId, BadgeType>,
        badge_minted_at: Mapping<BadgeId, u64>,
        // (account, badge_type_discriminant) -> count
        per_type_count: Mapping<(AccountId, u8), u32>,
        total_badges: Mapping<AccountId, u32>,
    }

    #[ink(event)]
    pub struct BadgeMinted {
        #[ink(topic)]
        account: AccountId,
        #[ink(topic)]
        badge_id: BadgeId,
        badge_type: BadgeType,
    }

    /// Logged whenever a transfer is attempted — soulbound, so always rejected.
    #[ink(event)]
    pub struct TransferRejected {
        #[ink(topic)]
        from: AccountId,
        #[ink(topic)]
        to: AccountId,
        badge_id: BadgeId,
    }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        NotOwner,
        NotMinter,
        BadgeNotFound,
        Soulbound, // explicit non-transferability
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl BadgeNFT {
        #[ink(constructor)]
        pub fn new(minter: AccountId) -> Self {
            Self {
                owner: Self::env().caller(),
                minter,
                next_badge_id: 1,
                badge_owner: Mapping::default(),
                badge_kind: Mapping::default(),
                badge_minted_at: Mapping::default(),
                per_type_count: Mapping::default(),
                total_badges: Mapping::default(),
            }
        }

        /// Mint a badge. Only callable by the configured minter (ReputationRegistry).
        #[ink(message)]
        pub fn mint_badge(&mut self, to: AccountId, badge_type: BadgeType) -> Result<BadgeId> {
            if self.env().caller() != self.minter {
                return Err(Error::NotMinter);
            }

            let id = self.next_badge_id;
            self.next_badge_id = self.next_badge_id.saturating_add(1);

            let now = self.env().block_timestamp();
            self.badge_owner.insert(id, &to);
            self.badge_kind.insert(id, &badge_type);
            self.badge_minted_at.insert(id, &now);

            let disc = Self::type_disc(badge_type);
            let prev_typed = self.per_type_count.get((to, disc)).unwrap_or(0);
            self.per_type_count
                .insert((to, disc), &prev_typed.saturating_add(1));

            let prev_total = self.total_badges.get(to).unwrap_or(0);
            self.total_badges
                .insert(to, &prev_total.saturating_add(1));

            self.env().emit_event(BadgeMinted {
                account: to,
                badge_id: id,
                badge_type,
            });
            Ok(id)
        }

        /// Owner can rotate the minter address (e.g. ReputationRegistry redeploy).
        #[ink(message)]
        pub fn set_minter(&mut self, new_minter: AccountId) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            self.minter = new_minter;
            Ok(())
        }

        #[ink(message)]
        pub fn minter(&self) -> AccountId {
            self.minter
        }

        #[ink(message)]
        pub fn owner_of(&self, badge_id: BadgeId) -> Option<AccountId> {
            self.badge_owner.get(badge_id)
        }

        #[ink(message)]
        pub fn badge_type_of(&self, badge_id: BadgeId) -> Option<BadgeType> {
            self.badge_kind.get(badge_id)
        }

        #[ink(message)]
        pub fn badge_count_by_type(&self, account: AccountId, badge_type: BadgeType) -> u32 {
            let disc = Self::type_disc(badge_type);
            self.per_type_count.get((account, disc)).unwrap_or(0)
        }

        #[ink(message)]
        pub fn total_of(&self, account: AccountId) -> u32 {
            self.total_badges.get(account).unwrap_or(0)
        }

        // ----- Soulbound — all transfer paths reject -----

        #[ink(message)]
        pub fn transfer(&mut self, to: AccountId, badge_id: BadgeId) -> Result<()> {
            self.env().emit_event(TransferRejected {
                from: self.env().caller(),
                to,
                badge_id,
            });
            Err(Error::Soulbound)
        }

        #[ink(message)]
        pub fn approve(&mut self, _spender: AccountId, _badge_id: BadgeId) -> Result<()> {
            Err(Error::Soulbound)
        }

        fn type_disc(t: BadgeType) -> u8 {
            match t {
                BadgeType::ConsistentPayer => 0,
                BadgeType::TrustedMember => 1,
                BadgeType::GroupFounder => 2,
                BadgeType::DisputeFree => 3,
                BadgeType::CrossGroupVeteran => 4,
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn transfer_always_fails() {
            let mut nft = BadgeNFT::new(AccountId::from([0xAA; 32]));
            let res = nft.transfer(AccountId::from([0x01; 32]), 1);
            assert_eq!(res, Err(Error::Soulbound));
        }
    }
}
