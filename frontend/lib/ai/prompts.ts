import type { OllamaMessage } from "./ollama";
import type { RequesterInput, ReviewerInput } from "./schemas";

// Requester Agent — per README §6.2.
// Pre-validation, single LLM pass, structured JSON verdict.

export function requesterMessages(input: RequesterInput): OllamaMessage[] {
  const system = [
    "You are the Requester Agent for Auralis, an on-chain Arisan coordination protocol on Portaldot.",
    "Your job is to pre-validate a withdrawal request from a member of a rotating-savings group and produce a structured JSON verdict.",
    "",
    "Rules:",
    "- Score the request from 0.0 to 1.0 confidence.",
    "- Routing decision is derived strictly from confidence:",
    "    confidence >= 0.85  -> HYBRID_FAST_TRACK and verdict PASS",
    "    0.50 to 0.84        -> NORMAL and verdict PASS",
    "    confidence < 0.50   -> AUTO_REJECT and verdict REJECT",
    "- Reasoning is 3 to 4 short bullets, plain English, each under 22 words.",
    "- Checks array MUST contain exactly these six rows in this order:",
    '    "Deposit consistency" (weight 25)',
    '    "Reputation score" (weight 25)',
    '    "Cross-group history" (weight 15)',
    '    "Reason plausibility" (weight 15)',
    '    "Emergency flag" (weight 10)',
    '    "Outstanding debts" (weight 10)',
    "- Each check value is one short phrase; ok is true if the signal is healthy.",
    "- Return ONLY the JSON object. No prose before or after.",
  ].join("\n");

  const user = [
    "## Request context",
    `Group: ${input.groupName}`,
    `Member: ${input.memberName}`,
    `Amount requested: ${input.amountPot} POT`,
    `Reason: ${input.reason}`,
    `Category: ${input.category}`,
    "",
    "## Member history",
    `Reputation score: ${input.memberReputation} / 1000 (${input.memberTier} tier)`,
    `Deposit consistency: ${input.depositConsistencyPct}% on-time (${input.roundsPaid})`,
    `Cross-group activity: ${input.crossGroupActivity}`,
    `Outstanding debts: ${input.outstandingDebts}`,
    `Emergency flag verification: ${input.emergencyVerified}`,
    "",
    "## Group context",
    `Round: ${input.round} of ${input.totalRounds}`,
    `Members: ${input.memberCount} (${input.threshold}-of-${input.memberCount} multisig)`,
    `Pot collected this round: ${input.potPot} POT`,
    "",
    "## Output schema",
    "{",
    '  "confidence": number,',
    '  "verdict": "PASS" | "REJECT",',
    '  "routing": "HYBRID_FAST_TRACK" | "NORMAL" | "AUTO_REJECT",',
    '  "reasoning": [string, string, string, string?],',
    '  "checks": [',
    '    {"label": "Deposit consistency", "value": string, "weight": 25, "ok": boolean},',
    '    {"label": "Reputation score", "value": string, "weight": 25, "ok": boolean},',
    '    {"label": "Cross-group history", "value": string, "weight": 15, "ok": boolean},',
    '    {"label": "Reason plausibility", "value": string, "weight": 15, "ok": boolean},',
    '    {"label": "Emergency flag", "value": string, "weight": 10, "ok": boolean},',
    '    {"label": "Outstanding debts", "value": string, "weight": 10, "ok": boolean}',
    "  ]",
    "}",
    "",
    "Return only the JSON.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// Reviewer Agent — per README §6.3.
// Independent per-member reasoning + onchain vote.

const POLICY_GUIDANCE: Record<ReviewerInput["policy"], string> = {
  Conservative:
    "Default-reject anything where any weighted signal looks weak. Approve only when every signal is clean.",
  "Trust-Default":
    "Default-approve when the Requester Agent's confidence is at or above 0.65 and there are no red flags.",
  "Strict-Emergency":
    "Approve only verified emergencies (medical, accident, school deadline) OR clearly scheduled round payouts. Reject everything else.",
};

export function reviewerMessages(input: ReviewerInput): OllamaMessage[] {
  const system = [
    `You are ${input.member}'s personal Reviewer Agent in Auralis, an on-chain Arisan coordination protocol.`,
    `Your voting policy is "${input.policy}":`,
    `  ${POLICY_GUIDANCE[input.policy]}`,
    "",
    `${input.member}'s vote weight is ${input.weight.toFixed(2)}x (reputation ${input.memberReputation}/1000).`,
    "",
    "You read the Requester Agent's verdict as input but you may disagree with it.",
    "Cast a single vote: APPROVE or REJECT.",
    "Reasoning is one short sentence (max 24 words) explaining why.",
    "Return ONLY the JSON object.",
  ].join("\n");

  const user = [
    "## Request",
    input.requestSummary,
    `Amount: ${input.amountPot} POT`,
    `Reason: ${input.reason}`,
    "",
    "## Requester Agent verdict",
    `Confidence: ${input.requesterConfidence.toFixed(2)}`,
    `Verdict: ${input.requesterVerdict}`,
    `Routing: ${input.requesterRouting}`,
    "Reasoning:",
    ...input.requesterReasoning.map((r) => `  - ${r}`),
    "",
    "## Output schema",
    "{",
    '  "vote": "APPROVE" | "REJECT",',
    '  "confidence": number,',
    '  "reasoning": string',
    "}",
    "",
    "Return only the JSON.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
