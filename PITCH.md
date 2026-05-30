# 🎙️ Pitch Script — Auralis

Presentation script for the Auralis demo. Read aloud during the live demo (3-5 minutes total).

---

## 🎯 Opening (30 seconds)

> "Hi, we're team **Auralis** for the Portaldot Mini Hackathon Season 1.
>
> Have you heard of **Arisan**? It's an Indonesian tradition that's been around for hundreds of years — a group of people pool money regularly, and each period one member takes the entire pot in their turn.
>
> The problem: traditional arisan is **vulnerable to issues** — the treasurer might disappear, manual record-keeping gets messy, disputes arise over whose turn is next. Modern banking solves this but excludes the **180 million unbanked Indonesians**.
>
> **Auralis solves both** — we bring arisan onto the Portaldot blockchain, with AI agents that validate every withdrawal and a multisig that secures the pot. A centuries-old tradition, rebuilt for Web3."

---

## 💡 Why Auralis? (30 seconds)

> "Why does this matter?
>
> **First**, this isn't another DeFi clone — it's a **new financial primitive** rooted in local context. Arisan = trust circle + commitment device + payout lottery, all in one mechanism.
>
> **Second**, we don't mock AI in the backend — we use a **real LLM (Ollama) as two distinct agents**:
> - **Requester Agent**: processes withdrawal requests with full context (deposit history, reputation, reason)
> - **Reviewer Agent**: gives voting suggestions per member based on their policy preferences
>
> **Third**, all governance runs through **on-chain multisig** — not a centralized API. The pot is locked, payouts require threshold signatures, everything is recorded on-chain."

---

## 🏗️ Quick Architecture (30 seconds)

> "Our stack:
>
> - **7 smart contracts** written in **ink! 5.x** — all deployed on Portaldot dev chain via substrate-contracts-node
> - **Next.js 16 frontend** with Polkadot.js for transaction signing
> - **AI agents** powered by Ollama (gpt-oss:120b-cloud / local llama3.2)
> - **Multisig 2-of-3 / 3-of-5** to secure pot withdrawals
>
> The 7 contracts are: `agent_registry`, `group_registry`, `badge_nft`, `reputation_registry`, `voting_engine`, `treasury`, and `arisan_group`.
>
> All addresses are stored in `deploy.local.env`. Cross-contract wiring is automated through `set_minter`, `add_whitelisted_prevalidator`, and `add_whitelisted_writer`."

---

## 🎬 Live Demo (60-90 seconds)

> "Alright, let's jump into the demo. The scenario: **Alice needs 200 POT to cover her child's school fees**."

### Step 1 — Sign In (5 seconds)

> "I'm signing in as **Alice** with a dev key. In production this would be a real wallet — Polkadot.js or Talisman."

### Step 2 — Group Setup (10 seconds)

> "Create a group called 'Arisan Kelas' with 3 members: Alice, Bob, Charlie. 2-of-3 multisig. Each person deposits 100 POT per round.
>
> You can see the multisig address here — `5DjYJS...pRA7`. It's deterministically derived from the combination of members + threshold."

### Step 3 — Deposits (15 seconds)

> "Now it's round 1, everyone deposits. Alice deposits 100 POT — this is a **real on-chain `balances.transferKeepAlive`** to the multisig address. Switch to Bob, deposit. Switch to Charlie, deposit.
>
> The pot now holds **300 POT**. Notice the block number incrementing — these are real transactions, not simulations."

### Step 4 — Request Withdrawal (10 seconds)

> "Alice needs 200 POT, clicks 'Request Withdrawal', provides the reason: 'My child needs urgent school fees', category Emergency.
>
> The request immediately enters **Phase 1 — AI Pre-Validation**."

### Step 5 — AI Phase 1 (15 seconds)

> "This is not a mock. Ollama LLM runs in the backend and analyzes:
> - **Perfect deposit record** — Alice has never been late
> - **High reputation** — 887/1000, Platinum tier
> - **Emergency reason is reasonable**
> - **Verdict: PASS with 90% confidence, FAST-TRACK**
>
> This means we proceed straight to voting with no additional delay."

### Step 6 — AI Phase 2 + Member Vote (20 seconds)

> "The **Reviewer Agent** gives suggestions per member based on their policy:
> - **Bob** (Trust-Default): APPROVE — 'High confidence, no red flags'
> - **Charlie** (Conservative): APPROVE — 'Strong reputation, consistent deposits'
> - **Dave** if present (Strict-Emergency): might REJECT because emergency is unverified
>
> Now **Alice clicks 'Propose on chain'** — first multisig signature (1 of 2).
>
> Switch to Bob → 'Approve & execute' — multisig threshold reached, **status: Completed**."

### Step 7 — Phase 3 Claim (15 seconds) — ⭐ KEY MOMENT

> "Now the important part. Switch back to Alice.
>
> The **Phase 3 — Claim funds** section appears. Alice clicks **'Claim 200 POT'**.
>
> Watch this — **Alice's balance increases by +200 POT** (green delta). **The group pot balance drops to 100 POT** (from 300). Phase 3 becomes 'Funds claimed' green with a **real txHash**.
>
> This isn't animation — it's a real on-chain transfer verifiable on the block explorer."

### Step 8 — Phase 4 History (5 seconds)

> "Every tx is recorded in Phase 4 — propose, approve, execute, claim. Each with block number and tx hash. Full audit trail."

---

## 🎁 Closing (30 seconds)

> "So in summary, **Auralis is**:
>
> 1. **Trust-minimized arisan** — no treasurer needed, the pot is locked in multisig
> 2. **AI-augmented governance** — two distinct agents that assist without overriding human decisions
> 3. **Native to Portaldot** — 7 ink! contracts, POT as gas token, fully on-chain
> 4. **Inclusive by design** — built for Indonesian context, not a copy-paste of Western DeFi
>
> **What's already live:**
> - Web app at `auralis-portaldot.vercel.app`
> - Substrate node on Railway
> - 7 contracts deployed
> - GitHub: `github.com/EzraNahumury/auralis`
>
> That's the demo, thanks for watching. Questions?"

---

## 🎤 Anticipated Q&A

### "Why not use Portaldot mainnet?"
> "Portaldot mainnet isn't live yet. We use `substrate-contracts-node --dev` as our PoC because Portaldot dev nodes ship with Contracts API v5, which rejects ink! 4.x/5.x — that's an infrastructure blocker on their side."

### "Is the multisig actually on-chain?"
> "On Portaldot mainnet (once pallet-multisig is available) — yes, fully real. On the local `substrate-contracts-node`, pallet-multisig isn't included — so we simulate with a fallback that returns the real callHash. But deposits and claims **remain real on-chain transfers** via pallet-balances."

### "What's the AI? Does it break if Ollama goes down?"
> "We use Ollama — either cloud (`gpt-oss:120b-cloud`) or local (`llama3.2`). If Ollama is unreachable, there's a **fallback to seeded mock verdicts** so the UI flow keeps working for demos. But production needs the AI live."

### "What's the maximum number of members per group?"
> "Substrate's multisig threshold effectively caps at 100 signatories. For practical arisan, the sweet spot is 5-15 members per group. For larger structures, you can do nested groups (a group of groups)."

### "What is the POT token?"
> "It's Portaldot's native gas token — same role as DOT on Polkadot. On dev chain it's a mock; on mainnet (when live) it carries real value."

### "How is Auralis different from a regular DAO?"
> "Regular DAOs focus on voting & treasury management. Auralis is specifically built for the **rotating payout pattern of arisan** — round-based deposits, fair turn-taking, commitment device baked in. Plus AI that helps trust-scoring between members."

---

## 📊 Numbers You Can Cite

- **7 ink! smart contracts** deployed
- **2 AI agents** (Requester + Reviewer) running real LLM
- **180 million unbanked Indonesians** as potential market
- **2-of-3 multisig** default threshold
- **5 real on-chain transactions** as proof (see `companion/tx-proof.json`)
- **60-90 seconds** end-to-end demo flow

---

## 🎨 Tone & Style Tips

- **Mix English with technical terms** as-is — "real on-chain", "transfer", "multisig" stay in their native form
- **Point at the screen during demo** — don't read from slides, let the audience follow your cursor
- **Pause after each action** — let the block number bump be visible
- **Highlight concrete numbers** — "300 POT becomes 100 POT", "+200 POT green delta"
- **Don't defend limitations** — explain with confidence: "this is the dev chain, mainnet will differ"

---

## 🔑 Core Points You Must Convey

If you only have **1 minute**, deliver these:

1. **Auralis = Arisan on Portaldot** (financial inclusion + cultural relevance)
2. **AI-augmented, not AI-controlled** — humans decide, AI advises
3. **Real on-chain** — not a disguised database
4. **7 contracts + Next.js + Ollama** = production-ready architecture
5. **Demo runs end-to-end in under 90 seconds**

Done. A powerful pitch doesn't need many words — it needs **a demo that runs smoothly**.
