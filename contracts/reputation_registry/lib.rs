#![cfg_attr(not(feature = "std"), no_std, no_main)]

// ReputationRegistry — Global, cross-group per-account reputation for Auralis.
// Score range 0..=1000. Composite weighted from on-chain signals.
#[ink::contract]
mod reputation_registry {
    use ink::storage::Mapping;

    pub const MAX_SCORE: u32 = 1000;

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum Tier { Bronze, Silver, Gold, Platinum }

    /// Reason codes for ReputationUpdated event (kept compact for gas).
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum Reason {
        DepositOnTime,
        DepositLate,
        VoteCast,
        VoteAgreedMajority,
        VoteAgainstMajority,
        DisputeRaised,
        DisputeLost,
        BadgeBonus,
        CrossGroupPenalty,
        Manual,
    }

    #[derive(Debug, Clone, PartialEq, Eq, Default)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Stats {
        pub score: u32,
        pub deposits_made: u32,
        pub deposits_on_time: u32,
        pub votes_cast: u32,
        pub votes_with_majority: u32,
        pub disputes_raised: u32,
        pub groups_joined: u32,
        pub badge_count: u32,
    }

    #[ink(storage)]
    pub struct ReputationRegistry {
        owner: AccountId,
        badge_nft: AccountId,
        whitelisted_writers: Mapping<AccountId, bool>, // ArisanGroup, VotingEngine
        stats: Mapping<AccountId, Stats>,
    }

    #[ink(event)]
    pub struct ReputationUpdated {
        #[ink(topic)]
        account: AccountId,
        old_score: u32,
        new_score: u32,
        reason: Reason,
    }

    #[ink(event)]
    pub struct WriterWhitelisted {
        #[ink(topic)]
        writer: AccountId,
    }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        NotOwner,
        NotWhitelistedWriter,
        ScoreOverflow,
        InvalidDelta,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl ReputationRegistry {
        #[ink(constructor)]
        pub fn new(badge_nft: AccountId) -> Self {
            Self {
                owner: Self::env().caller(),
                badge_nft,
                whitelisted_writers: Mapping::default(),
                stats: Mapping::default(),
            }
        }

        #[ink(message)]
        pub fn get_score(&self, account: AccountId) -> u32 {
            self.stats.get(account).map(|s| s.score).unwrap_or(0)
        }

        #[ink(message)]
        pub fn get_stats(&self, account: AccountId) -> Stats {
            self.stats.get(account).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_tier(&self, account: AccountId) -> Tier {
            let score = self.get_score(account);
            match score {
                0..=250 => Tier::Bronze,
                251..=500 => Tier::Silver,
                501..=750 => Tier::Gold,
                _ => Tier::Platinum,
            }
        }

        /// Vote-weight multiplier in basis points (1.0 = 10_000).
        /// Formula: base 5_000 + score×10 (range 5_000..=15_000), then
        /// boosted by trusted-badge count, capped at 15_000.
        /// VotingEngine calls this on every `cast_vote`.
        #[ink(message)]
        pub fn get_weight_bps(&self, account: AccountId) -> u32 {
            let stats = self.stats.get(account).unwrap_or_default();
            let base = 5_000u32.saturating_add(stats.score.saturating_mul(10));
            // trusted badges contribute +10% each (capped at total 15_000)
            let boosted = base.saturating_add(
                1_000u32.saturating_mul(stats.badge_count),
            );
            core::cmp::min(boosted, 15_000)
        }

        /// Whitelisted writers (ArisanGroup, VotingEngine) push score deltas.
        /// `delta_signed` is i32 to allow penalties without underflow.
        /// Returns the NEW clamped score.
        #[ink(message)]
        pub fn update_score(
            &mut self,
            account: AccountId,
            delta_signed: i32,
            reason: Reason,
        ) -> Result<u32> {
            if !self.whitelisted_writers.get(self.env().caller()).unwrap_or(false) {
                return Err(Error::NotWhitelistedWriter);
            }

            let mut stats = self.stats.get(account).unwrap_or_default();
            let old_score = stats.score;

            // Apply delta with explicit saturating math.
            stats.score = if delta_signed >= 0 {
                old_score.saturating_add(delta_signed as u32)
            } else {
                old_score.saturating_sub((-delta_signed) as u32)
            };
            if stats.score > MAX_SCORE {
                stats.score = MAX_SCORE;
            }

            // Maintain semantic counters based on the reason code.
            match reason {
                Reason::DepositOnTime => {
                    stats.deposits_made = stats.deposits_made.saturating_add(1);
                    stats.deposits_on_time = stats.deposits_on_time.saturating_add(1);
                }
                Reason::DepositLate => {
                    stats.deposits_made = stats.deposits_made.saturating_add(1);
                }
                Reason::VoteCast => {
                    stats.votes_cast = stats.votes_cast.saturating_add(1);
                }
                Reason::VoteAgreedMajority => {
                    stats.votes_with_majority = stats.votes_with_majority.saturating_add(1);
                }
                Reason::DisputeRaised => {
                    stats.disputes_raised = stats.disputes_raised.saturating_add(1);
                }
                _ => {}
            }

            self.stats.insert(account, &stats);

            self.env().emit_event(ReputationUpdated {
                account,
                old_score,
                new_score: stats.score,
                reason,
            });
            Ok(stats.score)
        }

        /// Whitelisted writer increments badge_count after BadgeNFT mints.
        /// Kept separate from `update_score` so badge bonus reputation is
        /// distinct from the badge count signal.
        #[ink(message)]
        pub fn increment_badge_count(&mut self, account: AccountId) -> Result<()> {
            if !self.whitelisted_writers.get(self.env().caller()).unwrap_or(false) {
                return Err(Error::NotWhitelistedWriter);
            }
            let mut stats = self.stats.get(account).unwrap_or_default();
            stats.badge_count = stats.badge_count.saturating_add(1);
            self.stats.insert(account, &stats);
            Ok(())
        }

        /// Cross-group lookup — same as get_stats for now; future versions can
        /// expose per-group breakdown when ArisanGroup reports per-group metrics.
        #[ink(message)]
        pub fn cross_group_lookup(&self, account: AccountId) -> Stats {
            self.get_stats(account)
        }

        #[ink(message)]
        pub fn add_whitelisted_writer(&mut self, writer: AccountId) -> Result<()> {
            if self.env().caller() != self.owner {
                return Err(Error::NotOwner);
            }
            self.whitelisted_writers.insert(writer, &true);
            self.env().emit_event(WriterWhitelisted { writer });
            Ok(())
        }

        #[ink(message)]
        pub fn is_whitelisted_writer(&self, addr: AccountId) -> bool {
            self.whitelisted_writers.get(addr).unwrap_or(false)
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn unknown_account_is_bronze() {
            let reg = ReputationRegistry::new(AccountId::from([0xAA; 32]));
            assert_eq!(reg.get_score(AccountId::from([0x01; 32])), 0);
            assert_eq!(reg.get_tier(AccountId::from([0x01; 32])), Tier::Bronze);
        }
    }
}
