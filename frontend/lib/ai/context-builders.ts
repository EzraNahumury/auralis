"use client";

import type { GroupDef } from "@/lib/groups/types";
import type { WithdrawRequest } from "@/lib/store/requests";
import type { Deposit } from "@/lib/store/deposits";
import { PROFILES } from "@/lib/profiles";
import type {
  RequesterInput,
  RequesterOutput,
  ReviewerInput,
} from "@/lib/ai/schemas";

export function buildRequesterInput(
  group: GroupDef,
  request: WithdrawRequest,
  deposits: Deposit[]
): RequesterInput {
  const requesterProfile = PROFILES[request.requester];
  const confirmedThisRound = deposits.filter(
    (d) => d.status === "confirmed"
  ).length;
  const expected = group.members.length;
  const consistency = expected > 0
    ? Math.round((confirmedThisRound / expected) * 100)
    : 0;
  const potCollected = deposits
    .filter((d) => d.status === "confirmed")
    .reduce((sum, d) => sum + d.amountPot, 0);

  return {
    groupName: group.name,
    memberName: request.requester,
    amountPot: request.amountPot,
    reason: request.reason,
    category: request.category,
    memberReputation: requesterProfile.reputation,
    memberTier: requesterProfile.tier,
    depositConsistencyPct: consistency,
    roundsPaid: `${confirmedThisRound} of ${expected} members have deposited this round`,
    crossGroupActivity: "Active in 1 group (this one)",
    outstandingDebts: "None recorded on chain",
    emergencyVerified:
      request.category === "emergency"
        ? "Self-declared, no external verification yet"
        : "Not applicable for this category",
    round: group.currentRound,
    totalRounds: group.totalRounds,
    memberCount: group.members.length,
    threshold: group.threshold,
    potPot: potCollected,
  };
}

export function buildReviewerBatch(
  group: GroupDef,
  request: WithdrawRequest,
  verdict: RequesterOutput
): ReviewerInput[] {
  const summary = `${group.name} — ${request.requester} is requesting ${request.amountPot} POT (${request.category}).`;
  // Reviewers are everyone in the group EXCEPT the requester themselves.
  const reviewers = group.members.filter((m) => m !== request.requester);
  return reviewers.map((m) => {
    const profile = PROFILES[m];
    return {
      member: m,
      policy: profile.policy,
      weight: profile.voteWeight,
      memberReputation: profile.reputation,
      requestSummary: summary,
      amountPot: request.amountPot,
      reason: request.reason,
      requesterConfidence: verdict.confidence,
      requesterVerdict: verdict.verdict,
      requesterRouting: verdict.routing,
      requesterReasoning: verdict.reasoning,
    };
  });
}
