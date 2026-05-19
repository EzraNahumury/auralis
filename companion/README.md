# Auralis Companion — Native Pallet Demo

A small TypeScript script that demonstrates **live on-chain Arisan coordination on Portaldot** using native pallets (`pallet-balances` + `pallet-multisig`), while our full `ink!` 5.x architecture in [`../contracts/`](../contracts/) waits for Portaldot's Contracts API to upgrade from v5 to v9+.

This companion exists because:

- ✅ Native pallets work on Portaldot's current Contracts API v5
- ❌ `ink!` 4.x / 5.x rejected at runtime by current Portaldot binary
- ❌ `ink!` 3.x broken on crates.io (`toml_datetime` dependency bug)

Per [Portaldot Discord admin guidance](https://discord.gg/portaldot) (LevelMax + Quabnation, 18 May 2026), native pallets are the only path to live on-chain Portaldot interaction today.

---

## What the script does — 5 transactions, full Arisan flow

```
Step 1: Alice    deposits 100 POT  →  multisig (Alice/Bob/Charlie, 2-of-3)
Step 2: Bob      deposits 100 POT  →  multisig
Step 3: Charlie  deposits 100 POT  →  multisig
Step 4: Alice    proposes withdrawal of 300 POT → Dave  (1st multisig signature)
Step 5: Bob      approves           → quorum hit → auto-executes
                                    → Dave receives 300 POT
```

Output: **5 transaction hashes + block numbers** persisted to `tx-proof.json` as native-deployment evidence for the hackathon submission.

### How this maps to Auralis ink! contracts

| ink! contract method | Native pallet equivalent (used here) |
|----------------------|--------------------------------------|
| `ArisanGroup.deposit()` | `pallet-balances.transferKeepAlive` (3×) |
| `VotingEngine.cast_vote()` | `pallet-multisig.approveAsMulti` / `asMulti` |
| `Treasury.release()` | Multisig auto-execution when threshold reached |
| `ReputationRegistry.*` | (off-chain only in this demo) |
| `BadgeNFT.mint_badge` | (omitted — would use `pallet-uniques` if needed) |
| `AgentRegistry.*` | (omitted — agent identity tracked off-chain) |

---

## Requirements

- **Node.js** ≥ 18.x
- **npm** or **pnpm**
- A reachable Portaldot WS endpoint. Three options (try in order):
  1. Community Railway public dev node: `wss://drip-node-production.up.railway.app`
  2. Older Railway URL: `wss://drip-backend-production-8d86.up.railway.app/node`
  3. Your own `./portaldot_dev --dev --alice` at `ws://127.0.0.1:9944`

---

## Setup

```bash
cd companion
npm install
cp .env.example .env
# edit .env if you want to change endpoint / amounts / threshold
```

---

## Run

```bash
npm start
```

You should see something like:

```
🏦 Auralis Companion Demo — Native Pallet Arisan Flow
════════════════════════════════════════════════════════════
Connected to: Development (wss://drip-node-production.up.railway.app)
Token: POT, decimals: 12, SS58: 42

Participants:
  Alice    : 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
  Bob      : 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
  Charlie  : 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
  Dave     : 5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy ← recipient
  Multisig : 5Hh... (2-of-3)

Step 1/5: Alice deposits 100 POT → group multisig
  ✓ tx: 0xabcd...
  ✓ block #12345

Step 2/5: Bob deposits 100 POT → group multisig
  ...

[ continues for steps 3-5 ]

Final balances:
  Multisig pot : 0 POT
  Dave         : 1000300 POT (1M default + 300 from Arisan)

📄 Proof bundle saved to ./tx-proof.json
```

---

## Verify proof bundle (judges / reviewers)

After running the demo, anyone connected to the same network can re-verify every transaction:

```bash
npm run verify
```

This queries the chain by tx hash + block hash and confirms each transaction is permanently recorded.

---

## Why 2-of-3, why 100 POT?

- **2-of-3 threshold** mirrors Auralis' weighted-vote majority semantic. A real deployment with `N` members would use `M-of-N` where `M = ceil(N × quorum)`. The threshold is configurable via `MULTISIG_THRESHOLD` in `.env`.
- **100 POT × 3 members = 300 POT pot** is arbitrary demo value. Change via `DEPOSIT_AMOUNT_POT`.
- **//Alice, //Bob, //Charlie, //Dave** are the standard dev-chain pre-funded keys. On Portaldot's `--dev` mode, all four start with millions of POT.

---

## Submission proof structure (`tx-proof.json`)

The script emits a JSON bundle on success. Schema:

```jsonc
{
  "network": { "endpoint": "wss://...", "chainName": "Development", "ss58Prefix": 42, ... },
  "participants": { "alice": "5Grw...", "bob": "5FHn...", "charlie": "5FLS...", "dave": "5DAA...", "multisig": "5Hh..." },
  "config": { "depositPerMember": "100 POT", "threshold": "2-of-3" },
  "transactions": [
    {
      "step": 1,
      "description": "Alice deposits to multisig",
      "signer": "Alice",
      "txHash": "0xabc...",
      "blockHash": "0x123...",
      "blockNumber": 12345,
      "events": [ { "section": "balances", "method": "Transfer" } ]
    },
    // ... 4 more entries
  ],
  "finalBalances": { "multisig": "0 POT", "dave": "1000300 POT" },
  "generatedAt": "2026-05-20T15:30:00.000Z"
}
```

This file is **the native-deployment evidence** referenced from the main project README.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Failed to connect: WebSocket disconnected` | Railway public node down | Try alternate URL in `.env`, or run `./portaldot_dev --dev --alice` locally |
| `Multisig.NotFound` at Step 5 | Timepoint mismatch (step 4's block / index changed) | Re-run; timepoint is captured automatically |
| `Balances.InsufficientBalance` at Step 1-3 | Alice/Bob/Charlie out of POT | On `--dev` they have millions — confirm you're on a dev chain, not a fresh testnet |
| RPC timeout > 60s | Railway node frozen (known issue per Discord) | Switch endpoint or wait for community-hosted node to auto-restart |

---

## License

MIT — same as the parent project.
