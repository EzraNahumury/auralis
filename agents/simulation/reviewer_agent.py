"""Reviewer Agent — per-member voter that reads the Requester Agent's
verdict and casts an independent APPROVE/REJECT vote per their voting policy.

Per README §6.3. Mirrors `frontend/app/api/ai/reviewer/route.ts` (which
supports batch parallel calls; for the simulation we do sequential calls
since this is a one-shot demo, not a server).
"""

from __future__ import annotations

from .ollama_client import chat_json
from .prompts import reviewer_messages
from .schemas import ReviewerInput, ReviewerOutput, VoteValue


def _normalize_vote(raw_vote: str | None) -> VoteValue:
    if not raw_vote:
        return "REJECT"
    v = str(raw_vote).strip().upper()
    if v in ("APPROVE", "YES", "PASS"):
        return "APPROVE"
    return "REJECT"


def run(input_: ReviewerInput, *, temperature: float = 0.3) -> ReviewerOutput:
    """Run one reviewer agent. Slightly higher temperature than Requester so
    reviewers don't all converge to the same answer when policies differ."""

    messages = reviewer_messages(input_)
    raw = chat_json(messages, temperature=temperature)

    vote = _normalize_vote(raw.get("vote"))

    try:
        confidence = float(raw.get("confidence", 0.5))
    except (TypeError, ValueError):
        confidence = 0.5
    confidence = max(0.0, min(1.0, confidence))

    reasoning = str(raw.get("reasoning") or "").strip()
    if not reasoning:
        reasoning = "(no reasoning returned)"

    return ReviewerOutput(vote=vote, confidence=confidence, reasoning=reasoning)


def run_batch(inputs: list[ReviewerInput], *, temperature: float = 0.3) -> list[ReviewerOutput]:
    """Sequential batch — same agent, multiple inputs (e.g. 3 personas)."""
    return [run(inp, temperature=temperature) for inp in inputs]
