import type { MemberName } from "./avatars";

export type Routing = "HYBRID_FAST_TRACK" | "NORMAL" | "AUTO_REJECT";
export type Verdict = "PASS" | "REJECT";
export type VoteValue = "APPROVE" | "REJECT" | "PENDING";

export interface RequesterVerdict {
  confidence: number;
  verdict: Verdict;
  routing: Routing;
  reasoning: string[];
  reasoningCid: string;
  generatedAt: string;
  checks: { label: string; value: string; weight: number; ok: boolean }[];
}

export interface ReviewerVote {
  member: MemberName;
  policy: "Conservative" | "Trust-Default" | "Strict-Emergency";
  weight: number;
  vote: VoteValue;
  confidence: number;
  reasoning: string;
  reasoningCid: string;
  castAt: string;
}

export const REQUESTER_VERDICT: RequesterVerdict = {
  confidence: 0.92,
  verdict: "PASS",
  routing: "HYBRID_FAST_TRACK",
  reasoningCid: "bafybeib3xjt7c4ufgmkqaqd2h7c4",
  generatedAt: "2026-05-20T01:58:11Z",
  checks: [
    { label: "Deposit consistency", value: "100% on-time (3/3 rounds)", weight: 25, ok: true },
    { label: "Reputation score", value: "887 / 1000 (Platinum)", weight: 25, ok: true },
    { label: "Cross-group history", value: "Active in 2 groups, no penalties", weight: 15, ok: true },
    { label: "Reason plausibility", value: "Round 1 scheduled recipient", weight: 15, ok: true },
    { label: "Emergency flag", value: "Not flagged — scheduled payout", weight: 10, ok: true },
    { label: "Outstanding debts", value: "None across the ecosystem", weight: 10, ok: true },
  ],
  reasoning: [
    "Deposit history is 100% on-time across this round (3/3 members paid).",
    "Reputation score 887/1000 sits in Platinum tier — top 10% group-wide.",
    "Reason matches Round 1 scheduled recipient per group rules.",
    "No outstanding debts in any other Auralis group on Portaldot.",
  ],
};

export const REVIEWER_VOTES: ReviewerVote[] = [
  {
    member: "Alice",
    policy: "Trust-Default",
    weight: 1.39,
    vote: "APPROVE",
    confidence: 0.94,
    reasoning:
      "Standard Round 1 payout matches scheduled recipient. Deposit cadence consistent. Approve.",
    reasoningCid: "bafy…ali1",
    castAt: "2026-05-20T02:00:14Z",
  },
  {
    member: "Bob",
    policy: "Trust-Default",
    weight: 1.15,
    vote: "APPROVE",
    confidence: 0.87,
    reasoning:
      "Cross-group history clean. No flags raised by my Trust-Default policy. Approve.",
    reasoningCid: "bafy…bob1",
    castAt: "2026-05-20T02:00:42Z",
  },
  {
    member: "Charlie",
    policy: "Conservative",
    weight: 1.05,
    vote: "APPROVE",
    confidence: 0.82,
    reasoning:
      "Light caution on amount vs. my baseline — overridden by reputation 887 and group founder status.",
    reasoningCid: "bafy…cha1",
    castAt: "2026-05-20T02:01:11Z",
  },
];

export function routingLabel(r: Routing): string {
  if (r === "HYBRID_FAST_TRACK") return "Fast-track";
  if (r === "NORMAL") return "Standard vote";
  return "Auto-reject";
}

export function routingTone(r: Routing): "emerald" | "amber" | "rose" {
  if (r === "HYBRID_FAST_TRACK") return "emerald";
  if (r === "NORMAL") return "amber";
  return "rose";
}
