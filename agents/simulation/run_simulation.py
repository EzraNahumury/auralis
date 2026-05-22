"""End-to-end Auralis AI workflow simulation.

Runs the complete reasoning cycle off-chain:

    1. Build a sample withdrawal request (mirroring on-chain state shape)
    2. Pre-validate via the Requester Agent (single Ollama call)
    3. Open the request to 3 Reviewer Agents (one per voting policy)
    4. Tally the weighted votes
    5. Emit a pretty terminal report + save a Markdown record to outputs/

Run:
    cd agents/simulation
    cp .env.example .env       # adjust OLLAMA_HOST / OLLAMA_MODEL
    pip install -r requirements.txt
    python run_simulation.py
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from . import requester_agent, reviewer_agent
from .ollama_client import OllamaInvalidJSON, OllamaUnreachable, ollama_host, ollama_model
from .schemas import Policy, RequesterInput, RequesterOutput, ReviewerInput, ReviewerOutput

load_dotenv()
console = Console()

# ---------------------------------------------------------------------------
# Demo scenario (mirrors README §14 Arisan Tetangga RT 03 / Round 1)
# ---------------------------------------------------------------------------

DEMO_REQUEST = RequesterInput(
    group_name="Arisan Tetangga RT 03",
    member_name="Dewi",
    amount_pot=300,
    reason="Medical emergency — surgery scheduled next week, hospital pre-payment",
    category="emergency",
    member_reputation=720,
    member_tier="Gold",
    deposit_consistency_pct=92,
    rounds_paid="11 of 12 on-time",
    cross_group_activity="Active in 2 other groups, both on-time",
    outstanding_debts="None",
    emergency_verified="Doctor letter uploaded + hospital invoice CID on IPFS",
    round=1,
    total_rounds=5,
    member_count=3,
    threshold=2,
    pot_pot=300,
)


# Each reviewer represents one of the three policies wired into the Auralis
# frontend (Conservative / Trust-Default / Strict-Emergency). Vote weights
# come from ReputationRegistry.get_weight_bps formula in the ink! contract
# (5000 + score*10, capped). Weight 1.0 = base 10_000 bps.
@dataclass
class ReviewerDef:
    member: str
    policy: Policy
    weight: float
    member_reputation: int


REVIEWERS: list[ReviewerDef] = [
    ReviewerDef(member="Alice", policy="Conservative", weight=1.32, member_reputation=820),
    ReviewerDef(member="Bob", policy="Trust-Default", weight=1.15, member_reputation=650),
    ReviewerDef(member="Charlie", policy="Strict-Emergency", weight=1.21, member_reputation=710),
]


@dataclass
class ReviewerResult:
    member: str
    policy: Policy
    weight: float
    output: ReviewerOutput


# ---------------------------------------------------------------------------
# Pretty printing
# ---------------------------------------------------------------------------


def _routing_color(routing: str) -> str:
    return {
        "HYBRID_FAST_TRACK": "green",
        "NORMAL": "yellow",
        "AUTO_REJECT": "red",
    }.get(routing, "white")


def _vote_color(vote: str) -> str:
    return "green" if vote == "APPROVE" else "red"


def print_request(req: RequesterInput) -> None:
    body = (
        f"[bold]Group:[/]    {req.group_name}\n"
        f"[bold]Member:[/]   {req.member_name}\n"
        f"[bold]Amount:[/]   {req.amount_pot} POT\n"
        f"[bold]Category:[/] {req.category}\n"
        f"[bold]Reason:[/]   {req.reason}"
    )
    console.print(Panel(body, title="📥 Withdrawal Request", border_style="cyan"))


def print_requester_verdict(out: RequesterOutput) -> None:
    routing_color = _routing_color(out.routing)
    header = Text.assemble(
        ("Confidence ", "bold"),
        (f"{out.confidence:.2f}", "bold yellow"),
        ("  →  ", ""),
        (out.routing, f"bold {routing_color}"),
        ("  →  ", ""),
        (f"verdict {out.verdict}", f"bold {routing_color}"),
    )
    console.print(Panel(header, title="🤖 Requester Agent", border_style=routing_color))

    if out.reasoning:
        console.print("[bold]Reasoning[/]:")
        for r in out.reasoning:
            console.print(f"  • {r}")
        console.print()

    table = Table(title="Checks (6 weighted signals)", show_lines=False)
    table.add_column("Label", style="bold")
    table.add_column("Value")
    table.add_column("Weight", justify="right")
    table.add_column("OK", justify="center")
    for c in out.checks:
        ok_mark = "[green]✓[/]" if c.ok else "[red]✗[/]"
        table.add_row(c.label, c.value, str(c.weight), ok_mark)
    console.print(table)


def print_reviewer_votes(results: list[ReviewerResult]) -> None:
    table = Table(title="🗳️  Reviewer Agent Votes", show_lines=True)
    table.add_column("Reviewer", style="bold")
    table.add_column("Policy")
    table.add_column("Weight", justify="right")
    table.add_column("Vote", justify="center")
    table.add_column("Conf", justify="right")
    table.add_column("Reasoning")

    for r in results:
        vote_color = _vote_color(r.output.vote)
        table.add_row(
            r.member,
            r.policy,
            f"{r.weight:.2f}x",
            Text(r.output.vote, style=f"bold {vote_color}"),
            f"{r.output.confidence:.2f}",
            r.output.reasoning,
        )
    console.print(table)


def tally(results: list[ReviewerResult]) -> tuple[float, float, str]:
    """Sum weighted votes. Returns (approve_weight, reject_weight, decision)."""

    approve_w = sum(r.weight for r in results if r.output.vote == "APPROVE")
    reject_w = sum(r.weight for r in results if r.output.vote == "REJECT")
    total = approve_w + reject_w
    decision = "APPROVED" if approve_w > reject_w else "REJECTED"
    # Special case: tie → reject (default-safe)
    if total == 0:
        decision = "REJECTED"
    return approve_w, reject_w, decision


def print_tally(approve_w: float, reject_w: float, decision: str) -> None:
    total = approve_w + reject_w
    pct = (approve_w / total * 100) if total > 0 else 0.0
    color = "green" if decision == "APPROVED" else "red"
    body = (
        f"[bold]Approve weight:[/] {approve_w:.2f}\n"
        f"[bold]Reject weight:[/]  {reject_w:.2f}\n"
        f"[bold]Approval rate:[/]  {pct:.1f}%\n"
        f"\n[bold {color}]Final decision: {decision}[/]"
    )
    console.print(Panel(body, title="📊 Tally", border_style=color))


# ---------------------------------------------------------------------------
# Markdown record
# ---------------------------------------------------------------------------


def write_markdown_record(
    req: RequesterInput,
    verdict: RequesterOutput,
    results: list[ReviewerResult],
    approve_w: float,
    reject_w: float,
    decision: str,
    out_dir: Path,
) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = out_dir / f"simulation_{ts}.md"

    lines: list[str] = [
        f"# Auralis Simulation — {ts}",
        "",
        f"**Model:** `{ollama_model()}` via `{ollama_host()}`",
        "",
        "## Request",
        f"- **Group:** {req.group_name}",
        f"- **Member:** {req.member_name}",
        f"- **Amount:** {req.amount_pot} POT",
        f"- **Reason:** {req.reason}",
        f"- **Category:** {req.category}",
        f"- **Member history:** reputation {req.member_reputation}/1000 ({req.member_tier}), {req.deposit_consistency_pct}% on-time, {req.rounds_paid}",
        "",
        "## Requester Agent verdict",
        f"- **Confidence:** {verdict.confidence:.2f}",
        f"- **Routing:** `{verdict.routing}`",
        f"- **Verdict:** `{verdict.verdict}`",
        "",
        "**Reasoning:**",
    ]
    for r in verdict.reasoning:
        lines.append(f"- {r}")
    lines.extend(
        [
            "",
            "**Checks:**",
            "",
            "| Label | Value | Weight | OK |",
            "|-------|-------|-------:|:--:|",
        ]
    )
    for c in verdict.checks:
        lines.append(f"| {c.label} | {c.value} | {c.weight} | {'✓' if c.ok else '✗'} |")

    lines.extend(["", "## Reviewer votes", ""])
    lines.append("| Reviewer | Policy | Weight | Vote | Conf | Reasoning |")
    lines.append("|----------|--------|-------:|:----:|-----:|-----------|")
    for r in results:
        lines.append(
            f"| {r.member} | {r.policy} | {r.weight:.2f}x | **{r.output.vote}** | {r.output.confidence:.2f} | {r.output.reasoning} |"
        )

    total = approve_w + reject_w
    pct = (approve_w / total * 100) if total > 0 else 0.0
    lines.extend(
        [
            "",
            "## Tally",
            "",
            f"- Approve weight: **{approve_w:.2f}**",
            f"- Reject weight: **{reject_w:.2f}**",
            f"- Approval rate: **{pct:.1f}%**",
            "",
            f"## Final decision: **{decision}**",
            "",
        ]
    )

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    console.rule("[bold magenta]Auralis — Off-chain AI Simulation[/]")
    console.print(f"[dim]Ollama: {ollama_host()}  ·  Model: {ollama_model()}[/]\n")

    print_request(DEMO_REQUEST)

    # ── Step 1: Requester Agent ─────────────────────────────────────────
    console.print("\n[bold cyan]→ Running Requester Agent...[/]\n")
    try:
        verdict = requester_agent.run(DEMO_REQUEST)
    except OllamaUnreachable as e:
        console.print(f"[red]✗ {e}[/]")
        console.print(
            "\n[yellow]Tip:[/] start the Ollama daemon ([cyan]ollama serve[/]) and "
            "pull the model:\n  [cyan]ollama pull llama3.2[/]\n"
        )
        return 1
    except OllamaInvalidJSON as e:
        console.print(f"[red]✗ Model returned invalid JSON:\n{e}[/]")
        return 1

    print_requester_verdict(verdict)

    # If auto-rejected, no point spinning up reviewers.
    if verdict.routing == "AUTO_REJECT":
        console.print("\n[red]⏹ Auto-rejected at pre-validation. No reviewers invoked.[/]")
        out_dir = Path(os.environ.get("OUTPUT_DIR", "./outputs"))
        path = write_markdown_record(
            DEMO_REQUEST, verdict, [], 0.0, 0.0, "AUTO_REJECTED", out_dir
        )
        console.print(f"\n📄 Report saved to [cyan]{path}[/]")
        return 0

    # ── Step 2: Reviewer Agents (one per policy) ────────────────────────
    console.print("\n[bold cyan]→ Running Reviewer Agents (1 per policy)...[/]\n")
    reviewer_inputs = [
        ReviewerInput(
            member=r.member,
            policy=r.policy,
            weight=r.weight,
            member_reputation=r.member_reputation,
            request_summary=f"{DEMO_REQUEST.member_name} requests {DEMO_REQUEST.amount_pot} POT from {DEMO_REQUEST.group_name}",
            amount_pot=DEMO_REQUEST.amount_pot,
            reason=DEMO_REQUEST.reason,
            requester_confidence=verdict.confidence,
            requester_verdict=verdict.verdict,
            requester_routing=verdict.routing,
            requester_reasoning=verdict.reasoning,
        )
        for r in REVIEWERS
    ]

    try:
        outputs = reviewer_agent.run_batch(reviewer_inputs)
    except (OllamaUnreachable, OllamaInvalidJSON) as e:
        console.print(f"[red]✗ Reviewer batch failed: {e}[/]")
        return 1

    results = [
        ReviewerResult(member=r.member, policy=r.policy, weight=r.weight, output=o)
        for r, o in zip(REVIEWERS, outputs)
    ]

    print_reviewer_votes(results)

    # ── Step 3: Tally ───────────────────────────────────────────────────
    approve_w, reject_w, decision = tally(results)
    console.print()
    print_tally(approve_w, reject_w, decision)

    # ── Step 4: Persist record ──────────────────────────────────────────
    out_dir = Path(os.environ.get("OUTPUT_DIR", "./outputs"))
    path = write_markdown_record(
        DEMO_REQUEST, verdict, results, approve_w, reject_w, decision, out_dir
    )
    console.print(f"\n📄 Report saved to [cyan]{path}[/]\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
