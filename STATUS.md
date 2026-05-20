# 📋 Status & Briefing Tim — Auralis

> **Untuk:** teman-teman tim (FE, BE) yang lagi koordinasi
> **Update:** 2026-05-20
> **Tujuan:** menjelaskan kenapa strategi SC sempat berubah-ubah, apa keputusan final, dan apa yang setiap orang harus lakukan untuk submission 31 Mei.

---

## 🎯 TL;DR (paling penting)

1. **SC ink! kita SUDAH JADI** (7 contracts), tapi **tidak bisa deploy ke Portaldot saat ini** karena bug node Portaldot, bukan masalah code kita.
2. **Solusi sementara:** kita pakai **native pallets** Portaldot (built-in feature) via folder `companion/` — udah live di onchain Portaldot, 5 transactions terbukti.
3. **Untuk submission:** kombinasi (a) 7 SC sebagai design + (b) companion sebagai bukti live onchain. **Admin Portaldot sudah konfirmasi ini valid.**
4. **Saat Portaldot fix node mereka**, 7 SC kita langsung bisa deploy tanpa ubah apapun.

---

## 🧭 Kenapa SC berubah-ubah strateginya?

Ringkasan timeline keputusan, supaya jelas konteksnya:

### Tanggal 19 Mei (kemarin) — initial deploy attempt
- Kita bikin 7 ink! 5.x smart contracts ✅
- Build clean ke optimized WASM ✅
- Coba deploy ke `substrate-contracts-node` (generic Substrate) → **BERHASIL**
- Coba deploy ke Railway Portaldot public node → **GAGAL** ("unsupported metadata version")

### Awalnya — kita pikir masalah tooling
- Cargo-contract version mismatch?
- Install cargo-contract 4.1.3 (downgrade) — fixed beberapa hal, tapi error tetap
- Kebingungan toolchain (rust 1.95 vs 1.85, cargo-contract 4 vs 5)

### Discord update 18 Mei (yang baru kita baca) — **MASALAH SEBENARNYA**
Admin Portaldot (LevelMax + Quabnation) konfirmasi:
- Portaldot node pakai **Contracts API versi 5** (versi tua, dari 2023)
- Contracts API v5 cuma support **ink! versi 3.x**
- ink! 4.x dan 5.x **ditolak di runtime level**
- ink! 3.x sendiri rusak di crates.io (dep bug)

**Artinya:** SEMUA developer hackathon kena masalah yang sama. Bukan cuma kita. Tidak ada workaround di sisi client. **Tunggu Portaldot upgrade node** atau **pivot ke pendekatan lain**.

### Tanggal 20 Mei (hari ini) — pivot ke hybrid strategy
- **Track 1**: SC ink! tetap dipertahankan sebagai design/architecture deliverable (frozen, ready untuk masa depan)
- **Track 2**: Bikin companion demo pakai **native pallets** (bukan ink!) — ini built-in di Portaldot, gak terpengaruh Contracts API blocker

### Tanggal 20 Mei — companion LIVE
- 5 transactions executed di Portaldot dev node (Railway)
- Tx hashes captured ke `companion/tx-proof.json`
- Submission proof onchain ✅

### Tanggal 20 Mei (sore) — admin Portaldot KONFIRMASI strategi
LevelMax (admin) reply ke pertanyaan kita:
> "The native pallet path is **genuinely solid for most hackathon use cases**. Don't sleep on it."

Plus dia kasih 3 kriteria minimum native pallet submission:
1. Tx signed di Portaldot (dev atau mainnet)
2. Tx hash + block inclusion sebagai bukti
3. Logic mapping ke intent contract

**Kita penuhi semua 3 kriteria.** ✅

---

## 🔍 Apa masalah TEKNIS sebenarnya?

Untuk yang penasaran detail:

```
Cek ke chain Portaldot:
  specVersion: 1002  (frozen sejak 2023)
  Contracts API: version 5  ← INI MASALAHNYA

Yang dibutuhkan untuk ink! 5.x:
  Contracts API: version 9+

Gap: 5 → 9 = 4 major version behind
```

Beda antara contracts API v5 vs v9+:
- v5: API lama, hanya support ink! sampai 3.x
- v9+: API modern, support ink! 4.x dan 5.x

**Ini decision Portaldot team**, bukan keputusan kita. Mereka harus rilis binary baru. Kita gak bisa apa-apa selain nunggu.

Per Discord, request upgrade udah di-escalate ke core team. Status: "on their radar, no timeline."

---

## ✅ Solusi yang kita pakai (works TODAY)

### Companion demo (folder `companion/`)

Pakai 2 native pallets Portaldot:
- `pallet-balances` — transfer POT
- `pallet-multisig` — multisig threshold approval

Bikin flow yang **fungsional sama** seperti Arisan tapi pakai built-in pallets:

```
Step 1: Alice deposit 100 POT → multisig account (Alice/Bob/Charlie, 2-of-3)
Step 2: Bob deposit 100 POT → multisig
Step 3: Charlie deposit 100 POT → multisig
Step 4: Alice propose withdrawal 300 POT → Dave (member yang dapat giliran)
Step 5: Bob approve → 2-of-3 quorum hit → multisig auto-execute payout
```

Hasil: 5 tx onchain Portaldot, tx hash semua tersimpan di `companion/tx-proof.json`.

**Mapping ke SC kita:**

| SC ink! (rencana asli) | Native pallet (yang kita pakai) |
|------------------------|--------------------------------|
| `ArisanGroup.deposit()` | `pallet-balances.transferKeepAlive` |
| `VotingEngine.cast_vote()` | `pallet-multisig.approveAsMulti` |
| `Treasury.release()` | Multisig auto-execute saat threshold hit |

Logika identik. Cuma backend yang beda — yang satu custom code (SC), yang satu built-in feature (native pallets).

---

## 🔮 Solusi permanen (saat Portaldot upgrade node)

**Saat Portaldot rilis node baru dengan Contracts API v9+:**

1. Kita ganti `--url` di deploy script ke endpoint baru (1 line change)
2. Run `cargo contract instantiate` untuk 7 contracts kita
3. ABI JSON dari `contracts/*/target/ink/*.json` siap dipakai FE
4. Companion bisa tetap dipertahankan sebagai backup/alternative path

**Estimasi effort kalau upgrade datang:** ~1-2 jam total. Code SC udah ready, gak perlu apa-apa lagi.

**Apakah upgrade akan datang sebelum 31 Mei?** Belum jelas. Per admin, sudah di-escalate tapi gak ada timeline. **Kita jangan bergantung pada ini.**

---

## 👨‍💻 Apa yang FE friend harus lakukan?

### ✅ Yang udah dikerjain (commit `4b6a5a3`)
- Port companion ke `frontend/lib/chain/` (4 file: client, multisig, proof, types)
- App shell rewrite (Mercury-style sidebar)
- Components: HeroCard, Timeline, MemberRow, AnimatedNumber, LiveProgress
- Emoji avatars (Alice 🦊, Bob 🐻, Charlie 🐸, Dave 🐱)
- Dual mode: "recorded" (baca tx-proof.json) + "live" (trigger flow real-time)

### ❓ Wallet — TIDAK PERLU wallet extension untuk submission!

**Untuk submission, kita pakai shared dev account `//Alice`** yang udah pre-funded jutaan POT di Portaldot dev node. Cara pakai:

```typescript
const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
const alice = keyring.addFromUri('//Alice');  // ← gak butuh wallet extension
```

**Pros pakai Alice:**
- ✅ Zero setup untuk judges (langsung klik button, demo jalan)
- ✅ Pre-funded, no faucet issues
- ✅ Cocok untuk hackathon scope

**Cons (acceptable):**
- ❌ Shared account dengan user lain di Portaldot dev (no privacy)
- ❌ Bukan production model

**Wallet extension** (Portaldot Extension dari Chrome web store) baru perlu kalau:
- Ada waktu sisa untuk polish post-MVP
- Mau bikin demo dengan account user sendiri (lebih real-world)
- Anyway sifatnya OPSIONAL — submission tetap valid tanpa ini

### 📋 Sisa yang masih bisa dipolish (optional)

| Task | Effort | Wajib? |
|------|--------|--------|
| Test `frontend/` jalan: `cd frontend && npm install && npm run dev` | 5 menit | ✅ verify dulu |
| Pastikan recorded mode show tx-proof data dengan benar | 10 menit | ✅ |
| Pastikan live mode bisa trigger 5 tx di browser | 10 menit | ✅ |
| Per-tx explorer link (Polkadot.js Apps URL) | 30 menit | 🟡 nice-to-have |
| Pre-flight balance check display | 30 menit | 🟡 nice-to-have |
| Portaldot Extension wallet integration | 4-6 jam | ❌ skip kalau gak sempet |
| Mobile responsive | 1-2 jam | 🟡 kalau ada waktu |

---

## 🐍 Apa yang BE friend harus lakukan?

### ❌ Yang JANGAN dikerjakan (karena blocked sama Contracts API v5)
- Orchestrator daemon yang dengerin onchain event SC kita
- Indexer Postgres yang index event SC
- Deploy script untuk 7 SC ink!
- Cross-contract event correlation
- Agent identity / signing service onchain

Semua hal di atas BUTUH SC ter-deploy, yang gak bisa kita lakukan sekarang. **Skip dulu, dokumentasikan sebagai "Phase 2 — Post-API-Upgrade"** di README BE-mu.

### ✅ Yang HARUS dikerjakan untuk submission (prioritas tertinggi)

**Off-chain LLM simulation only.** Bikin script Python yang demonstrasikan AI reasoning Auralis tanpa perlu onchain.

#### Setup project (~30 menit)
```bash
mkdir -p agents/simulation
cd agents/simulation
python -m venv .venv && source .venv/bin/activate
pip install anthropic langchain langchain-anthropic python-dotenv pydantic
```

#### Yang dibuat:

1. **`requester_agent.py`** (~3-4 jam)
   - Input: hardcoded sample withdrawal request
   - Process: prompt Claude → JSON verdict (confidence_bps, verdict, reasoning, flags)
   - Output: print + save reasoning ke file `outputs/`

2. **`reviewer_agent.py`** (~3-4 jam)
   - Input: request + requester verdict + persona (Conservative/TrustDefault/StrictEmergency)
   - Process: prompt Claude dengan persona-specific style → approve/reject + reasoning
   - Output: vote + reasoning

3. **`run_simulation.py`** (~1 jam)
   - End-to-end runner: 1 request → 1 requester verdict → 3 reviewer votes (per persona) → tally
   - Output: full reasoning trail di `outputs/simulation_<timestamp>.md`

4. **`agents/README.md`** (~30 menit)
   - Cara run simulation
   - Sample output
   - Catatan: "Full orchestrator/indexer in Section 13 of main README, postponed to post-API-upgrade phase 2"

### 📊 Sample output yang dihasilkan

```markdown
## Auralis AI Simulation — Withdrawal Request #1

**Request:** Dewi minta 500 POT, alasan "biaya rumah sakit"
**Member history:** 12 deposit, 11 on-time, reputation 720, badge: ConsistentPayer + TrustedMember

### Requester Agent Verdict
Confidence: 0.87 → FAST_TRACK
Reasoning: "Member memiliki 91.6% on-time deposit rate. TrustedMember badge mengindikasikan ..."

### Reviewer Agent Votes
- Alice (Conservative): APPROVE — "Despite my conservative stance, the historical evidence ..."
- Bob (TrustDefault): APPROVE — "Default trust applies given the ConsistentPayer signal ..."
- Charlie (StrictEmergency): APPROVE — "Medical emergency verified by deposit consistency ..."

### Tally
3/3 approve, weighted score 89% → Withdrawal Approved
```

---

## 📜 SC contributor (gua sendiri / Anda yang lead)

**STATUS: FROZEN ✅**

- 7 contracts udah jadi
- Build clean (~9-16K WASM masing-masing)
- Unit tests lulus
- Documented di `contracts/README.md`
- Tinggal nunggu Portaldot upgrade Contracts API

**Tidak ada lagi yang perlu dikerjakan di SC sampai upgrade datang.**

---

## ✅ TODO list untuk submission 31 Mei

### Yang sudah selesai
- [x] 7 SC ink! contracts built clean
- [x] Companion native-pallet demo (5 tx live onchain)
- [x] tx-proof.json submission evidence
- [x] README sections 1-14 (architecture + deployment strategy)
- [x] contracts/README.md (SC deep dive)
- [x] companion/README.md (companion deep dive)
- [x] FE: port companion ke lib/chain/ + UI shell

### Yang masih perlu dikerjakan

#### Prioritas HIGH (must-have untuk submission)
- [ ] **BE friend: implementasi `agents/simulation/`** — Requester + Reviewer agents (~1-2 hari kerja)
- [ ] **FE friend: verify frontend jalan E2E** — test recorded + live mode di browser (~30 menit)
- [ ] **Demo video walkthrough** (~2-3 jam recording + editing)
  - Show problem (Arisan tradisional)
  - Show architecture (7 ink! contracts dari design docs)
  - Acknowledge blocker (Contracts API v5)
  - Show live demo (frontend trigger companion → 5 tx onchain)
  - Show explorer (verify tx hash di Polkadot.js Apps)
  - Show full vision (highlight ink! contracts ready untuk masa depan)

#### Prioritas MEDIUM (nice-to-have)
- [ ] Polish frontend animations / mobile responsive
- [ ] Per-tx explorer links di UI
- [ ] BE: companion mirror dalam Python (kalau Phase 1 selesai cepat)
- [ ] FAQ section di README

#### Prioritas LOW (skip kalau gak sempet)
- [ ] Wallet extension integration di FE
- [ ] Indexer setup untuk historical data
- [ ] Multi-language support

#### Yang TUNGGU response Discord
- [ ] Jawaban admin Portaldot soal Q1+Q2 (buildable ink! tanpa deploy + substrate-contracts-node)
- [ ] Notifikasi node upgrade ke Contracts API v9+ (kalau datang sebelum 31 Mei)

---

## 🔗 Quick reference

| Resource | Link |
|----------|------|
| Repo utama | https://github.com/EzraNahumury/auralis |
| Companion live demo | `cd companion && npm install && npm start` |
| Tx hashes (submission proof) | `companion/tx-proof.json` |
| Polkadot.js Apps explorer (verify tx) | https://polkadot.js.org/apps/?rpc=wss://drip-node-production.up.railway.app |
| Portaldot official explorer | https://portalscan.portaldot.io (mainnet only — bukan dev) |
| README utama | https://github.com/EzraNahumury/auralis#readme |
| SC docs | `contracts/README.md` |
| Companion docs | `companion/README.md` |
| Discord Portaldot | https://discord.gg/portaldot |

---

## ❓ FAQ singkat

**Q: Kalau SC udah jadi kenapa gak deploy aja?**
A: Bisa BUILD, gak bisa DEPLOY ke Portaldot karena node mereka pakai Contracts API v5 (cuma support ink! 3.x, sedangkan kita pakai ink! 5.x). Bukan masalah kita.

**Q: Apakah submission ini valid tanpa deploy SC?**
A: Ya. Admin Portaldot konfirmasi native pallet path "genuinely solid for most hackathon use cases." 3 kriteria submission native pallet (signed tx, hash + block, logic mapping) kita penuhi semua.

**Q: Kalau Portaldot upgrade sebelum deadline?**
A: Tinggal 1-2 jam kerja deploy SC ke node baru. Tapi jangan bergantung — no timeline.

**Q: FE perlu wallet?**
A: Tidak untuk submission. Pakai `//Alice` (shared dev account, pre-funded). Wallet extension optional polish.

**Q: BE harus implement orchestrator?**
A: Tidak. Skip semua chain-integration BE work. Fokus off-chain LLM simulation aja. Dokumentasikan rest sebagai "Phase 2".

**Q: Saya bingung apa beda native pallet sama SC ink!?**
A: SC ink! = custom code yang kita tulis sendiri (di `contracts/`). Native pallet = built-in feature Portaldot (di binary nodenya, gak perlu deploy). Native pallets cuma punya operasi standar (transfer, multisig, dll.) — gak punya logic custom seperti SC kita. Tapi cukup untuk demo Arisan-like flow.

---

## 💬 Kontak

Kalau ada pertanyaan atau stuck:
- Komunikasi via [channel internal tim Anda]
- Tag di Discord Portaldot untuk tanya admin
- Cek pinned message di Discord (LevelMax pin update progress upgrade)

**Mari fokus dan kerja paralel sambil tunggu admin reply / Portaldot upgrade.**

— Tim Auralis 🏦
