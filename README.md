# Auralis

**AI-Powered Decentralized Arisan with Intelligent Multi-Agent Approval**

> Reimagining Indonesia's centuries-old rotating savings tradition (*Arisan*) as a transparent, AI-governed onchain coordination protocol on Portaldot.

[![Built on Portaldot](https://img.shields.io/badge/Built%20on-Portaldot-6E40C9)](https://portaldot-dev.readthedocs.io/)
[![Smart Contract](https://img.shields.io/badge/Smart%20Contract-ink!-FF6B6B)](https://use.ink/)
[![Gas Token](https://img.shields.io/badge/Gas-POT-00D4AA)](https://portaldot-dev.readthedocs.io/)
[![Hackathon](https://img.shields.io/badge/Hackathon-Portaldot%20Mini%20S1-yellow)](https://portaldot-dev.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

> ## 🚨 Current Deployment Status (May 2026)
>
> Portaldot's Contracts API is currently v5, which **only supports ink! 3.x**. Our full architecture is ink! 5.x and cannot deploy to any current Portaldot node (per [Discord admin LevelMax + Quabnation](https://discord.gg/portaldot), 18 May 2026 — confirmed both local `portaldot_dev` and the community Railway node run the same binary with the same blocker).
>
> **Our submission therefore has two complementary deliverables:**
>
> 1. **Architectural deliverable** — 7 complete ink! 5.x contracts in [`contracts/`](./contracts/). Build clean to optimized WASM. Ready to deploy as soon as Portaldot ships Contracts API v9+. (Full design in Sections 5-13 below.)
> 2. **Live on-chain deliverable** — a minimal Arisan flow in [`companion/`](./companion/) using native Portaldot pallets (`pallet-balances` + `pallet-multisig`). **5 transactions already executed live on Portaldot dev** (2026-05-20); see [§14.7](#147-️-captured-native-pallet-proof-live-on-portaldot-dev) for the captured tx hashes.
>
> This hybrid satisfies the "Portaldot Native Deployment" criterion (live POT-fee transactions on Portaldot) while preserving the full ink! 5.x architecture we designed.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem & Solution](#2-problem--solution)
3. [Target Tracks](#3-target-tracks)
4. [Key Features](#4-key-features)
5. [System Architecture](#5-system-architecture)
6. [Multi-Agent AI Workflow](#6-multi-agent-ai-workflow)
7. [Withdrawal Flow (End-to-End)](#7-withdrawal-flow-end-to-end)
8. [Reputation & Identity Model](#8-reputation--identity-model)
9. [Smart Contract Design](#9-smart-contract-design)
10. [Data Model](#10-data-model)
11. [Technical Stack](#11-technical-stack)
12. [Project Structure](#12-project-structure)
13. [Backend Implementation Spec](#13-backend-implementation-spec)
14. [Deployment Strategy & Companion Demo](#14-deployment-strategy--companion-demo)
15. [Getting Started](#15-getting-started)
16. [Demo Scenario](#16-demo-scenario)
17. [Roadmap](#17-roadmap)
18. [Risks & Mitigation](#18-risks--mitigation)
19. [Success Criteria](#19-success-criteria)
20. [Team & Credits](#20-team--credits)
21. [License](#21-license)

---

## 1. Overview

**Auralis** is a decentralized rotating-savings (Arisan) coordination platform built on the **Portaldot** blockchain. It combines **ink! smart contracts** with **off-chain Multi-Agent AI** to evaluate, vote on, and execute withdrawal requests automatically — making one of Indonesia's most-loved community savings traditions **trustless, transparent, and fair**.

In a traditional Arisan, members contribute a fixed sum at regular intervals and one member receives the pot each round. Disputes typically arise around **who gets paid next**, **when emergency withdrawals are warranted**, and **how to handle non-paying members**. Auralis replaces subjective coordination with **AI reasoning agents** whose verdicts are recorded onchain, weighted by **reputation**, and finalized by a **time-bound onchain vote**.

> **Tagline:** *Gotong royong, dijamin AI dan blockchain.*

### 1.1 Why Portaldot (and not just any Substrate chain)?

Auralis is built **natively** for Portaldot — not ported, not bridged. Three Portaldot capabilities map directly onto the project's core mechanics:

| Portaldot Capability | How Auralis Uses It |
|----------------------|---------------------|
| **Native ink! smart contracts** (`pallet-contracts`) | All six Auralis contracts (GroupRegistry, ArisanGroup, VotingEngine, ReputationRegistry, BadgeNFT, Treasury) are ink! 5.x — deployed and executed natively, with **POT** paying every gas fee. |
| **DHSA — Dynamic Heterogeneous Sharding (256 shards)** | Each Arisan group can live in a logically isolated shard context; voting + reasoning load per group never contends with unrelated groups. |
| **AI-driven contract optimization engine + federated learning runtime** | Auralis' AI agents are *first-class citizens* of the chain, not bolted-on oracles. Reasoning artifacts can be persisted with chain-aware provenance. |
| **ZKP + quantum-resistant primitives** | Roadmap (Level 2) uses Portaldot's native ZKP for private withdrawal reasoning without leaving the chain's trust model. |

### 1.2 Portaldot Chain Facts (used throughout this project)

| Field | Value |
|-------|-------|
| Native gas token | **POT** |
| Token decimals | `14` |
| SS58 address prefix | `42` |
| Mainnet RPC (WSS) | `wss://mainnet.portaldot.io` |
| Local dev RPC | `ws://127.0.0.1:9944` |
| Smart-contract framework | **ink!** (Rust, via `pallet-contracts`) |
| Official SDK | **`substrate-interface`** (Python) — used by Auralis agents |
| Consensus | LAO NPoS |

---

## 2. Problem & Solution

### 2.1 Problems in Traditional Arisan

| # | Pain Point | Impact |
|---|------------|--------|
| 1 | Opaque withdrawal decisions | Members lose trust, group dissolves |
| 2 | No measurable creditworthiness | Subjective approvals, favoritism |
| 3 | Manual coordination | Slow, error-prone |
| 4 | No persistent reputation | Bad actors can re-join other groups |
| 5 | No accountability for missed contributions | Free-rider problem |

### 2.2 How Auralis Solves Them

| Problem | Auralis Solution |
|---------|------------------|
| Opaque decisions | Every AI reasoning step + vote stored onchain |
| Creditworthiness | Reputation score derived from deposit history, voting consistency, and badges |
| Slow coordination | Hybrid AI: high-confidence requests auto-execute with challenge window |
| Bad actors hopping groups | Cross-group reputation lookup before group admission |
| Free-riders | Onchain attestations (e.g. *Consistent Payer*, *Trusted Member*) — public and portable |

---

## 3. Target Tracks

Auralis is designed to compete in **two** Portaldot hackathon tracks:

- **🥇 Primary — AI-Powered Onchain Workflows**
  Multi-agent LLM pipeline drives the approval workflow; smart contracts enforce the outcome.

- **🥈 Secondary — Onchain Identity & Coordination**
  Reputation NFTs, cross-group attestations, and group-level coordination primitives.

---

## 4. Key Features

### 4.1 Core MVP Features
- ✅ Create & manage Arisan groups (members, contribution amount, schedule, rules)
- ✅ Onchain deposits with full audit trail
- ✅ AI-powered withdrawal requests with reasoning logs
- ✅ Multi-Agent voting with reputation-weighted ballots
- ✅ Time-bound auto-execution (24h max)
- ✅ Per-member onchain reputation score
- ✅ Onchain badges & attestations

### 4.2 Advanced Features (Level 1 — Hackathon)
- **Hybrid AI Approval** — `confidence > 85%` → reduced quorum + 12h challenge window
- **Reputation-Weighted Voting** — High-reputation members carry larger vote weight
- **Optimistic Execution** — Emergency mode with instant release + challenge window
- **Cross-Group Reputation Check** — Agents query reputation across all Auralis groups
- **Onchain Badges** — `Consistent Payer`, `Trusted Member`, `Group Founder`, `Dispute-Free`

### 4.3 Future Features (Level 2)
- Zero-Knowledge proofs for private reasoning inputs
- AI Copilot for schedule recommendation & risk prediction
- Onchain dispute resolution (challenge → arbiter)
- RWA integration (Arisan-backed real-world asset savings)
- Gamification & inter-group leaderboards

---

## 5. System Architecture

### 5.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["🌐 Client Layer"]
        WEB[Next.js Web App]
        WALLET[Portaldot-compatible Wallet<br/>SS58 prefix 42]
    end

    subgraph AI["🤖 AI Agent Layer (Off-chain)"]
        REQAGENT[Requester Agent<br/>Pre-validation]
        REVAGENT[Reviewer Agents<br/>One per voter]
        ORCH[Agent Orchestrator<br/>LLM Router]
        IDX[Indexer<br/>Onchain Read]
    end

    subgraph Chain["⛓️ Portaldot Blockchain"]
        SC1[GroupRegistry<br/>ink!]
        SC2[ArisanGroup<br/>ink!]
        SC3[ReputationRegistry<br/>ink!]
        SC4[BadgeNFT<br/>ink!]
        SC5[VotingEngine<br/>ink!]
    end

    subgraph Infra["🛠️ Supporting Infra"]
        LLM[LLM Provider<br/>Claude / GPT]
        IPFS[(IPFS<br/>Reasoning Logs)]
        SUBSQUID[(Indexer DB<br/>SubSquid)]
    end

    WEB --> WALLET
    WALLET -->|Sign Tx| SC1
    WALLET -->|Sign Tx| SC2
    WEB -->|Query| IDX

    SC2 -->|Event: WithdrawalRequested| ORCH
    ORCH --> REQAGENT
    REQAGENT --> LLM
    REQAGENT -->|Confidence Score| SC5
    ORCH --> REVAGENT
    REVAGENT --> LLM
    REVAGENT -->|Vote Tx| SC5

    SC5 -->|Result| SC2
    SC2 --> SC3
    SC3 --> SC4

    IDX --> SUBSQUID
    SUBSQUID -->|Watch Events| Chain
    ORCH -.Reasoning.-> IPFS

    style Chain fill:#1a1a2e,stroke:#00d4aa,color:#fff
    style AI fill:#16213e,stroke:#ff6b6b,color:#fff
    style Client fill:#0f3460,stroke:#6e40c9,color:#fff
```

### 5.2 Layered Responsibility

| Layer | Responsibility | Trust Assumption |
|-------|----------------|------------------|
| **Smart Contract** | Source of truth, fund custody, vote tallying, execution | Trustless (audited code) |
| **AI Agent** | Reasoning, recommendation, confidence scoring | Verifiable (reasoning stored, vote onchain) |
| **Indexer** | Fast read access to event history | Non-authoritative (chain is source of truth) |
| **Frontend** | UX, signing, visualization | Browser-side, non-authoritative |

---

## 6. Multi-Agent AI Workflow

Auralis uses a **two-tier agent system**: one **Requester Agent** that pre-validates the request, and **N Reviewer Agents** (one per group member) that independently reason about the request and cast onchain votes.

### 6.1 Agent Roles

```mermaid
flowchart LR
    subgraph T1["Tier 1 — Pre-validation"]
        RA[Requester Agent]
    end

    subgraph T2["Tier 2 — Independent Review"]
        REV1[Reviewer Agent #1<br/>Member A]
        REV2[Reviewer Agent #2<br/>Member B]
        REV3[Reviewer Agent #3<br/>Member C]
        REVN[Reviewer Agent #N<br/>Member N]
    end

    REQ[/User submits<br/>Withdrawal Request/] --> RA
    RA -->|✅ Pass| T2
    RA -->|❌ Reject| END[Auto-rejected onchain]

    REV1 --> VOTE[VotingEngine ink!]
    REV2 --> VOTE
    REV3 --> VOTE
    REVN --> VOTE

    VOTE --> RESULT{Quorum<br/>+ Threshold?}
    RESULT -->|Yes| EXEC[Release Funds]
    RESULT -->|No| DENY[Reject]

    style RA fill:#ff6b6b,color:#fff
    style VOTE fill:#00d4aa,color:#000
```

### 6.2 Requester Agent — Pre-validation Checks

The Requester Agent runs in **< 10 seconds** and outputs a structured verdict:

| Check | Data Source | Weight |
|-------|-------------|--------|
| Deposit consistency (months paid / total) | `ArisanGroup` contract events | 25% |
| Cross-group participation | `ReputationRegistry` | 15% |
| Reputation score | `ReputationRegistry` | 25% |
| Stated reason plausibility (LLM judgment) | LLM + request text | 15% |
| Emergency flag verification | Request metadata + history | 10% |
| Outstanding debts to other groups | `ReputationRegistry` | 10% |

**Output schema:**
```json
{
  "confidence": 0.87,
  "verdict": "PASS",
  "reasoning": "Member has 100% deposit consistency...",
  "flags": ["EMERGENCY_VERIFIED"],
  "recommended_path": "HYBRID_FAST_TRACK"
}
```

### 6.3 Reviewer Agent — Independent Reasoning

Each group member has a **personal Reviewer Agent** that:
1. Reads the request + Requester Agent's verdict (as one input, not gospel).
2. Pulls the requester's deposit history, badges, and prior votes.
3. Applies the member's configured **voting policy** (e.g., *Conservative*, *Trust-Default*, *Strict-Emergency*).
4. Submits an onchain `Vote(approve | reject, confidence, reasoning_hash)`.

> Reasoning text is uploaded to **IPFS**; only its hash + summary lives onchain to keep gas costs low.

### 6.4 Confidence-Based Execution Paths

```mermaid
flowchart TD
    START([Requester Agent Verdict]) --> CONF{Confidence Level}

    CONF -->|≥ 85%| FAST[Hybrid Fast-Track<br/>Quorum: 30%<br/>Challenge: 12h]
    CONF -->|50–84%| NORM[Normal Path<br/>Quorum: 60%<br/>Voting: 24h]
    CONF -->|< 50%| BLOCK[Auto-Reject<br/>+ Reasoning logged]

    FAST --> CHECK1{Challenged?}
    CHECK1 -->|No| EXEC1[✅ Execute]
    CHECK1 -->|Yes| ESCAL[Escalate to Full Vote]

    NORM --> TALLY{Approve > 50%<br/>weighted by rep?}
    TALLY -->|Yes| EXEC2[✅ Execute]
    TALLY -->|No| REJ[❌ Reject]

    ESCAL --> TALLY

    style FAST fill:#00d4aa,color:#000
    style BLOCK fill:#ff6b6b,color:#fff
    style EXEC1 fill:#90ee90,color:#000
    style EXEC2 fill:#90ee90,color:#000
```

---

## 7. Withdrawal Flow (End-to-End)

The complete user journey from request submission to fund release:

```mermaid
sequenceDiagram
    autonumber
    actor U as User (Requester)
    participant FE as Next.js Frontend
    participant SC as ArisanGroup (ink!)
    participant RA as Requester Agent
    participant VE as VotingEngine (ink!)
    participant RV as Reviewer Agents
    participant RR as ReputationRegistry

    U->>FE: Submit withdrawal + reason
    FE->>SC: tx: request_withdrawal(amount, reason_hash)
    SC-->>SC: Emit WithdrawalRequested event

    Note over RA: ⏱️ < 10 sec
    SC-->>RA: Event subscription
    RA->>RR: Read member reputation
    RA->>SC: Read deposit history
    RA->>RA: LLM reasoning + scoring
    RA->>VE: submit_prevalidation(confidence, verdict, reasoning_cid)

    alt confidence ≥ 85%
        VE-->>VE: Set fast-track mode (12h challenge)
    else 50% ≤ confidence < 85%
        VE-->>VE: Standard mode (24h voting)
    else confidence < 50%
        VE->>SC: auto_reject(reason)
        SC-->>U: ❌ Rejected (with reasoning)
    end

    par For each member
        RV->>SC: Read request + history
        RV->>RV: LLM independent reasoning
        RV->>VE: cast_vote(approve|reject, rep_weight, reasoning_cid)
    end

    Note over VE: ⏱️ Deadline reached OR quorum hit
    VE->>VE: Tally weighted votes
    VE->>SC: finalize(result)

    alt Approved
        SC->>U: 💰 Transfer funds (POT)
        SC->>RR: Update reputation (+)
    else Rejected
        SC->>RR: Update reputation (neutral)
        SC-->>U: ❌ Rejected
    end

    SC-->>FE: Emit WithdrawalFinalized
    FE-->>U: Show result + full reasoning trace
```

### Step Summary

| # | Step | Actor | Onchain? | Max Latency |
|---|------|-------|----------|-------------|
| 1 | Submit request | User | Yes (tx) | — |
| 2 | Pre-validation | Requester Agent | Yes (writes verdict) | 10 s |
| 3 | Path decision | VotingEngine | Yes | Instant |
| 4 | Reviewer reasoning | Reviewer Agents | Off-chain (votes onchain) | < 5 min/agent |
| 5 | Tally & finalize | VotingEngine | Yes | Instant on deadline |
| 6 | Fund release | ArisanGroup | Yes (tx) | Instant |

---

## 8. Reputation & Identity Model

### 8.1 Reputation Score Components

```mermaid
flowchart LR
    subgraph Inputs["📊 Input Signals"]
        D[Deposit Consistency<br/>40%]
        V[Voting Participation<br/>20%]
        Q[Vote Quality<br/>15%]
        A[Group Age<br/>10%]
        B[Badge Count<br/>10%]
        P[Cross-group Penalties<br/>5%]
    end

    subgraph Calc["🧮 Aggregator"]
        SUM[Weighted Sum<br/>0–1000]
    end

    subgraph Output["🏆 Reputation Tier"]
        T1[Bronze 0–250]
        T2[Silver 251–500]
        T3[Gold 501–750]
        T4[Platinum 751–1000]
    end

    D --> SUM
    V --> SUM
    Q --> SUM
    A --> SUM
    B --> SUM
    P --> SUM

    SUM --> T1 & T2 & T3 & T4

    style SUM fill:#00d4aa,color:#000
    style T4 fill:#e5e4e2,color:#000
    style T3 fill:#ffd700,color:#000
    style T2 fill:#c0c0c0,color:#000
    style T1 fill:#cd7f32,color:#fff
```

### 8.2 Onchain Badges (Soulbound NFTs)

| Badge | Trigger Condition | Effect |
|-------|------------------|--------|
| **Consistent Payer** | 12 consecutive on-time deposits | +50 rep |
| **Trusted Member** | Vote agreement ≥ 80% over 20 votes | +75 rep, +1.2x vote weight |
| **Group Founder** | Created a group with ≥ 5 active members | +30 rep |
| **Dispute-Free** | 6 months with no challenge raised | +40 rep |
| **Cross-Group Veteran** | Active in 3+ groups for 3+ months each | +60 rep |

Badges are **soulbound** (non-transferable) and serve as portable proof of behavior across the Portaldot ecosystem.

### 8.3 Vote Weight Calculation

```
vote_weight = base_weight × reputation_multiplier × badge_multiplier

where:
  base_weight             = 1.0
  reputation_multiplier   = 0.5 + (rep_score / 1000)        # range 0.5–1.5
  badge_multiplier        = 1.0 + (0.1 × trusted_badge_count) # capped at 1.5
```

---

## 9. Smart Contract Design

### 9.1 Contract Topology

```mermaid
flowchart TB
    GR[GroupRegistry<br/>━━━━━━━━━━━<br/>create_group<br/>list_groups<br/>join_group]

    AG[ArisanGroup<br/>━━━━━━━━━━━<br/>deposit<br/>request_withdrawal<br/>execute<br/>members, schedule]

    VE[VotingEngine<br/>━━━━━━━━━━━<br/>cast_vote<br/>tally<br/>finalize<br/>challenge]

    RR[ReputationRegistry<br/>━━━━━━━━━━━<br/>get_score<br/>update_score<br/>cross_group_lookup]

    BN[BadgeNFT<br/>━━━━━━━━━━━<br/>mint_badge<br/>list_badges<br/>soulbound: true]

    TR[Treasury<br/>━━━━━━━━━━━<br/>hold POT<br/>release<br/>refund]

    GR -->|deploys| AG
    AG -->|opens| VE
    AG -->|holds| TR
    VE -->|writes| RR
    RR -->|triggers| BN
    AG -->|queries| RR

    style GR fill:#6e40c9,color:#fff
    style AG fill:#00d4aa,color:#000
    style VE fill:#ff6b6b,color:#fff
    style RR fill:#ffd700,color:#000
    style BN fill:#e5e4e2,color:#000
    style TR fill:#1a1a2e,color:#fff
```

### 9.2 Contract Responsibilities

| Contract | Responsibility |
|----------|---------------|
| **GroupRegistry** | Factory for new groups; global directory |
| **ArisanGroup** | Per-group state: members, schedule, balance, withdrawals |
| **VotingEngine** | Generic voting primitive: ballot collection, tally, finalize |
| **ReputationRegistry** | Global per-account reputation score; cross-group queryable |
| **BadgeNFT** | Soulbound attestations; ink! ERC-721-like, non-transferable |
| **Treasury** | Holds POT contributions; releases on `VotingEngine.finalize(APPROVED)` |

### 9.3 Critical Events

```rust
// emitted by ArisanGroup
event DepositMade(member: AccountId, amount: Balance, round: u32);
event WithdrawalRequested(req_id: u64, requester: AccountId, amount: Balance, reason_cid: Hash);
event WithdrawalFinalized(req_id: u64, approved: bool, confidence: u32);

// emitted by VotingEngine
event PrevalidationSubmitted(req_id: u64, confidence: u32, verdict: u8, cid: Hash);
event VoteCast(req_id: u64, voter: AccountId, approve: bool, weight: u32, cid: Hash);
event Challenged(req_id: u64, challenger: AccountId);

// emitted by ReputationRegistry / BadgeNFT
event ReputationUpdated(account: AccountId, old: u32, new: u32, reason: u8);
event BadgeMinted(account: AccountId, badge_id: u32);
```

---

## 10. Data Model

### 10.1 Entity Relationship Diagram

```mermaid
erDiagram
    GROUP ||--o{ MEMBER : contains
    GROUP ||--o{ DEPOSIT : receives
    GROUP ||--o{ WITHDRAWAL_REQUEST : holds
    MEMBER ||--|| REPUTATION : has
    MEMBER ||--o{ BADGE : earns
    MEMBER ||--o{ DEPOSIT : makes
    MEMBER ||--o{ VOTE : casts
    WITHDRAWAL_REQUEST ||--o{ VOTE : receives
    WITHDRAWAL_REQUEST ||--|| PREVALIDATION : has
    REVIEWER_AGENT ||--o{ VOTE : produces
    REQUESTER_AGENT ||--|| PREVALIDATION : produces

    GROUP {
        u64 id PK
        AccountId founder
        Balance contribution_amount
        u32 round_period_days
        u32 max_members
        u64 created_at
    }
    MEMBER {
        AccountId account PK
        u64 group_id FK
        u64 joined_at
        bool is_active
    }
    REPUTATION {
        AccountId account PK
        u32 score
        u32 deposits_made
        u32 votes_cast
        u32 disputes
    }
    BADGE {
        u64 id PK
        AccountId owner
        u8 badge_type
        u64 minted_at
        bool soulbound
    }
    DEPOSIT {
        u64 id PK
        u64 group_id FK
        AccountId from
        Balance amount
        u32 round
        u64 timestamp
    }
    WITHDRAWAL_REQUEST {
        u64 id PK
        u64 group_id FK
        AccountId requester
        Balance amount
        Hash reason_cid
        u8 status
        u64 deadline
    }
    PREVALIDATION {
        u64 req_id PK_FK
        u32 confidence
        u8 verdict
        Hash reasoning_cid
    }
    VOTE {
        u64 id PK
        u64 req_id FK
        AccountId voter
        bool approve
        u32 weight
        Hash reasoning_cid
    }
    REQUESTER_AGENT {
        string agent_id PK
        string llm_model
        string policy
    }
    REVIEWER_AGENT {
        string agent_id PK
        AccountId owner
        string policy
        string llm_model
    }
```

### 10.2 State Machine — Withdrawal Request

```mermaid
stateDiagram-v2
    [*] --> Submitted: request_withdrawal()
    Submitted --> PreValidating: emit event
    PreValidating --> AutoRejected: confidence < 50%
    PreValidating --> FastTrack: confidence ≥ 85%
    PreValidating --> Voting: 50% ≤ confidence < 85%

    FastTrack --> Challenged: any member challenges
    FastTrack --> Approved: 12h challenge window passes
    Challenged --> Voting

    Voting --> Approved: quorum + threshold met
    Voting --> Rejected: deadline + threshold missed
    Voting --> Approved: deadline + threshold met

    Approved --> Executed: treasury.release()
    Rejected --> [*]
    AutoRejected --> [*]
    Executed --> [*]
```

---

## 11. Technical Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Blockchain** | **Portaldot** (Layer-0, DHSA sharded, LAO NPoS consensus) | Hackathon requirement; native ink! + AI-friendly runtime |
| **Smart Contract** | ink! 5.x (Rust) | Type-safe, deterministic, gas-efficient |
| **Gas Token** | **POT** (14 decimals, SS58 prefix 42) | Mandatory native gas |
| **Chain Endpoint** | `wss://mainnet.portaldot.io` (mainnet) · `ws://127.0.0.1:9944` (local) | Official Portaldot RPC |
| **Off-chain Agents** | **Python 3.11 + `substrate-interface`** (official Portaldot SDK) | First-class Portaldot SDK; native ink! contract calls |
| **Agent Framework** | LangChain (Python) + Anthropic SDK | Standard multi-agent orchestration |
| **LLM Provider** | Claude (Anthropic) — pluggable | Reasoning quality; swap-friendly |
| **Frontend** | Next.js 15 + TypeScript | Mature React ecosystem |
| **Frontend Chain Lib** | `@polkadot/api` + `@polkadot/api-contract` (Substrate-compatible, points at Portaldot WS) | Generic Substrate JS lib; works with any Substrate-based chain incl. Portaldot |
| **Wallet** | Any Substrate-compatible wallet configured for Portaldot RPC (SS58=42) — e.g. Polkadot.js extension, Talisman, SubWallet — until an official Portaldot wallet is released | Compatible with Portaldot SS58 + POT |
| **Indexer** | Custom event listener on `wss://mainnet.portaldot.io` using `substrate-interface.filter_events` | Native Portaldot event filtering |
| **Off-chain Storage** | IPFS (via web3.storage) | Cheap reasoning-log persistence; only CID on-chain |
| **Styling** | TailwindCSS + shadcn/ui | Rapid, modern UI |
| **Testing** | `cargo test` + `cargo contract test` (ink!) · `pytest` (agents) · Vitest (FE) | Standard tooling |
| **Local Dev Chain** | `substrate-contracts-node` (matches Portaldot's pallet-contracts runtime) | Local-only iteration before deploying to Portaldot testnet/mainnet |

> **Portaldot Native Deployment** (mandatory hackathon criterion): all six ink! contracts compiled with `cargo contract build --release` and deployed via `substrate-interface` against `wss://mainnet.portaldot.io`. POT is the gas token for every transaction. No bridge, no chain abstraction.

---

## 12. Project Structure

```
auralis/
├── contracts/                  # ink! smart contracts (Rust) — 7 contracts, all built
│   ├── group_registry/
│   ├── arisan_group/
│   ├── voting_engine/
│   ├── reputation_registry/
│   ├── badge_nft/
│   ├── treasury/
│   ├── agent_registry/         # ← onchain agent↔user binding + voting policy
│   └── rust-toolchain.toml     # Pinned to Rust 1.85 (cargo-contract 5.0.3 compatible)
├── agents/                     # Off-chain AI agents (Python, substrate-interface) — TO BUILD
│   ├── orchestrator/           # Event listener + agent router daemon
│   ├── requester_agent/        # Pre-validation logic (shared system agent)
│   ├── reviewer_agent/         # Per-member reviewer (one instance per voter)
│   ├── portaldot_client/       # substrate-interface wrapper for Portaldot
│   ├── shared/                 # IPFS helpers, config, logging
│   ├── pyproject.toml
│   └── requirements.txt
├── indexer/                    # Portaldot event indexer (Python) — TO BUILD (lower priority, see §14.5)
├── frontend/                   # Next.js frontend (in progress separately)
│   ├── app/
│   ├── components/
│   └── lib/
├── companion/                  # ⭐ Native-pallet Arisan flow demo (TypeScript + @polkadot/api)
│   ├── src/                    # Live on-chain proof-of-concept
│   │   ├── index.ts            # 5-transaction Arisan flow
│   │   ├── api.ts              # Connect to Portaldot WS
│   │   ├── multisig.ts         # Threshold-account helpers
│   │   ├── verify.ts           # Replay verification for judges
│   │   └── types.ts
│   ├── package.json
│   └── README.md               # How to run the companion demo
├── scripts/                    # Deployment + dev tooling — TO BUILD (lower priority, see §14.5)
│   ├── deploy_portaldot.py     # Deploys all 7 ink! contracts in dependency order
│   └── seed_demo.py
├── docs/                       # Architecture deep-dives, diagrams
├── requirements.md             # Hackathon spec
└── README.md                   # This file
```

---

## 13. Backend Implementation Spec

> **Audience:** the off-chain backend contributor.
> **Scope:** everything under `agents/`, `indexer/`, and `scripts/`.
> **NOT in scope:** `contracts/` (locked, all 7 contracts already built and deployed) and `frontend/` (owned by the frontend contributor).
>
> This section is detailed enough that you should be able to start coding without further clarification. If something is ambiguous, treat the contract source in `contracts/{name}/lib.rs` as the source of truth.

### 13.1 What you're building

A Python backend that bridges Portaldot's onchain events with off-chain LLM reasoning, then writes the LLM verdicts back onchain. Concretely:

| Component | Type | Purpose |
|-----------|------|---------|
| **Orchestrator** | Daemon | Subscribes to chain events, routes them to agents, retries failed txs |
| **Requester Agent** | Per-request function | Pre-validates a withdrawal request, produces a confidence score (0–10000 bps), writes verdict via `VotingEngine.submit_prevalidation` |
| **Reviewer Agent** | Per-member function | Independent reasoning per group member, casts vote via `VotingEngine.cast_vote` using member's delegated agent key |
| **Portaldot Client** | Shared library | Typed wrappers around `substrate-interface` for the 7 contracts |
| **IPFS Helper** | Shared library | Upload reasoning text → return CID as `[u8; 32]` for onchain storage |
| **Indexer** | Daemon | Stream events into Postgres for fast frontend reads |
| **Deploy Script** | One-shot | Deploy 7 contracts in dependency order, wire addresses, populate `.env` |

### 13.2 Onchain interfaces you'll call

ABI JSON for each contract is generated at `contracts/{name}/target/ink/{name}.json` after `cargo contract build --release`. Feed these directly into `substrate-interface.ContractInstance`.

**Messages BE writes to chain (TX):**

| Contract | Message | Args | Signed by |
|----------|---------|------|-----------|
| `AgentRegistry` | `register_agent` | `(agent_key, policy: u8 enum, policy_cid: [u8;32])` | User wallet (frontend triggers; BE may generate the agent_key on user's behalf) |
| `ArisanGroup` | `deposit` (payable) | `()` + POT transfer | User wallet (frontend) |
| `ArisanGroup` | `request_withdrawal` | `(amount: Balance, reason_cid: [u8;32])` | User wallet (frontend) |
| `ArisanGroup` | `execute` | `(req_id: u64)` | Anyone — orchestrator can auto-trigger after approval |
| `VotingEngine` | `submit_prevalidation` | `(requester, arisan_group, confidence_bps: u32, reasoning_cid: [u8;32], total_voters: u32)` | **Requester Agent's account** (must be whitelisted via `add_whitelisted_prevalidator` — done at deploy time) |
| `VotingEngine` | `cast_vote` | `(req_id: u64, approve: bool, reasoning_cid: [u8;32])` | **Reviewer Agent's signing key** (the `agent_key` registered in `AgentRegistry`) |
| `VotingEngine` | `finalize` | `(req_id: u64)` | Anyone — orchestrator should auto-call when deadline reached OR (quorum met AND approval majority) |

**Read-only queries BE makes:**

| Contract | Query | Returns | Use case |
|----------|-------|---------|----------|
| `ArisanGroup` | `get_member(account)` | `Option<MemberInfo>` | Deposit history for reasoning |
| `ArisanGroup` | `member_count()` | `u32` | Pass as `total_voters` arg |
| `ArisanGroup` | `get_request(req_id)` | `Option<WithdrawalRequest>` | Status check |
| `ArisanGroup` | `contribution_amount()` | `Balance` | Validation in frontend / dry-run |
| `ReputationRegistry` | `get_stats(account)` | `Stats { score, deposits_made, on_time, votes_cast, ... }` | Composite signals for reasoning |
| `ReputationRegistry` | `cross_group_lookup(account)` | `Stats` | Cross-group history check |
| `ReputationRegistry` | `get_tier(account)` | `Tier { Bronze, Silver, Gold, Platinum }` | UI badges, anti-Sybil |
| `AgentRegistry` | `policy_of(user)` | `Option<Policy>` | Pick the right reviewer prompt template |
| `AgentRegistry` | `owner_of(agent_key)` | `Option<AccountId>` | Resolve a signing key → user (mostly used by VotingEngine itself, but useful for debugging) |
| `BadgeNFT` | `total_of(account)` | `u32` | Profile screen |

**Events to subscribe to:**

| Contract | Event | Why |
|----------|-------|-----|
| `ArisanGroup` | `WithdrawalRequested(req_id, requester, amount, reason_cid, round)` | Trigger Requester Agent |
| `ArisanGroup` | `DepositMade(member, amount, round, on_time)` | Optional: update reputation (separate from voting) |
| `VotingEngine` | `PrevalidationSubmitted(req_id, requester, path, confidence_bps, cid)` | Trigger N Reviewer Agents IF `path != AutoRejected` |
| `VotingEngine` | `VoteCast(req_id, voter, approve, weight, cid)` | Update queue, check if quorum hit |
| `VotingEngine` | `VotingFinalized(req_id, approved, approve_weight, reject_weight)` | Optionally trigger `ArisanGroup.execute` if approved |
| `AgentRegistry` | `AgentRegistered`, `PolicyUpdated`, `AgentRevoked` | Maintain in-memory agent table |

### 13.3 Withdrawal Lifecycle — the critical path

```
[Event] ArisanGroup.WithdrawalRequested(req_id, requester, amount, reason_cid)
    ↓
Orchestrator picks up event from WS subscription
    ↓
Spawn Requester Agent:
    1. Fetch reasoning text from IPFS using reason_cid
    2. Read requester's onchain history:
       - ArisanGroup.get_member(requester) → deposit history
       - ReputationRegistry.get_stats(requester) → composite score
       - ReputationRegistry.cross_group_lookup(requester) → cross-group rep
    3. LLM call (Claude) with structured prompt → JSON verdict
       { confidence: 0.87, verdict: "FAST_TRACK"|"PASS"|"REJECT",
         reasoning: "...", flags: ["EMERGENCY_VERIFIED"] }
    4. Upload reasoning text to IPFS → new CID
    5. Submit tx:
       VotingEngine.submit_prevalidation(
           requester, arisan_group_addr,
           confidence_bps = int(confidence * 10000),
           reasoning_cid, total_voters = member_count
       )
    ↓
[Event] VotingEngine.PrevalidationSubmitted(req_id, path, confidence_bps, cid)
    ↓
If path == FastTrack or Normal:
    For each of N group members:
        Spawn Reviewer Agent(member):
            1. Read member's policy: AgentRegistry.policy_of(member)
            2. Load prompt template per policy:
               Conservative / TrustDefault / StrictEmergency / Custom (cid)
            3. Read same context as Requester (history + reputation)
            4. LLM call → approve | reject + reasoning
            5. Upload reasoning to IPFS
            6. Submit tx (signed by member's delegated agent_key):
               VotingEngine.cast_vote(req_id, approve, reasoning_cid)
    ↓
[Events] N × VoteCast streaming in
    ↓
Orchestrator polls finalization conditions:
    - Path::FastTrack: after 12h deadline without challenge → finalize
    - Path::Normal: at 24h deadline OR (quorum 60% met AND approve > reject)
    ↓
Submit tx: VotingEngine.finalize(req_id) → triggers ArisanGroup.on_voting_finalized
    ↓
If approved: submit tx ArisanGroup.execute(req_id) → Treasury releases POT → requester wallet
```

### 13.4 Agent onboarding flow

When a user first joins Auralis, the BE must help them register a Reviewer Agent:

```
User connects wallet on frontend → picks voting persona
    ↓
Frontend calls BE: POST /api/agent/prepare { user: AccountId, policy: "Conservative" }
BE:
    1. Generate fresh Sr25519 keypair (this becomes agent_key)
    2. Store private key in vault / .env (MVP) keyed by user pubkey
    3. Upload prompt template for chosen policy to IPFS → policy_cid
    4. Return: { agent_key_pubkey, policy_cid } to frontend
    ↓
Frontend asks user wallet to sign tx:
    AgentRegistry.register_agent(agent_key, policy_enum, policy_cid)
    ↓
[Event] AgentRegistered fires → BE indexes the binding
```

### 13.5 Required folder layout (must conform)

```
agents/
├── orchestrator/
│   ├── __init__.py
│   ├── main.py                 # Entry: python -m agents.orchestrator
│   ├── event_router.py         # Maps each event type → handler coroutine
│   └── job_queue.py            # asyncio.Queue + retry wrapper
├── requester_agent/
│   ├── __init__.py
│   ├── agent.py                # PreValidateAgent class
│   ├── tools.py                # Onchain read tools (history, reputation)
│   └── prompts.py              # System + user prompt templates
├── reviewer_agent/
│   ├── __init__.py
│   ├── agent.py                # ReviewerAgent class
│   ├── policies.py             # Conservative/TrustDefault/StrictEmergency selectors
│   └── prompts.py
├── portaldot_client/
│   ├── __init__.py
│   ├── client.py               # PortaldotClient(ws_url, ss58_prefix)
│   ├── contracts.py            # Typed wrapper per contract
│   └── tx.py                   # Sign + submit + dry-run cost estimator
├── shared/
│   ├── __init__.py
│   ├── ipfs.py                 # upload_text(s) -> [u8;32] CID
│   ├── config.py               # pydantic settings from .env
│   └── logging.py              # structlog setup
├── pyproject.toml
├── requirements.txt
└── .env.example

indexer/
├── __init__.py
├── main.py                     # Entry: python -m indexer
├── schema.sql                  # Postgres tables (see 13.8)
└── requirements.txt

scripts/
├── deploy_portaldot.py         # See 13.6
└── seed_demo.py                # Create 1 group + 5 members + 1 withdrawal for demo
```

### 13.6 Deploy script — contract dependency order

`scripts/deploy_portaldot.py` must deploy in this exact order (contracts have cross-dependencies via constructor args):

```python
# 1. Contracts with no dependencies first
agent_registry = deploy("agent_registry.contract", constructor_args={})
group_registry = deploy("group_registry.contract", constructor_args={})

# 2. BadgeNFT needs a minter — use placeholder (zero address), patch later
badge_nft = deploy("badge_nft.contract", constructor_args={"minter": ZERO_ADDRESS})

# 3. ReputationRegistry needs badge_nft addr
reputation_registry = deploy("reputation_registry.contract",
    constructor_args={"badge_nft": badge_nft.address})

# 4. Patch BadgeNFT minter → reputation_registry
call(badge_nft, "set_minter", new_minter=reputation_registry.address)

# 5. VotingEngine needs reputation_registry + agent_registry
voting_engine = deploy("voting_engine.contract",
    constructor_args={
        "reputation_registry": reputation_registry.address,
        "agent_registry": agent_registry.address,
    })

# 6. Treasury needs voting_engine
treasury = deploy("treasury.contract",
    constructor_args={"voting_engine": voting_engine.address})

# 7. Whitelist permissions
call(voting_engine, "add_whitelisted_prevalidator",
     addr=REQUESTER_AGENT_ACCOUNT)
call(reputation_registry, "add_whitelisted_writer", writer=voting_engine.address)
# (ArisanGroup instances are deployed dynamically per group via GroupRegistry,
#  each one must also be whitelisted as a writer at the time of group creation.)

# 8. Write addresses to agents/.env and frontend/.env.local
write_env({
    "CONTRACT_GROUP_REGISTRY": group_registry.address,
    "CONTRACT_VOTING_ENGINE": voting_engine.address,
    "CONTRACT_REPUTATION_REGISTRY": reputation_registry.address,
    "CONTRACT_AGENT_REGISTRY": agent_registry.address,
    "CONTRACT_TREASURY": treasury.address,
    "CONTRACT_BADGE_NFT": badge_nft.address,
})
```

### 13.7 Environment variables (`agents/.env.example`)

```env
# ── Chain ─────────────────────────────────────────
PORTALDOT_WS_ENDPOINT=ws://127.0.0.1:9944         # dev; wss://mainnet.portaldot.io in prod
PORTALDOT_SS58_PREFIX=42
PORTALDOT_TOKEN_DECIMALS=14

# ── Signing ───────────────────────────────────────
REQUESTER_AGENT_SURI=//Alice                       # MVP only, rotate for prod
DEPLOYER_SURI=//Alice

# ── Contract addresses (populated by deploy script) ──
CONTRACT_GROUP_REGISTRY=
CONTRACT_VOTING_ENGINE=
CONTRACT_REPUTATION_REGISTRY=
CONTRACT_AGENT_REGISTRY=
CONTRACT_TREASURY=
CONTRACT_BADGE_NFT=

# ── LLM ───────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-sonnet-4-6

# ── IPFS ──────────────────────────────────────────
WEB3_STORAGE_TOKEN=
IPFS_GATEWAY=https://w3s.link

# ── Indexer ───────────────────────────────────────
DATABASE_URL=postgresql://localhost:5432/auralis
INDEXER_HTTP_PORT=8081

# ── Orchestrator ──────────────────────────────────
ORCHESTRATOR_HTTP_PORT=8080
LOG_LEVEL=INFO
RETRY_MAX_ATTEMPTS=3
```

### 13.8 Indexer schema (`indexer/schema.sql`)

Minimum tables needed by frontend:

```sql
CREATE TABLE groups (
    group_id BIGINT PRIMARY KEY,
    founder TEXT NOT NULL,
    arisan_group_addr TEXT UNIQUE NOT NULL,
    contribution_amount NUMERIC,
    period_days INTEGER,
    max_members INTEGER,
    created_at TIMESTAMPTZ
);

CREATE TABLE members (
    group_id BIGINT REFERENCES groups(group_id),
    account TEXT NOT NULL,
    joined_at TIMESTAMPTZ,
    PRIMARY KEY (group_id, account)
);

CREATE TABLE deposits (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT,
    account TEXT,
    amount NUMERIC,
    round INTEGER,
    on_time BOOLEAN,
    block_height BIGINT,
    timestamp TIMESTAMPTZ
);

CREATE TABLE withdrawal_requests (
    req_id BIGINT,
    group_id BIGINT,
    requester TEXT,
    amount NUMERIC,
    reason_cid BYTEA,         -- 32 bytes
    status TEXT,              -- 'pending' | 'fasttrack' | 'normal' | 'approved' | 'rejected' | 'executed'
    confidence_bps INTEGER,
    deadline_ms BIGINT,
    PRIMARY KEY (group_id, req_id)
);

CREATE TABLE votes (
    req_id BIGINT,
    group_id BIGINT,
    voter TEXT,
    approve BOOLEAN,
    weight INTEGER,
    reasoning_cid BYTEA,
    voted_at TIMESTAMPTZ,
    PRIMARY KEY (group_id, req_id, voter)
);

CREATE TABLE badges (
    badge_id BIGINT PRIMARY KEY,
    owner TEXT,
    badge_type INTEGER,
    minted_at TIMESTAMPTZ
);

CREATE TABLE reputation_history (
    id BIGSERIAL PRIMARY KEY,
    account TEXT,
    old_score INTEGER,
    new_score INTEGER,
    reason TEXT,
    block_height BIGINT,
    timestamp TIMESTAMPTZ
);
```

### 13.9 Python dependencies (`requirements.txt` baseline)

```
substrate-interface>=1.7.0
anthropic>=0.40.0
langchain>=0.3.0
langchain-anthropic>=0.2.0
python-dotenv>=1.0.0
pydantic>=2.5.0
psycopg2-binary>=2.9.0
aiohttp>=3.10.0
structlog>=24.1.0
requests>=2.31.0
```

### 13.10 Definition of Done (acceptance criteria)

End-to-end test against `substrate-contracts-node --dev` MUST pass:

1. ✅ `python scripts/deploy_portaldot.py --endpoint ws://127.0.0.1:9944` deploys all 7 contracts, fills `agents/.env`
2. ✅ `python -m agents.orchestrator` starts → logs "subscribed to N event topics"
3. ✅ Sending `ArisanGroup.deposit()` from a member → orchestrator detects within 5s
4. ✅ Sending `request_withdrawal(...)` → Requester Agent submits `submit_prevalidation` within 30s
5. ✅ All `member_count` Reviewer Agents submit `cast_vote` within 60s
6. ✅ Orchestrator calls `finalize` when finalization conditions are met
7. ✅ If approved: `execute` runs → requester wallet balance increases by approved amount
8. ✅ `BadgeMinted` event fires when reputation threshold is crossed (after ≥12 on-time deposits, etc.)
9. ✅ Indexer's Postgres has rows in every table within 10s of corresponding event

### 13.11 Out of scope (you do NOT do these)

- ❌ Smart contract development (DONE; locked at commit `1210cf4` or later)
- ❌ Frontend (owned by frontend contributor in `frontend/`)
- ❌ HSM / Vault for agent keys (`.env` is fine for MVP — note this in security caveats)
- ❌ Multi-chain support (Portaldot only)
- ❌ Production-grade Subsquid indexer (a simple substrate-interface event listener + Postgres is enough)

### 13.12 Reference

- Contract sources (source of truth for ABI semantics): `contracts/{name}/lib.rs`
- ABI metadata (consumable JSON): `contracts/{name}/target/ink/{name}.json`
- Build pipeline: `contracts/rust-toolchain.toml` (Rust 1.85 pinned — do NOT change)
- Portaldot Python SDK install: https://portaldot-dev.readthedocs.io/en/latest/python-sdk/Install.html
- ink! docs (for understanding the contract calls): https://use.ink/
- Anthropic SDK: https://docs.anthropic.com/

---

## 14. Deployment Strategy & Companion Demo

> **Audience:** anyone building, demoing, or judging this project.
> **TL;DR:** Our 7 ink! 5.x contracts cannot deploy to current Portaldot binary (Contracts API v5, only supports ink! 3.x). For live on-chain demonstration we use native pallets via `companion/`. The full ink! architecture deploys as-is once Portaldot upgrades to Contracts API v9+.

### 14.1 The Contracts API v5 blocker (admin-confirmed)

Per the Portaldot Discord (18 May 2026), all current Portaldot binaries — both local `portaldot_dev` and the community-hosted Railway node — run the same outdated `pallet-contracts`:

> **@LevelMax (admin):** "specVersion: 1002, Contract API: version 5. Same result as your local node. **Both run the same binary — the public node doesn't help in this case.**"
>
> **@Quabnation (admin):** "❌ Local node — contracts API v5, ink! 4.x rejected at runtime · ❌ Public node — same binary, same result · ❌ ink! 3.x — currently broken on crates.io (toml_datetime dependency bug) · ✅ Native pallets via @polkadot/api — works perfectly, fully supported."
>
> **@LevelMax (admin):** "There is no workaround on the client side. The team needs to ship an updated node binary with contracts API v9+." — *No timeline given.*

So we have a Catch-22:

| Strategy | Build OK? | Portaldot runtime accepts? |
|----------|:---------:|:---------------------------:|
| ink! **5.x** (our current architecture) | ✅ | ❌ (rejected — needs API v9+) |
| ink! **4.x** | ✅ | ❌ (rejected — needs API v9+) |
| ink! **3.x** (only one Portaldot would accept) | ❌ (crates.io broken) | (✅) |

**Conclusion:** zero ink! versions can be deployed to Portaldot today. The block is at runtime/infrastructure level, not on our side.

### 14.2 Our two-track response

**Track 1 — Architectural (full vision):** [`contracts/`](./contracts/) holds 7 complete ink! 5.x contracts representing the full Auralis design (GroupRegistry, ArisanGroup, VotingEngine, ReputationRegistry, BadgeNFT, Treasury, AgentRegistry). All build to optimized WASM (9-16 KB each). All carry unit tests. They will deploy as-is when Portaldot ships Contracts API v9+.

**Track 2 — Live on-chain (today):** [`companion/`](./companion/) holds a minimal Arisan flow implemented with **native Portaldot pallets**, which work on the current Contracts API v5 chain:

```
Alice    (100 POT) ──┐
Bob      (100 POT) ──┼─→ shared 2-of-3 multisig account
Charlie  (100 POT) ──┘            │
                                  ▼
              Alice proposes withdrawal of 300 POT → Dave
              Bob approves → quorum hit → multisig auto-executes
                                  │
                                  ▼
                            Dave receives 300 POT
```

5 transactions, all using `pallet-balances` and `pallet-multisig`, all POT-fee-paid on Portaldot. **This is our on-chain "Portaldot Native Deployment" evidence** per [Quabnation's submission guidance](https://discord.gg/portaldot) (14 May 2026):

> "For proof just include a transaction hash from your local node in your README. That is your native deployment evidence."

### 14.3 Running the companion demo

```bash
cd companion
npm install
cp .env.example .env       # edit endpoint / amounts if needed
npm start
```

Outputs:
- Console log of each of the 5 transactions (signer, tx hash, block number)
- `companion/tx-proof.json` — machine-readable proof bundle for inclusion in submission

Replayable verification by anyone:
```bash
npm run verify   # re-queries the chain by tx hash, confirms each tx is in history
```

See [`companion/README.md`](./companion/README.md) for full details.

### 14.4 How companion maps to ink! contracts

Each native-pallet call corresponds to a method we'd otherwise call on our ink! contracts:

| companion (today, native pallets) | ink! contracts (`./contracts/`, ready for API v9+) |
|-----------------------------------|----------------------------------------------------|
| `pallet-balances.transferKeepAlive` (3×) | `ArisanGroup.deposit()` |
| `pallet-multisig.approveAsMulti` (1st vote) | `VotingEngine.cast_vote()` (first signer) |
| `pallet-multisig.asMulti` (2nd vote, auto-executes) | `VotingEngine.finalize()` + `ArisanGroup.execute()` + `Treasury.release()` |
| Off-chain JSON / event log | `ReputationRegistry.update_score()` |
| Not modeled in companion | `BadgeNFT.mint_badge()`, `AgentRegistry.register_agent()` |

The companion is **deliberately minimal** — it proves the core money flow works on-chain. The full ink! suite adds: cross-group reputation, soulbound badge attestations, delegated agent identity, AI-driven pre-validation routing, time-bound voting windows, and reputation-weighted vote tallying — none of which are expressible via native pallets, all of which are implemented in `contracts/`.

### 14.5 Implications for collaborators

The SC (ink!) work is **frozen** — submission-ready, no further changes needed. The remaining work is split between FE and BE. Below are detailed handoff specs based on our pivot decisions.

---

#### 🎨 Frontend (FE) contributor — `frontend/`

**Status:** original plan (`@polkadot/api-contract` → deployed ink! contracts) is **blocked**. FE now uses `@polkadot/api` directly against native pallets — same pattern proven in [`companion/`](./companion/) (already live on-chain, see §14.7).

**Goal:** Provide a working "Live Demo" page where judges/users click a button and watch the 5-tx Arisan flow execute live on Portaldot dev node. Display each tx hash, block number, and final balance in real-time.

##### Wallet strategy: use `//Alice` for MVP

Do NOT integrate wallet extension in Phase 1. Use the well-known Substrate dev account:

```typescript
const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
const alice = keyring.addFromUri('//Alice');  // pre-funded with millions of POT
```

| Pros | Cons |
|------|------|
| ✅ Zero setup for judges | ❌ Shared account (no privacy) |
| ✅ Instant demo, no popups | ❌ Not production model |
| ✅ Pre-funded on dev chain | (acceptable for hackathon scope) |

Portaldot Extension support → Phase 2 polish, optional.

##### Phase 1 — MVP demo (must-do, ~4-6 hours)

| # | Task | Time | Reference |
|---|------|------|-----------|
| 1 | `npm install @polkadot/api @polkadot/keyring @polkadot/util-crypto` | 2 min | — |
| 2 | Port connection layer → `frontend/lib/portaldot/client.ts` | 15 min | `companion/src/api.ts` |
| 3 | Port multisig helper → `frontend/lib/portaldot/multisig.ts` (no logic change) | 5 min | `companion/src/multisig.ts` |
| 4 | Reimagine 5-tx flow as async generator → `frontend/lib/portaldot/flow.ts` | 1-2 hours | `companion/src/index.ts` |
| 5 | Build React hook → `frontend/hooks/usePortaldot.ts` | 30 min | — |
| 6 | Demo page + 3 components | 2 hours | (see file structure below) |
| 7 | Env var: `NEXT_PUBLIC_PORTALDOT_WS=wss://drip-node-production.up.railway.app` | 5 min | — |
| 8 | E2E test in browser | 30 min | — |

##### Target file structure

```
frontend/
├── app/
│   └── demo/
│       └── page.tsx                  # ← NEW — Live demo page
├── components/
│   └── demo/                         # ← NEW
│       ├── ArisanFlowRunner.tsx      # Main button + flow orchestration
│       ├── TxStepCard.tsx            # Per-step pending/success/error UI
│       └── ConnectionBanner.tsx      # 🟢/🔴 RPC status
├── hooks/
│   └── usePortaldot.ts               # ← NEW — useApi + connection state
└── lib/
    └── portaldot/                    # ← NEW
        ├── client.ts                 # port companion/src/api.ts (singleton ApiPromise)
        ├── multisig.ts               # port companion/src/multisig.ts (verbatim)
        ├── flow.ts                   # 5-tx flow as `async function*` yielding step events
        └── format.ts                 # formatAmount, toPlanck (port from companion/src/api.ts)
```

##### Recommended async-generator flow pattern

```typescript
// lib/portaldot/flow.ts
export type FlowEvent =
  | { kind: 'step-start'; step: number; description: string }
  | { kind: 'step-success'; step: number; txHash: string; blockNum: number }
  | { kind: 'step-error'; step: number; error: string }
  | { kind: 'flow-complete'; daveBalance: bigint; multisigBalance: bigint };

export async function* runArisanFlow(api: ApiPromise): AsyncGenerator<FlowEvent> {
  // ... yield events as 5 txs progress
  // (see companion/src/index.ts for full algorithm including the
  //  "existing multisig proposal" detection in step 4)
}
```

UI consumes via `for await (const event of runArisanFlow(api))` → setState. Lets React stay responsive while tx flow runs.

##### Phase 2 — Polish (optional)

- Add `@polkadot/extension-dapp` + Portaldot Extension wallet support (toggle: "Use Alice" vs "Connect wallet")
- Per-tx explorer links (`https://polkadot.js.org/apps/?rpc=<encoded>#/explorer/query/<blockHash>`)
- Pre-flight balance check + display
- "Verify proof" button that re-runs `npm run verify`-equivalent in browser

##### DO NOT spend time on

- ❌ `@polkadot/api-contract` (no ink! contracts to call)
- ❌ ABI JSON parsing UI
- ❌ Cross-contract orchestration UI (`AgentRegistry` ↔ `VotingEngine` ↔ etc.)
- ❌ Multi-step wizard for ink!-specific concepts (badges, reputation tier, etc. — not in native-pallet demo)

These can be added post-Portaldot-API-upgrade. For now, anything `contracts/*` related stays as architectural documentation only.

---

#### 🐍 Backend (BE) contributor — `agents/`

**Status:** Full BE spec in [Section 13](#13-backend-implementation-spec) (orchestrator, event listener, indexer, multi-agent system) is the **post-API-upgrade design target** — keep it as architectural reference. For hackathon submission, scope drops drastically because the SC the BE would call isn't deployable.

**Recommended scope:** off-chain LLM simulation only. Demonstrate the AI reasoning quality without on-chain hooks.

##### Phase 1 — Off-chain LLM simulation (must-do, ~1-2 days)

| # | Task | Time | Output artifact |
|---|------|------|-----------------|
| 1 | Setup Python project in `agents/simulation/` | 30 min | `pyproject.toml`, `.venv/` |
| 2 | Install: `anthropic`, `langchain`, `langchain-anthropic`, `pydantic` | 5 min | `requirements.txt` |
| 3 | Implement `requester_agent.py` | 3-4 hours | Class + sample run |
| 4 | Implement `reviewer_agent.py` (3 personas: Conservative / TrustDefault / StrictEmergency) | 3-4 hours | Class + sample runs |
| 5 | Implement `run_simulation.py` — end-to-end runner | 1 hour | `outputs/full_simulation_<ts>.md` |
| 6 | Document in `agents/README.md` | 30 min | Markdown doc |

##### Requester Agent contract (Phase 1)

**Input:** hardcoded sample payload
```python
WithdrawalRequest(
    requester="5DAA...",
    amount_pot=300,
    reason="Medical emergency — surgery scheduled next week",
    mock_history={
        "deposits_made": 12,
        "deposits_on_time": 11,
        "reputation_score": 720,
        "badges": ["ConsistentPayer", "TrustedMember"],
    }
)
```

**Process:**
1. Format input into structured prompt for Claude
2. Call Anthropic API with system prompt = pre-validation persona
3. Parse JSON response

**Output:**
```python
RequesterVerdict(
    confidence_bps=8700,           # 0..10000 (basis points)
    verdict="FAST_TRACK",          # FAST_TRACK | PASS | REJECT
    reasoning="Member has 91.6% on-time rate, TrustedMember badge...",
    flags=["EMERGENCY_VERIFIED"],
)
```

Save to `outputs/requester_<timestamp>.json`. Print summary to terminal.

##### Reviewer Agent contract (Phase 1)

**Input:** request + Requester Agent's verdict (as one input, not gospel) + persona config
**Output:** approve/reject + reasoning + per-persona confidence

Run 3 times per scenario (one per persona) → produces 3 votes. Print weighted tally (vote × persona weight).

##### Phase 2 — Optional native-pallet integration

If Phase 1 done early, mirror `companion/src/index.ts` in Python using `substrate-interface`:

```python
from substrateinterface import SubstrateInterface, Keypair
api = SubstrateInterface(url=WS_URL, ss58_format=42)
alice = Keypair.create_from_uri("//Alice")
# ... same 5-tx flow
```

Useful only if demo narrative wants "BE-triggered txs" instead of "user-triggered txs from FE". Optional.

##### DO NOT spend time on

- ❌ Event subscription daemons / orchestrator main loop
- ❌ PostgreSQL indexer + schema setup
- ❌ ink! contract deploy script (`scripts/deploy_portaldot.py`)
- ❌ Cross-contract event correlation
- ❌ Agent key derivation / signing service
- ❌ IPFS upload pipelines (just save reasoning to local files for demo)

All blocked by no SC deploy. Document them as "Post-API-Upgrade Phase 2" in `agents/README.md` so reviewers understand the full architectural intent.

---

#### 📜 Smart contract (SC) work — FROZEN ✅

The 7 ink! 5.x contracts in [`contracts/`](./contracts/) are submission-ready:

- ✅ Build clean to optimized WASM (~9-16K per contract)
- ✅ Unit tests pass for each
- ✅ Documented in [`contracts/README.md`](./contracts/README.md)
- ✅ Ready to deploy unchanged once Portaldot Contracts API upgrades to v9+

**No further refactor or build work is needed.** The deploy commands live in `contracts/README.md` §5 — just swap the RPC URL when the API upgrade lands.

---

#### 🤝 Coordination workflow

| Owner | Communicates to | When |
|-------|-----------------|------|
| **You** (project lead) | FE friend | Share this section + `companion/README.md` URL. Confirm Phase 1 scope. |
| **You** | BE friend | Share this section + Section 13. Confirm Phase 1 scope (simulation only). |
| **FE friend** | You | After ports `companion/src/*` to `frontend/lib/portaldot/`, demo working in browser, mergeable PR. |
| **BE friend** | You | After 1 end-to-end simulation runs, prints reasoning to terminal + saves to file. |
| **All** | All | Daily sync via Discord/WA — share blockers, current state. Especially watch for Portaldot Contracts API upgrade announcement. |

### 14.6 Submission proof checklist

When `companion/tx-proof.json` is committed to the repo after running the demo, the submission deliverables are:

- ✅ 5 transaction hashes (proof of Portaldot Native Deployment)
- ✅ 7 ink! 5.x contracts buildable to WASM (architectural completeness)
- ✅ Working frontend that triggers companion flow (demo-able)
- ✅ Documented design (this README + `contracts/README.md` + `companion/README.md`)
- ✅ Demo video showing the live flow + walkthrough of the full ink! design

### 14.7 ⛓️ Captured native-pallet proof (live on Portaldot dev)

The companion demo was executed live on the community-hosted Portaldot dev node on **2026-05-20**. All five transactions below are permanent on-chain:

**Network:**
- RPC: `wss://drip-node-production.up.railway.app`
- Chain: `Development` (Portaldot specVersion 1002)
- Token: POT · SS58 prefix 42 · 14 decimals (12 on this dev chain)

**Participants:**
- Alice (member): `5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
- Bob (member): `5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty`
- Charlie (member): `5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y`
- Dave (recipient): `5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy`
- **Multisig group (2-of-3): `5DjYJStmdZ2rcqXbXGX7TW85JsrW6uG4y9MUcLq2BoPMpRA7`**

**Transactions:**

| # | Step | Signer | Block | Tx hash |
|---|------|--------|------:|---------|
| 1 | Alice deposits 100 POT → multisig | Alice | 50605 | `0x7060bd5e001f61acad123b700ecae9f3287bacb35055bf15c541b4c44f088bce` |
| 2 | Bob deposits 100 POT → multisig | Bob | 50606 | `0xed2cb84dad2bd2ce5c0bddff21fc1e5957985af8ff20b007bf62c771ef3f3acd` |
| 3 | Charlie deposits 100 POT → multisig | Charlie | 50607 | `0x4bb1dd89e8774cb40b59fd5b2f02657f448c2ff8c13779d5670d433393df3ebb` |
| 4 | Alice proposes withdrawal (multisig.approveAsMulti) | Alice | 50551 | `0xfdf2293e845c5ab1cee45833584ddab5812e312d58232dfb60bd4ca2725cc0bf` |
| 5 | Bob approves → quorum hit → auto-executes payout | Bob | 50608 | `0xe26e5822fdef1bd84e7107489c0866117e43ddfff70b525f7729aa019f78cf2a` |

**Result:** Dave's wallet went from 5,000,000 POT → 5,000,300 POT in one atomic multisig execution. The full machine-readable proof bundle is at [`companion/tx-proof.json`](./companion/tx-proof.json).

**Reproduce verification:** any reviewer can re-query the chain by tx hash to confirm:
```bash
cd companion
npm install
npm run verify    # re-checks each tx hash against the Portaldot dev node
```

This satisfies the Portaldot Mini Hackathon S1 "Portaldot Native Deployment" criterion per Discord admin guidance:

> "For proof just include a transaction hash from your local node in your README. That is your native deployment evidence." — @Quabnation, 2026-05-14

### 14.8 Why not on `wss://mainnet.portaldot.io/` (mainnet)?

On **2026-05-20** Portaldot announced the official block explorer at [portalscan.portaldot.io](https://portalscan.portaldot.io/), indexing `wss://mainnet.portaldot.io/`. We probed mainnet to assess whether to re-target the companion demo there for explorer-visible proof.

**Findings** (reproducible via `companion/src/check-mainnet.ts`):

| Aspect | Mainnet (`wss://mainnet.portaldot.io/`) | Companion target (Railway dev) |
|--------|----------------------------------------|-------------------------------|
| Chain name | Portaldot Mainnet | Development |
| Node version | 2.0.0 (same binary family) | 2.0.0 (same) |
| specVersion | **1002** | 1002 |
| Contracts API | **v5** (same blocker, ink! 5.x still rejected) | v5 |
| Token decimals | 14 | 12 |
| `//Alice` balance | **0 POT** (not pre-funded) | Millions of POT (dev genesis) |

**Two implications:**

1. **SC deploy to mainnet is still blocked** — mainnet runs the same `portaldot_dev` v1002 binary with Contracts API v5. No ink! version is deployable to either chain today.

2. **Companion on mainnet would work as native pallets are unaffected**, but Alice has 0 POT there. No public faucet exists (per Discord admin Fardhan, 2026-05-18). POT acquisition for mainnet appears to require a bridge or admin-issued transfer — not something we can do within the hackathon window.

**Decision:** keep companion proof on Railway dev (where Alice is pre-funded and tx already executed). README's §14.7 transaction hashes remain the canonical native deployment evidence. Once a POT acquisition path opens for mainnet, the same `companion/src/index.ts` can be re-run against mainnet with a single `.env` change (`PORTALDOT_WS=wss://mainnet.portaldot.io/`) — txs will then appear in portalscan.

**Reviewers can verify our mainnet probe themselves:**
```bash
cd companion
npm install
npx tsx src/check-mainnet.ts
```

---

## 15. Getting Started

### 15.1 Prerequisites

- **Rust** ≥ 1.75 with `cargo-contract` ≥ 4.0
- **Python** ≥ 3.11 (for agents — uses official Portaldot SDK `substrate-interface`)
- **Node.js** ≥ 20 (for Next.js frontend only)
- **Substrate-compatible browser wallet** configured for Portaldot:
  - RPC: `wss://mainnet.portaldot.io`
  - SS58 prefix: `42`
  - Decimals: `14`, symbol `POT`
- **Local dev node:** `substrate-contracts-node` ≥ 0.38 (offline iteration before Portaldot deploy)
- **POT** test tokens (faucet link in `docs/faucet.md`)
- Anthropic API key in `.env`

### 15.2 Install

```bash
# Clone
git clone https://github.com/EzraNahumury/auralis.git
cd auralis

# 1. Smart contracts (Rust / ink!)
cd contracts && cargo contract build --release && cd ..

# 2. AI agents (Python + Portaldot SDK)
cd agents
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# requirements.txt pins: substrate-interface, anthropic, langchain, python-dotenv, ipfshttpclient
cd ..

# 3. Frontend
cd web && npm install && cd ..
```

### 15.3 Run Locally

```bash
# Terminal 1 — Local dev node (matches Portaldot's pallet-contracts runtime)
substrate-contracts-node --dev

# Terminal 2 — Deploy ink! contracts via Portaldot SDK
python scripts/deploy_portaldot.py --endpoint ws://127.0.0.1:9944

# Terminal 3 — Agent orchestrator (Python)
cd agents && python -m orchestrator

# Terminal 4 — Frontend
cd web && npm run dev
# → http://localhost:3000
```

### 15.4 Deploy to Portaldot Mainnet

```bash
# Same script, swap endpoint to Portaldot's official RPC
python scripts/deploy_portaldot.py \
  --endpoint wss://mainnet.portaldot.io \
  --suri "$DEPLOYER_SURI" \
  --ss58 42
```

All transactions pay gas in **POT**.

### 15.5 Environment Variables

```env
# agents/.env
ANTHROPIC_API_KEY=sk-ant-...
PORTALDOT_WS_ENDPOINT=wss://mainnet.portaldot.io   # local: ws://127.0.0.1:9944
PORTALDOT_SS58_PREFIX=42
PORTALDOT_TOKEN_DECIMALS=14
PORTALDOT_TOKEN_SYMBOL=POT
DEPLOYER_SURI=//Alice                              # replace for mainnet
IPFS_GATEWAY=https://w3s.link
CONTRACT_GROUP_REGISTRY=5F...
CONTRACT_ARISAN_GROUP=5F...
CONTRACT_VOTING_ENGINE=5F...
CONTRACT_REPUTATION=5F...
CONTRACT_BADGE_NFT=5F...
CONTRACT_TREASURY=5F...

# web/.env.local
NEXT_PUBLIC_PORTALDOT_WS=wss://mainnet.portaldot.io
NEXT_PUBLIC_SS58_PREFIX=42
NEXT_PUBLIC_GROUP_REGISTRY=5F...
```

---

## 16. Demo Scenario

The submitted demo video walks through the following **happy-path + edge-case** flow:

### Scene 1 — Group Creation (00:00–00:45)
- Alice creates **"Arisan Tetangga RT 03"** with 5 members, 100 POT/round, monthly schedule.
- Bob, Charlie, Dewi, Eko join via invite link.

### Scene 2 — Deposit (00:45–01:30)
- All members deposit 100 POT for Round 1.
- Onchain explorer shows 5 `DepositMade` events.

### Scene 3 — Normal Withdrawal (01:30–03:00)
- Bob requests withdrawal of 500 POT with reason *"Scheduled Round 1 recipient."*
- Requester Agent returns **confidence 0.92** → **fast-track**.
- 12h challenge window simulated to 30s; no challenge.
- Funds auto-release. Bob gets **+Consistent Payer** badge.

### Scene 4 — Edge Case: Emergency (03:00–05:00)
- Dewi requests **early** withdrawal: *"Medical emergency, hospital bills."*
- Requester Agent: **confidence 0.68** → **normal voting** (24h shortened to 60s).
- Reviewer Agents reason individually; 3/4 approve, weighted vote passes.
- Funds release. Reasoning trail visible onchain + IPFS.

### Scene 5 — Edge Case: Suspicious Request (05:00–06:30)
- A new member (joined 2 days ago, 0 deposits) requests 1000 POT.
- Requester Agent: **confidence 0.12** → **auto-reject**.
- Full reasoning shown: "No deposit history, no badges, reason text inconsistent."

### Scene 6 — Reputation View (06:30–07:00)
- Show each member's reputation score, badges, and cross-group lookup.

---

## 17. Roadmap

```mermaid
gantt
    title Auralis Roadmap
    dateFormat YYYY-MM-DD
    section Hackathon MVP
    Smart Contract Skeleton        :done,    a1, 2026-04-22, 5d
    Requester Agent + Orchestrator :active,  a2, 2026-04-27, 6d
    Reviewer Agents                :         a3, after a2, 4d
    Frontend Group Mgmt + Deposit  :         a4, 2026-05-04, 6d
    Frontend Voting + Reasoning UI :         a5, after a4, 5d
    Demo Video + Polish            :         a6, 2026-05-25, 6d
    section Post-Hackathon
    ZKP for private reasoning      :         b1, 2026-06-01, 30d
    Dispute resolution             :         b2, after b1, 20d
    RWA integration                :         b3, after b2, 30d
    Gamification + Leaderboard     :         b4, after b3, 20d
```

---

## 18. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ink! learning curve | High | Medium | Use official Portaldot templates; pair-program; start with skeleton early |
| LLM hallucination in reasoning | Medium | High | Final decision always onchain; AI is advisory; multiple reviewers |
| Agent downtime / liveness | Medium | Medium | Multiple orchestrator instances; chain falls back to time-bound auto-reject |
| Gas spikes on Portaldot | Low | Medium | Store reasoning on IPFS, only hash onchain |
| Sybil attacks (fake members) | Medium | High | Reputation-weighted voting + cross-group history check |
| Collusion among members | Medium | High | Reputation-weighted vote dilutes low-rep collusion; challenge window |
| Demo-day node instability | Low | High | Recorded demo video as backup; local + testnet deployment |

---

## 19. Success Criteria

Aligned with the official Portaldot hackathon judging criteria:

| Criterion | How Auralis Meets It |
|-----------|---------------------|
| **Portaldot Native Deployment** | ink! contracts deployed on Portaldot; POT as gas; no chain abstraction |
| **Demo Completion** | End-to-end MVP: create group → deposit → AI-driven withdrawal → onchain release |
| **Application Value** | Targets 200M+ Indonesians with cultural fit; expandable to global ROSCAs |
| **Presentation Quality** | Scripted 7-min demo, mermaid diagrams, clear architecture story |
| **AI-Powered Onchain Workflows (Track)** | Two-tier agent system; reasoning logged + onchain vote |
| **Onchain Identity & Coordination (Track)** | Soulbound badges, cross-group reputation, group coordination primitives |

---

## 20. Team & Credits

- **Project Owner:** Ezra Kristanto Nahumury — Full-stack & smart contract dev
- **Stack credits:**
  - [Portaldot](https://portaldot-dev.readthedocs.io/) — Layer-0 host chain, native runtime, POT gas token
  - [Portaldot Python SDK (`substrate-interface`)](https://portaldot-dev.readthedocs.io/en/latest/python-sdk/Install.html) — official agent/deploy SDK
  - [ink!](https://use.ink/) — smart-contract framework
  - [Anthropic Claude](https://www.anthropic.com/) — LLM reasoning
  - [LangChain](https://www.langchain.com/) — agent orchestration
  - [IPFS / web3.storage](https://web3.storage/) — reasoning-log persistence

---

## 21. License

Core smart contracts are released under the **MIT License** — see [LICENSE](LICENSE).
Off-chain agents, frontend, and tooling are dual-licensed MIT/Apache-2.0.

---

<div align="center">

**Auralis — Gotong royong, on the chain.**

Built for **Portaldot Mini Hackathon Online Season 1** · May 2026

</div>
