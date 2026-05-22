"""Typed schemas for Requester + Reviewer agent I/O.

Mirrors `frontend/lib/ai/schemas.ts` so the contract is identical across
the Python BE simulation and the TypeScript FE runtime.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Requester Agent — README §6.2
# ---------------------------------------------------------------------------

Category = Literal["scheduled", "emergency", "other"]
Tier = Literal["Bronze", "Silver", "Gold", "Platinum"]
Routing = Literal["HYBRID_FAST_TRACK", "NORMAL", "AUTO_REJECT"]
Verdict = Literal["PASS", "REJECT"]


class RequesterInput(BaseModel):
    """Full context fed to the Requester Agent. Constructed from on-chain state."""

    group_name: str
    member_name: str
    amount_pot: int
    reason: str
    category: Category

    member_reputation: int = Field(ge=0, le=1000)
    member_tier: Tier
    deposit_consistency_pct: int = Field(ge=0, le=100)
    rounds_paid: str
    cross_group_activity: str
    outstanding_debts: str
    emergency_verified: str

    round: int = Field(ge=1)
    total_rounds: int = Field(ge=1)
    member_count: int = Field(ge=2)
    threshold: int = Field(ge=1)
    pot_pot: int = Field(ge=0)


class RequesterCheck(BaseModel):
    label: str
    value: str
    weight: int = Field(ge=0, le=100)
    ok: bool


class RequesterOutput(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)
    verdict: Verdict
    routing: Routing
    reasoning: list[str]
    checks: list[RequesterCheck]


# ---------------------------------------------------------------------------
# Reviewer Agent — README §6.3
# ---------------------------------------------------------------------------

Policy = Literal["Conservative", "Trust-Default", "Strict-Emergency"]
VoteValue = Literal["APPROVE", "REJECT"]


class ReviewerInput(BaseModel):
    member: str
    policy: Policy
    weight: float = Field(gt=0)
    member_reputation: int = Field(ge=0, le=1000)

    request_summary: str
    amount_pot: int
    reason: str

    requester_confidence: float
    requester_verdict: Verdict
    requester_routing: Routing
    requester_reasoning: list[str]


class ReviewerOutput(BaseModel):
    vote: VoteValue
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
