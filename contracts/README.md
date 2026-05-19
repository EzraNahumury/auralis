# Auralis — Smart Contracts

This directory contains the **7 ink! 5.x smart contracts** that form Auralis' on-chain coordination layer on the Portaldot blockchain.

> **For the project overview, FE/BE specs, and demo flow** → see [`../README.md`](../README.md).
> **This document focuses on:** contract architecture, build pipeline, deployment, and integration handoff.

---

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Contract index](#2-contract-index)
3. [Cross-contract dependency graph](#3-cross-contract-dependency-graph)
4. [Build pipeline](#4-build-pipeline)
5. [Deployment](#5-deployment)
   - 5.1 [Hosted (Railway public node)](#51-hosted-railway-public-node)
   - 5.2 [Local (your own node)](#52-local-your-own-node-advanced)
6. [Deployed addresses & tx proof](#6-deployed-addresses--tx-proof)
7. [ABI / metadata handoff for FE & BE](#7-abi--metadata-handoff-for-fe--be)
8. [Toolchain & versioning](#8-toolchain--versioning)

---

## 1. Architecture overview

Auralis enforces a **multi-agent AI Arisan workflow** entirely on-chain. Off-chain agents do LLM reasoning; the contracts enforce roster, deposits, voting, payouts, reputation, and badges.

```
┌─────────────────┐
│ GroupRegistry   │  Factory + global directory of all Arisan groups
└────────┬────────┘
         │ deploys
         ▼
┌─────────────────┐    deposits     ┌──────────────┐
│ ArisanGroup     │────────────────▶│  Treasury    │  Holds POT escrow
│ (one per group) │     release     │              │  Released ONLY by
│                 │◀────────────────│              │  VotingEngine.finalize
└──┬──────────────┘                 └──────────────┘
   │ emits WithdrawalRequested
   │
   │  ┌────────────────────────────────────────────┐
   │  │ Off-chain agents (BE)                      │
   │  │   - Requester Agent: pre-validation       │
   │  │   - Reviewer Agents: per-member voting    │
   │  └────────────────────┬───────────────────────┘
   │                       │
   ▼                       ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ AgentRegistry   │  │ VotingEngine    │──│ ReputationReg.   │
│ user↔agent      │  │ tally votes     │  │ score 0-1000     │
│ binding+policy  │  │ finalize        │  │ cross-group      │
└─────────────────┘  └─────────────────┘  └────────┬─────────┘
                                                   │ triggers
                                                   ▼
                                          ┌──────────────────┐
                                          │ BadgeNFT         │
                                          │ soulbound        │
                                          │ attestations     │
                                          └──────────────────┘
```

---

## 2. Contract index

| # | Contract | Lines | Role | Constructor args |
|---|----------|------:|------|------------------|
| 1 | [`agent_registry`](./agent_registry/) | 389 | User-wallet → agent-key binding + voting persona policy | — (no deps) |
| 2 | [`group_registry`](./group_registry/) | 204 | Factory + global directory of Arisan groups | — (no deps) |
| 3 | [`badge_nft`](./badge_nft/) | 187 | Soulbound NFT attestations (Consistent Payer, Trusted Member, ...) | `minter: AccountId` |
| 4 | [`reputation_registry`](./reputation_registry/) | 236 | Global per-account reputation 0-1000, composite signals, weighted voting | `badge_nft: AccountId` |
| 5 | [`voting_engine`](./voting_engine/) | 462 | Withdrawal voting: pre-validation routing (fast-track / normal / auto-reject), reputation-weighted tally, finalize callback | `reputation_registry: AccountId, agent_registry: AccountId` |
| 6 | [`treasury`](./treasury/) | 283 | POT escrow; CEI-strict `release()` gated to VotingEngine | `voting_engine: AccountId` |
| 7 | [`arisan_group`](./arisan_group/) | 542 | Per-group brain: roster, deposit forwarding, request lifecycle, execute payout | `group_id, group_registry, treasury, voting_engine, founder, contribution_amount, period_days, max_members` |

**Total:** 2303 lines of ink! 5.x Rust.

For full method-level docs, see each contract's `lib.rs` — events, errors, and inline TODOs document semantics.

---

## 3. Cross-contract dependency graph

Deploy order is enforced by constructor arg dependencies:

```
Step 1 (parallel) → AgentRegistry            (no deps)
                  → GroupRegistry            (no deps)

Step 2           → BadgeNFT(placeholder)     (minter set to Alice initially)

Step 3           → ReputationRegistry(BadgeNFT)

Step 4 (patch)   → BadgeNFT.set_minter(ReputationRegistry)

Step 5           → VotingEngine(ReputationRegistry, AgentRegistry)

Step 6           → Treasury(VotingEngine)

Step 7 (wire)    → VotingEngine.add_whitelisted_prevalidator(<requester_agent_addr>)
                  → ReputationRegistry.add_whitelisted_writer(VotingEngine)

(ArisanGroup is deployed dynamically per group via GroupRegistry, not at infra-deploy time.)
```

---

## 4. Build pipeline

### Pinned toolchain

`rust-toolchain.toml` pins **Rust 1.85.0** (the latest version compatible with cargo-contract before Rust's `panic_immediate_abort` change). Rustup auto-downloads on first build.

### Build a single contract

```bash
cd <contract_dir>          # e.g. agent_registry/
cargo contract build --release
```

Outputs to `target/ink/<name>.{contract,wasm,json}`:
- **`.wasm`** — compiled bytecode (~9-16 KB optimized)
- **`.json`** — metadata / ABI (consumed by FE @polkadot/api-contract and BE substrate-interface)
- **`.contract`** — bundle (wasm + metadata) for `cargo contract instantiate`

### Build all 7 contracts at once

```bash
cd contracts/
for d in agent_registry group_registry badge_nft reputation_registry voting_engine treasury arisan_group; do
  (cd "$d" && cargo contract build --release)
done
```

### Optimized WASM sizes

| Contract | WASM (orig → opt) |
|----------|-------------------|
| `agent_registry` | 39.5K → **12.1K** |
| `group_registry` | 35.1K → **9.0K** |
| `badge_nft` | 36.1K → **9.6K** |
| `reputation_registry` | 35.0K → **9.1K** |
| `voting_engine` | 44.9K → **15.5K** |
| `treasury` | — → **~9K** |
| `arisan_group` | 46.7K → **15.8K** |

All well below typical ink! contracts (Uniswap V2 port is ~30-40K).

---

## 5. Deployment

### 5.1 Hosted (Railway public node) ⭐ recommended

**Network details:**
- **RPC endpoint:** `wss://drip-backend-production-8d86.up.railway.app/node`
- **SS58 prefix:** `42`
- **Token:** `POT`, 14 decimals
- **Pre-funded account:** `//Alice` (millions of POT for testing)
- **Node operator:** community-hosted (LevelMax via Discord)

**Deploy command (example — `agent_registry`):**

```bash
cd contracts/agent_registry
cargo contract instantiate target/ink/agent_registry.contract \
    --constructor new \
    --suri //Alice \
    --url wss://drip-backend-production-8d86.up.railway.app/node \
    --execute --skip-confirm
```

Repeat for each contract in dependency order (see [Section 3](#3-cross-contract-dependency-graph)). Args differ per constructor:

```bash
# BadgeNFT — needs placeholder minter (use Alice's pubkey, patch later)
--args 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY

# ReputationRegistry — needs BadgeNFT address from prior step
--args <BADGE_NFT_ADDR>

# VotingEngine — needs both
--args <REPUTATION_REGISTRY_ADDR> <AGENT_REGISTRY_ADDR>

# Treasury — needs VotingEngine
--args <VOTING_ENGINE_ADDR>
```

**Patch BadgeNFT minter (after ReputationRegistry deployed):**

```bash
cargo contract call \
    --contract <BADGE_NFT_ADDR> \
    --message set_minter \
    --args <REPUTATION_REGISTRY_ADDR> \
    --suri //Alice \
    --url wss://drip-backend-production-8d86.up.railway.app/node \
    --execute --skip-confirm
```

**Wire whitelist permissions (final step):**

```bash
# VotingEngine: allow Alice as the prevalidator (Requester Agent's signing account)
cargo contract call --contract <VOTING_ENGINE_ADDR> \
    --message add_whitelisted_prevalidator \
    --args 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY \
    --suri //Alice --url wss://drip-backend-production-8d86.up.railway.app/node \
    --execute --skip-confirm

# ReputationRegistry: allow VotingEngine to write reputation deltas
cargo contract call --contract <REPUTATION_REGISTRY_ADDR> \
    --message add_whitelisted_writer \
    --args <VOTING_ENGINE_ADDR> \
    --suri //Alice --url wss://drip-backend-production-8d86.up.railway.app/node \
    --execute --skip-confirm
```

### 5.2 Local (your own node) — advanced

Two binary options for a Portaldot-runtime local node:

**Option I — `portaldot_dev` (canonical Portaldot binary)**

Download from [Portaldot-node releases](https://github.com/portaldotVolunteer/Portaldot-node/raw/main/portaldot-testnet-macos.tar.gz) (replace `macos` with `ubuntu` for Linux):

```bash
curl -L https://github.com/portaldotVolunteer/Portaldot-node/raw/main/portaldot-testnet-macos.tar.gz \
     -o portaldot-testnet-macos.tar.gz
tar -xzvf portaldot-testnet-macos.tar.gz
cd portaldot-testnet-macos
chmod 755 portaldot_dev
xattr -cr portaldot_dev          # macOS Gatekeeper
./portaldot_dev --dev --alice
```

Then point cargo-contract at `ws://127.0.0.1:9944` instead of the Railway URL.

> ⚠️ Per Discord community reports (May 2026), the current `portaldot_dev` binary release may not accept ink! 5.x metadata. The Railway hosted node has a newer Contracts pallet that does. If you hit metadata errors locally, switch to Railway or use Option II.

**Option II — `substrate-contracts-node` (generic Substrate, not Portaldot-specific)**

```bash
cargo install contracts-node --locked
substrate-contracts-node --dev --tmp
```

Works for validating contract logic, but the runtime is generic Substrate (POT-equivalent placeholder is `UNIT`), not Portaldot's exact runtime. Acceptable for development; **not** for hackathon submission proof.

---

## 6. Deployed addresses & tx proof

> Updated automatically by `scripts/deploy_railway.sh` (TBD) or manually after deploy.
> All addresses below are on the Railway public Portaldot dev node.

| # | Contract | Address | Code hash | Deploy tx |
|---|----------|---------|-----------|-----------|
| 1 | `AgentRegistry` | `TBD` | `TBD` | `TBD` |
| 2 | `GroupRegistry` | `TBD` | `TBD` | `TBD` |
| 3 | `BadgeNFT` | `TBD` | `TBD` | `TBD` |
| 4 | `ReputationRegistry` | `TBD` | `TBD` | `TBD` |
| 5 | `VotingEngine` | `TBD` | `TBD` | `TBD` |
| 6 | `Treasury` | `TBD` | `TBD` | `TBD` |

**Wiring transactions:**

| Action | Tx hash |
|--------|---------|
| `BadgeNFT.set_minter(ReputationRegistry)` | `TBD` |
| `VotingEngine.add_whitelisted_prevalidator(Alice)` | `TBD` |
| `ReputationRegistry.add_whitelisted_writer(VotingEngine)` | `TBD` |

These constitute the **native deployment evidence** required by the Portaldot Mini Hackathon S1 submission criteria (per Discord admin Quabnation, 2026-05-14):
> "For proof just include a transaction hash from your local node in your README. That is your native deployment evidence."

---

## 7. ABI / metadata handoff for FE & BE

After build, each contract's ABI metadata is at:
```
contracts/<name>/target/ink/<name>.json
```

These JSON files are git-ignored. To share with FE/BE contributors, either:

**Option A — Copy to a committed folder** (best for FE friend without Rust):
```bash
mkdir -p abi
cp contracts/*/target/ink/*.json abi/
git add abi/
```

**Option B — Recipient builds themselves**:
```bash
git clone https://github.com/EzraNahumury/auralis
cd auralis/contracts
for d in */; do (cd "$d" && cargo contract build --release); done
# ABIs now at contracts/*/target/ink/*.json
```

### FE usage (TypeScript / Next.js)

```typescript
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import agentRegistryAbi from '../abi/agent_registry.json';

const provider = new WsProvider('wss://drip-backend-production-8d86.up.railway.app/node');
const api = await ApiPromise.create({ provider });
const contract = new ContractPromise(api, agentRegistryAbi, AGENT_REGISTRY_ADDR);

// Read
const { output } = await contract.query.ownerOf(alice.address, { gasLimit: -1 }, agentKey);

// Write (Alice signs)
const keyring = new Keyring({ type: 'sr25519' });
const alice = keyring.addFromUri('//Alice');
await contract.tx.registerAgent({ gasLimit }, agentKey, policy, policyCid)
    .signAndSend(alice);
```

### BE usage (Python / substrate-interface)

```python
from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.contracts import ContractInstance

api = SubstrateInterface(url="wss://drip-backend-production-8d86.up.railway.app/node", ss58_format=42)
alice = Keypair.create_from_uri("//Alice")

contract = ContractInstance.create_from_address(
    contract_address=AGENT_REGISTRY_ADDR,
    metadata_file="./contracts/agent_registry/target/ink/agent_registry.json",
    substrate=api,
)

# Read
result = contract.read(alice, "owner_of", args={"agent_key": some_key})

# Write — always dry-run first for accurate gas
dry = contract.read(alice, "register_agent", args={"agent_key": agent_key, "policy": "Conservative", "policy_cid": cid})
receipt = contract.exec(alice, "register_agent",
    args={"agent_key": agent_key, "policy": "Conservative", "policy_cid": cid},
    gas_limit=dry.gas_required)
```

---

## 8. Toolchain & versioning

| Tool | Version | Why this version |
|------|---------|------------------|
| **Rust (rustc)** | `1.85.0` | Pinned in `rust-toolchain.toml`. Latest pre-`panic_immediate_abort` change |
| **cargo-contract** | `4.1.3` ⚠️ | Per [Discord admin guidance (LevelMax, 2026-05-13)](https://discord.gg/portaldot): Railway node accepts cargo-contract 4.x metadata. cargo-contract 5.x produces newer metadata that the current Railway runtime rejects. |
| **ink!** | `5.0.0` | In `Cargo.toml`. Used for modern features (`#[ink::scale_derive]`, `ink::trait_definition`, `ink::contract_ref!`) |
| **wasm32 target** | `wasm32-unknown-unknown` | Added via `targets` in `rust-toolchain.toml` |

> If you hit `Cannot try_into() to Metadata: unsupported metadata version` when deploying:
> 1. Verify `cargo contract --version` shows `4.1.3` (not 5.x)
> 2. Install: `RUSTUP_TOOLCHAIN=1.85.0 cargo install --locked --force --version "4.1.3" cargo-contract`

---

## License

MIT — see [`../LICENSE`](../LICENSE).
