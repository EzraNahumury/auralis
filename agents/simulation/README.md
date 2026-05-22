# Auralis BE — Off-chain AI Simulation

A self-contained Python demo of the **Requester + Reviewer Agent** reasoning pipeline described in [main README §6](../../README.md#6-multi-agent-ai-workflow). Mirrors the same Ollama-based pattern that the frontend uses (see [`frontend/lib/ai/`](../../frontend/lib/ai/)) — same prompts, same JSON schemas, same routing rules.

This exists because:

1. **Submission needs proof the AI reasoning component works end-to-end** independent of any frontend or chain.
2. **Frontend's AI integration is server-side** (`/api/ai/requester`, `/api/ai/reviewer`) — but having a CLI lets judges + reviewers run the same pipeline without spinning up Next.js.
3. **Most of the BE work in [README §13](../../README.md#13-backend-implementation-spec) is post-Portaldot-API-upgrade scope** (orchestrator daemon, indexer, deploy script). The off-chain LLM simulation is the only piece needed for hackathon submission given the current Contracts API v5 blocker.

---

## What the script does

```
Step 1: Load a demo withdrawal request (Dewi, 300 POT, medical emergency)
Step 2: Run Requester Agent → produces confidence + routing + 6 weighted checks
Step 3: If routing != AUTO_REJECT, spawn 3 Reviewer Agents (one per policy)
        — Conservative, Trust-Default, Strict-Emergency
Step 4: Tally weighted votes → APPROVED / REJECTED
Step 5: Persist a Markdown record to outputs/ + pretty terminal report
```

The demo scenario is hardcoded in `run_simulation.py` (constant `DEMO_REQUEST`). Swap the data there to test other scenarios, or import the modules and call `requester_agent.run(...)` / `reviewer_agent.run(...)` directly.

---

## Requirements

- **Python ≥ 3.11**
- **Ollama** running locally OR an Ollama Cloud account
  - Local: `brew install ollama && ollama serve` (or platform equivalent), then `ollama pull llama3.2`
  - Cloud: get a key at [ollama.com](https://ollama.com)

---

## Setup

```bash
cd agents/simulation
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env if needed (OLLAMA_HOST, OLLAMA_MODEL).
```

---

## Run

```bash
python -m agents.simulation.run_simulation
```

(Or from inside the folder: `python run_simulation.py`)

**Expected output (abridged):**

```
══════════════════ Auralis — Off-chain AI Simulation ══════════════════
Ollama: http://localhost:11434  ·  Model: llama3.2

┌─ 📥 Withdrawal Request ─────────────────────────┐
│ Group:    Arisan Tetangga RT 03                 │
│ Member:   Dewi                                  │
│ Amount:   300 POT                               │
│ Category: emergency                             │
│ Reason:   Medical emergency — surgery ...       │
└─────────────────────────────────────────────────┘

→ Running Requester Agent...

┌─ 🤖 Requester Agent ────────────────────────────┐
│ Confidence 0.87  →  HYBRID_FAST_TRACK  →  PASS │
└─────────────────────────────────────────────────┘

Reasoning:
  • Member has Gold tier reputation and 92% on-time history.
  • Emergency is verified with doctor letter and hospital invoice.
  • Amount matches the round pot exactly — no inflation.
  • No cross-group debts or red flags.

[Checks table: 6 rows × 4 cols]

→ Running Reviewer Agents (1 per policy)...

[Votes table: Alice/Conservative/APPROVE, Bob/Trust-Default/APPROVE, ...]

┌─ 📊 Tally ──────────────────────────────────────┐
│ Approve weight: 3.68                             │
│ Reject weight:  0.00                             │
│ Approval rate:  100.0%                           │
│ Final decision: APPROVED                         │
└─────────────────────────────────────────────────┘

📄 Report saved to outputs/simulation_20260522T...Z.md
```

---

## File map

| File | Role |
|------|------|
| `schemas.py` | Pydantic models — mirror of [`frontend/lib/ai/schemas.ts`](../../frontend/lib/ai/schemas.ts) |
| `prompts.py` | System + user prompts — verbatim port of [`frontend/lib/ai/prompts.ts`](../../frontend/lib/ai/prompts.ts) |
| `ollama_client.py` | Minimal HTTP client — port of [`frontend/lib/ai/ollama.ts`](../../frontend/lib/ai/ollama.ts) |
| `requester_agent.py` | Single-shot pre-validation. Enforces routing from confidence. Coerces 6-check shape. |
| `reviewer_agent.py` | Per-member voter. Slightly higher temperature so policies diverge. |
| `run_simulation.py` | End-to-end demo runner — orchestrates Requester → Reviewers → Tally → Markdown record |

---

## Behavior parity with frontend

The agents return the same JSON shape as the frontend's `/api/ai/*` routes (which is by construction — same prompts, same schemas). This means:

- A reviewer's `ReviewerOutput` from this CLI is byte-identical to one from `/api/ai/reviewer`.
- The tally function here is the same formula as `ChainProvider.runLive` in the frontend.
- If you change a prompt in one place, also change it in the other (or the agents drift).

If you want the frontend to call this Python CLI instead of its built-in Ollama route, the contract is already aligned — you'd just need a small `subprocess.run([...], capture_output=True)` wrapper.

---

## Why mirror frontend code instead of importing it?

The frontend lives in a Node.js/TypeScript runtime. Bridging into Python via subprocess works but adds latency + a process per request. For both the simulation script (CLI, one-shot) and the production architecture (Python orchestrator daemon described in README §13), Python-native code is the right shape.

Drift risk is real, so:

1. **Schemas + prompts** are 1:1 mirrors with comments pointing at the TS source.
2. **README §6.2 / §6.3** is the source of truth — if you edit it, edit both files.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Could not reach Ollama at http://localhost:11434` | `ollama serve` (in another terminal). Check `lsof -i :11434`. |
| `Ollama returned non-JSON output` | The model doesn't honor `format: "json"` well. Try `llama3.2`, `qwen2.5:7b`, or `gpt-oss:120b-cloud`. Avoid older/smaller models. |
| `model not found` | `ollama pull llama3.2` (or whichever you set in `OLLAMA_MODEL`). |
| Reviewer always votes the same way regardless of policy | Some smaller models can't distinguish nuanced policy text. Upgrade model. |
| Verdict swings wildly between runs | Lower temperature in `requester_agent.run(temperature=0.1)` — but for reviewers, some variability is intentional. |

---

## License

MIT — same as the parent project.
