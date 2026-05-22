"""Requester Agent — pre-validates a withdrawal request and produces a
structured JSON verdict that routes the request to one of three voting paths.

Per README §6.2. Mirrors `frontend/app/api/ai/requester/route.ts`.

Usage:
    from .schemas import RequesterInput
    from .requester_agent import run as run_requester

    verdict = run_requester(RequesterInput(...))
    print(verdict.confidence, verdict.verdict, verdict.routing)
"""

from __future__ import annotations

from .ollama_client import chat_json
from .prompts import requester_messages
from .schemas import RequesterCheck, RequesterInput, RequesterOutput

# Required 6 checks in this exact order (per README §6.2 Requester table).
EXPECTED_CHECKS: list[tuple[str, int]] = [
    ("Deposit consistency", 25),
    ("Reputation score", 25),
    ("Cross-group history", 15),
    ("Reason plausibility", 15),
    ("Emergency flag", 10),
    ("Outstanding debts", 10),
]


def _coerce_checks(raw_checks: list[dict]) -> list[RequesterCheck]:
    """Force the 6-row checks shape even if the model returned a partial array
    or wrong labels. We map by index and override labels/weights to spec."""

    out: list[RequesterCheck] = []
    for i, (label, weight) in enumerate(EXPECTED_CHECKS):
        src = raw_checks[i] if i < len(raw_checks) else {}
        value = str(src.get("value") or "—")
        ok = bool(src.get("ok", True))
        out.append(RequesterCheck(label=label, value=value, weight=weight, ok=ok))
    return out


def _derive_routing(confidence: float) -> tuple[str, str]:
    """Strict routing rules (override what the model returns to enforce spec)."""
    if confidence >= 0.85:
        return "HYBRID_FAST_TRACK", "PASS"
    if confidence >= 0.50:
        return "NORMAL", "PASS"
    return "AUTO_REJECT", "REJECT"


def run(input_: RequesterInput, *, temperature: float = 0.2) -> RequesterOutput:
    """Run the Requester Agent against Ollama and return a parsed verdict.

    Routing is enforced from confidence (we override the model's choice to
    keep the spec invariant). The model gets to set confidence and reasoning;
    we keep its checks but force shape + labels.
    """

    messages = requester_messages(input_)
    raw = chat_json(messages, temperature=temperature)

    # Clamp confidence into [0, 1].
    try:
        confidence = float(raw.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    routing, verdict = _derive_routing(confidence)

    reasoning_raw = raw.get("reasoning") or []
    if not isinstance(reasoning_raw, list):
        reasoning_raw = [str(reasoning_raw)]
    reasoning = [str(r).strip() for r in reasoning_raw if str(r).strip()]
    # Cap at 4 bullets per spec.
    reasoning = reasoning[:4]

    checks_raw = raw.get("checks") or []
    checks = _coerce_checks(checks_raw if isinstance(checks_raw, list) else [])

    return RequesterOutput(
        confidence=confidence,
        verdict=verdict,
        routing=routing,
        reasoning=reasoning,
        checks=checks,
    )
