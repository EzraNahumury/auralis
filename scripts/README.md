# Auralis Helper Scripts

Three small bash scripts to spin up, smoke-test, and tear down the full Auralis local stack with one command each. Use these instead of remembering to start three services in three terminals.

| Script | What it does | Typical use |
|--------|--------------|-------------|
| `start.sh` | Spawns substrate-contracts-node + Ollama daemon + Next.js frontend in the background. Logs go to `.logs/`, PIDs to `.logs/pids/`. Auto-creates `frontend/.env.local` from defaults if missing. | Run once when you sit down to demo / test. |
| `test-flow.sh` | Sanity-check that all three services are alive, block production is live, Ollama has a model, and the frontend's `/api/chain/balance` round-trips end-to-end. | Run after `start.sh` to confirm nothing is broken. |
| `stop.sh` | Kills everything started by `start.sh` cleanly. | When done testing, or to recycle a stuck node. |
| `check-prereqs.sh` | Verifies Node 20+, npm, substrate-contracts-node, Python 3.11+, curl are all installed. Called automatically by `start.sh`. | Run on a fresh machine to know what's missing. |

---

## First-time setup (you or your friend)

```bash
# 1. Clone the repo (or pull if already cloned)
git clone https://github.com/emanuellzoe/auralis
cd auralis

# 2. Install missing tools per the prereq report:
./scripts/check-prereqs.sh
# Follow the install hints if anything is missing.

# 3. (Optional but recommended) Install Ollama for AI agents
brew install ollama       # macOS
ollama serve &            # start daemon in background
ollama pull llama3.2      # ~2GB download, one-time

# 4. Start the whole stack
./scripts/start.sh
```

After `start.sh` finishes, you'll see:

```
✅ All services up.
  Substrate node : ws://127.0.0.1:9944
  Ollama daemon  : http://localhost:11434
  Frontend       : http://localhost:3000
```

Open http://localhost:3000 in your browser, sign in as Alice (or any dev account), and follow the demo flow in [`STATUS.md`](../STATUS.md) or the main [`README.md`](../README.md).

---

## Smoke-test

After `start.sh`, run:

```bash
./scripts/test-flow.sh
```

It checks four things:

1. **Substrate node**: reachable on port 9944 and **producing blocks** (this script catches the v0.42 stall bug — if blocks aren't advancing, it tries a manual seal and tells you to restart with the right flag)
2. **Ollama**: reachable + has at least one model pulled
3. **Frontend**: HTTP 200 on `/`
4. **End-to-end**: `/api/chain/balance?address=<Alice>` returns a valid balance JSON

Exit codes:

- `0` = all good
- `1` = critical issue (frontend can't talk to node)

---

## Stopping the stack

```bash
./scripts/stop.sh
```

Kills the three services in reverse order (frontend → ollama → node) and removes the pid files. Always run this before closing your terminal, otherwise the node will keep running in the background and may conflict with the next `start.sh`.

---

## Multi-user demo (two browsers)

Once `start.sh` is up:

1. **Window 1** (Chrome): http://localhost:3000 → Sign-in as **Alice**
2. **Window 2** (Chrome Incognito *or* Safari): http://localhost:3000 → Sign-in as **Bob**
3. Repeat with **Charlie** (Window 3) if you want a 3-member group

Each window keeps its own `localStorage`, so the sessions don't collide.

Demo flow:

1. **Alice** (Window 1): Create a new group, add Bob + Charlie, threshold 2-of-3, contribution 20 POT
2. **Alice**: Deposit 20 POT → confirmed on chain
3. **Bob** (Window 2): Open the same group → Deposit 20 POT → confirmed
4. **Charlie** (Window 3): Same → Deposit 20 POT → confirmed
5. **Alice**: Request withdrawal of 60 POT (round payout) → AI Requester returns verdict
6. **Bob**: Open the request → click **Propose on chain** (first multisig signature)
7. **Charlie**: Open the request → click **Approve** → threshold met → payout auto-executes
8. **Alice's balance** increases by 60 POT, multisig balance returns to 0

---

## What's in `.logs/`?

After `start.sh`, the logs directory has:

```
.logs/
├── substrate-node.log    # Node startup + every block produced
├── ollama.log            # Daemon logs
├── frontend.log          # Next.js compile + request log
└── pids/                 # Background PIDs (used by stop.sh)
```

Tail them in real-time if you want to debug:

```bash
tail -f .logs/substrate-node.log
tail -f .logs/frontend.log
```

`.logs/` is gitignored.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `start.sh` says "Timeout waiting for substrate node RPC" | Run `tail -30 .logs/substrate-node.log`. Most likely cause: another `substrate-contracts-node` already running. Kill it: `pkill -f substrate-contracts-node` and re-run. |
| `test-flow.sh` says "Block stuck at #0" | Node is in manual-seal-on-tx mode. The script automatically sends a manual seal RPC — re-run `test-flow.sh` once more. If still stuck, kill the node (`./scripts/stop.sh`) and re-start. |
| `WebSocket is not connected` in browser | Node restarted while frontend was open. Clear browser localStorage (DevTools → Application → Clear storage) and hard-reload. |
| `Could not reach Ollama` in browser console | Ollama daemon mati or `OLLAMA_MODEL` not pulled. Run `ollama serve` + `ollama pull llama3.2`. UI will fall back to mock AI verdict if Ollama is down. |
| `npm install` slow / stuck | Network. `rm -rf frontend/node_modules frontend/package-lock.json && npm install --prefer-offline`. |

---

## What scripts do NOT do

- **Deploy ink! smart contracts**. Those are deployed separately via `cargo contract instantiate` per [`contracts/README.md`](../contracts/README.md). The frontend uses native pallets, not the ink! contracts, so you don't need them deployed to run the demo.
- **Persist state across restarts**. The node uses `--tmp` (in-memory db), so a restart wipes everything. This is intentional — fresh state per demo session. If you want persistent state, edit `start.sh` and replace `--tmp` with `--base-path ~/.auralis-node`.
- **Push to remote**. These are local-only.

---

## License

MIT — same as the parent project.
