import type { MemberName } from "./avatars";

export interface Profile {
  role: string;
  reputation: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  voteWeight: number;
  badges: { name: string; note: string }[];
  policy: "Conservative" | "Trust-Default" | "Strict-Emergency";
}

export const PROFILES: Record<MemberName, Profile> = {
  Alice: {
    role: "Founder of Arisan Tetangga RT 03",
    reputation: 887,
    tier: "Platinum",
    voteWeight: 1.39,
    policy: "Trust-Default",
    badges: [
      { name: "Group founder", note: "Founded RT 03 in May 2026." },
      { name: "On-time payer", note: "Paid all 3 deposits this round." },
      { name: "Dispute-free", note: "No challenges raised on you." },
    ],
  },
  Bob: {
    role: "Member · approver this round",
    reputation: 645,
    tier: "Gold",
    voteWeight: 1.15,
    policy: "Trust-Default",
    badges: [
      { name: "On-time payer", note: "Three rounds on time, no missed deposits." },
      { name: "Active reviewer", note: "Cast votes on every withdrawal so far." },
    ],
  },
  Charlie: {
    role: "Member · careful reviewer",
    reputation: 521,
    tier: "Gold",
    voteWeight: 1.05,
    policy: "Conservative",
    badges: [
      { name: "On-time payer", note: "Three rounds on time, no missed deposits." },
    ],
  },
  Dave: {
    role: "Round 1 recipient",
    reputation: 412,
    tier: "Silver",
    voteWeight: 0.92,
    policy: "Strict-Emergency",
    badges: [
      { name: "New member", note: "Joined Arisan RT 03 in May 2026." },
    ],
  },
};
