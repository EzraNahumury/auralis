#![cfg_attr(not(feature = "std"), no_std, no_main)]

// GroupRegistry — Factory & global directory for Auralis Arisan groups.
// Deploys new ArisanGroup instances and tracks them across the Portaldot chain.
#[ink::contract]
mod group_registry {
    use ink::storage::Mapping;

    pub type GroupId = u64;

    #[derive(Debug, Clone, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct GroupInfo {
        pub founder: AccountId,
        pub arisan_group_addr: AccountId,
        pub contribution_amount: Balance,
        pub period_days: u32,
        pub max_members: u32,
        pub member_count: u32,
        pub created_at: u64,
        pub active: bool,
    }

    #[ink(storage)]
    pub struct GroupRegistry {
        owner: AccountId,
        paused: bool,
        next_group_id: GroupId,
        groups: Mapping<GroupId, GroupInfo>,
        is_member: Mapping<(GroupId, AccountId), bool>,
    }

    #[ink(event)]
    pub struct GroupCreated {
        #[ink(topic)]
        group_id: GroupId,
        #[ink(topic)]
        founder: AccountId,
        arisan_group_addr: AccountId,
        contribution_amount: Balance,
        max_members: u32,
    }

    #[ink(event)]
    pub struct MemberJoined {
        #[ink(topic)]
        group_id: GroupId,
        #[ink(topic)]
        member: AccountId,
    }

    #[ink(event)]
    pub struct Paused { by: AccountId }

    #[ink(event)]
    pub struct Unpaused { by: AccountId }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        NotOwner,
        ContractPaused,
        GroupNotFound,
        GroupFull,
        GroupInactive,
        AlreadyMember,
        InvalidParameters,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl GroupRegistry {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                paused: false,
                next_group_id: 1,
                groups: Mapping::default(),
                is_member: Mapping::default(),
            }
        }

        /// Register a freshly-deployed ArisanGroup contract.
        /// The caller becomes the founder and is auto-enrolled as member #1.
        #[ink(message)]
        pub fn register_group(
            &mut self,
            arisan_group_addr: AccountId,
            contribution_amount: Balance,
            period_days: u32,
            max_members: u32,
        ) -> Result<GroupId> {
            if self.paused {
                return Err(Error::ContractPaused);
            }
            if period_days == 0 || max_members < 2 || contribution_amount == 0 {
                return Err(Error::InvalidParameters);
            }

            let id = self.next_group_id;
            self.next_group_id = self.next_group_id.saturating_add(1);

            let founder = self.env().caller();
            let info = GroupInfo {
                founder,
                arisan_group_addr,
                contribution_amount,
                period_days,
                max_members,
                member_count: 1,
                created_at: self.env().block_timestamp(),
                active: true,
            };
            self.groups.insert(id, &info);
            self.is_member.insert((id, founder), &true);

            self.env().emit_event(GroupCreated {
                group_id: id,
                founder,
                arisan_group_addr,
                contribution_amount,
                max_members,
            });
            Ok(id)
        }

        /// Member opts-in to an existing group.
        #[ink(message)]
        pub fn join_group(&mut self, group_id: GroupId) -> Result<()> {
            if self.paused {
                return Err(Error::ContractPaused);
            }
            let mut info = self.groups.get(group_id).ok_or(Error::GroupNotFound)?;
            if !info.active {
                return Err(Error::GroupInactive);
            }
            if info.member_count >= info.max_members {
                return Err(Error::GroupFull);
            }
            let caller = self.env().caller();
            if self.is_member.get((group_id, caller)).unwrap_or(false) {
                return Err(Error::AlreadyMember);
            }

            info.member_count = info.member_count.saturating_add(1);
            self.groups.insert(group_id, &info);
            self.is_member.insert((group_id, caller), &true);

            self.env().emit_event(MemberJoined {
                group_id,
                member: caller,
            });
            Ok(())
        }

        #[ink(message)]
        pub fn get_group(&self, group_id: GroupId) -> Option<GroupInfo> {
            self.groups.get(group_id)
        }

        #[ink(message)]
        pub fn is_member_of(&self, group_id: GroupId, account: AccountId) -> bool {
            self.is_member.get((group_id, account)).unwrap_or(false)
        }

        #[ink(message)]
        pub fn group_count(&self) -> u64 {
            self.next_group_id.saturating_sub(1)
        }

        #[ink(message)]
        pub fn set_paused(&mut self, paused: bool) -> Result<()> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(Error::NotOwner);
            }
            self.paused = paused;
            if paused {
                self.env().emit_event(Paused { by: caller });
            } else {
                self.env().emit_event(Unpaused { by: caller });
            }
            Ok(())
        }

        #[ink(message)]
        pub fn is_paused(&self) -> bool {
            self.paused
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn constructor_sets_owner() {
            let registry = GroupRegistry::new();
            assert_eq!(registry.group_count(), 0);
        }
    }
}
