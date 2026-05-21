import type { MemberName } from "@/lib/avatars";

export interface RequesterInput {
  groupName: string;
  memberName: string;
  amountPot: number;
  reason: string;
  category: "scheduled" | "emergency" | "early";
  memberReputation: number;
  memberTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  depositConsistencyPct: number;
  roundsPaid: string;
  crossGroupActivity: string;
  outstandingDebts: string;
  emergencyVerified: string;
  round: number;
  totalRounds: number;
  memberCount: number;
  threshold: number;
  potPot: number;
}

export interface RequesterCheck {
  label: string;
  value: string;
  weight: number;
  ok: boolean;
}

export type Routing = "HYBRID_FAST_TRACK" | "NORMAL" | "AUTO_REJECT";
export type Verdict = "PASS" | "REJECT";

export interface RequesterOutput {
  confidence: number;
  verdict: Verdict;
  routing: Routing;
  reasoning: string[];
  checks: RequesterCheck[];
}

export interface ReviewerInput {
  member: MemberName;
  policy: "Conservative" | "Trust-Default" | "Strict-Emergency";
  weight: number;
  memberReputation: number;
  // Shared request context
  requestSummary: string;
  amountPot: number;
  reason: string;
  // Requester Agent context
  requesterConfidence: number;
  requesterVerdict: Verdict;
  requesterRouting: Routing;
  requesterReasoning: string[];
}

export type VoteValue = "APPROVE" | "REJECT";

export interface ReviewerOutput {
  vote: VoteValue;
  confidence: number;
  reasoning: string;
}
