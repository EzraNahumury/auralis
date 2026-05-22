"""System + user prompts for the Requester and Reviewer agents.

Identical wording to `frontend/lib/ai/prompts.ts` — keep them in sync if
either side is edited, so the agents reason the same way regardless of
which runtime invoked them.
"""

from __future__ import annotations

from .ollama_client import Message
from .schemas import Policy, RequesterInput, ReviewerInput


# ---------------------------------------------------------------------------
# Requester Agent — README §6.2
# ---------------------------------------------------------------------------


def requester_messages(input_: RequesterInput) -> list[Message]:
    system = "\n".join(
        [
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
        ]
    )

    user = "\n".join(
        [
            "## Request context",
            f"Group: {input_.group_name}",
            f"Member: {input_.member_name}",
            f"Amount requested: {input_.amount_pot} POT",
            f"Reason: {input_.reason}",
            f"Category: {input_.category}",
            "",
            "## Member history",
            f"Reputation score: {input_.member_reputation} / 1000 ({input_.member_tier} tier)",
            f"Deposit consistency: {input_.deposit_consistency_pct}% on-time ({input_.rounds_paid})",
            f"Cross-group activity: {input_.cross_group_activity}",
            f"Outstanding debts: {input_.outstanding_debts}",
            f"Emergency flag verification: {input_.emergency_verified}",
            "",
            "## Group context",
            f"Round: {input_.round} of {input_.total_rounds}",
            f"Members: {input_.member_count} ({input_.threshold}-of-{input_.member_count} multisig)",
            f"Pot collected this round: {input_.pot_pot} POT",
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
        ]
    )

    return [Message("system", system), Message("user", user)]


# ---------------------------------------------------------------------------
# Reviewer Agent — README §6.3
# ---------------------------------------------------------------------------

POLICY_GUIDANCE: dict[Policy, str] = {
    "Conservative": (
        "Default-reject anything where any weighted signal looks weak. Approve only when every signal is clean."
    ),
    "Trust-Default": (
        "Default-approve when the Requester Agent's confidence is at or above 0.65 and there are no red flags."
    ),
    "Strict-Emergency": (
        "Approve only verified emergencies (medical, accident, school deadline) OR clearly scheduled round payouts. Reject everything else."
    ),
}


def reviewer_messages(input_: ReviewerInput) -> list[Message]:
    system = "\n".join(
        [
            f"You are {input_.member}'s personal Reviewer Agent in Auralis, an on-chain Arisan coordination protocol.",
            f'Your voting policy is "{input_.policy}":',
            f"  {POLICY_GUIDANCE[input_.policy]}",
            "",
            f"{input_.member}'s vote weight is {input_.weight:.2f}x (reputation {input_.member_reputation}/1000).",
            "",
            "You read the Requester Agent's verdict as input but you may disagree with it.",
            "Cast a single vote: APPROVE or REJECT.",
            "Reasoning is one short sentence (max 24 words) explaining why.",
            "Return ONLY the JSON object.",
        ]
    )

    user = "\n".join(
        [
            "## Request",
            input_.request_summary,
            f"Amount: {input_.amount_pot} POT",
            f"Reason: {input_.reason}",
            "",
            "## Requester Agent verdict",
            f"Confidence: {input_.requester_confidence:.2f}",
            f"Verdict: {input_.requester_verdict}",
            f"Routing: {input_.requester_routing}",
            "Reasoning:",
            *[f"  - {r}" for r in input_.requester_reasoning],
            "",
            "## Output schema",
            "{",
            '  "vote": "APPROVE" | "REJECT",',
            '  "confidence": number,',
            '  "reasoning": string',
            "}",
            "",
            "Return only the JSON.",
        ]
    )

    return [Message("system", system), Message("user", user)]
