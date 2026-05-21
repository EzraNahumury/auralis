// Seeded request + member context for the demo group. Mirrors the
// hardcoded scenario the companion runs so the AI verdicts are
// consistent with the on-chain story.

import type { MemberName } from "@/lib/avatars";
import type { ReviewerInput, RequesterInput } from "./schemas";

export const DEMO_REQUESTER_INPUT: RequesterInput = {
  groupName: "Arisan Tetangga RT 03",
  memberName: "Dave",
  amountPot: 300,
  reason:
    "Round 1 scheduled recipient — Dave is the elected pot holder this cycle.",
  category: "scheduled",
  memberReputation: 612,
  memberTier: "Gold",
  depositConsistencyPct: 100,
  roundsPaid: "first round, no missed deposits",
  crossGroupActivity: "Active in 1 group, no penalties",
  outstandingDebts: "None across the ecosystem",
  emergencyVerified: "Not flagged — scheduled payout",
  round: 1,
  totalRounds: 4,
  memberCount: 3,
  threshold: 2,
  potPot: 300,
};

interface ReviewerProfile {
  member: MemberName;
  policy: ReviewerInput["policy"];
  weight: number;
  reputation: number;
}

export const REVIEWER_PROFILES: ReviewerProfile[] = [
  { member: "Alice", policy: "Trust-Default", weight: 1.39, reputation: 887 },
  { member: "Bob", policy: "Trust-Default", weight: 1.15, reputation: 645 },
  { member: "Charlie", policy: "Conservative", weight: 1.05, reputation: 521 },
];

export function buildReviewerBatch(
  requester: {
    confidence: number;
    verdict: "PASS" | "REJECT";
    routing: "HYBRID_FAST_TRACK" | "NORMAL" | "AUTO_REJECT";
    reasoning: string[];
  }
): ReviewerInput[] {
  const req = DEMO_REQUESTER_INPUT;
  const requestSummary = `${req.groupName} · Round ${req.round}/${req.totalRounds}. ${req.memberName} is requesting ${req.amountPot} POT (${req.category}).`;

  return REVIEWER_PROFILES.map((p) => ({
    member: p.member,
    policy: p.policy,
    weight: p.weight,
    memberReputation: p.reputation,
    requestSummary,
    amountPot: req.amountPot,
    reason: req.reason,
    requesterConfidence: requester.confidence,
    requesterVerdict: requester.verdict,
    requesterRouting: requester.routing,
    requesterReasoning: requester.reasoning,
  }));
}
