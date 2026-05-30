# 🎬 Demo Script — Auralis

Panduan lengkap untuk menjalankan dan menampilkan demo Auralis (AI-powered Arisan on Portaldot).

---

## 📋 Sebelum Demo

### Cek Prerequisites

Pastikan sudah terinstall:

```bash
node --version          # >= 20
npm --version           # >= 10
cargo --version         # rust toolchain
cargo contract --version  # >= 4.x
substrate-contracts-node --version  # >= 0.41
```

Kalau belum, install:

```bash
# Rust + cargo-contract
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --force --locked cargo-contract

# substrate-contracts-node (download binary)
# https://github.com/paritytech/substrate-contracts-node/releases

# Ollama (opsional, untuk AI agents)
brew install ollama
```

### Sekali Setup

```bash
cd auralis/frontend
npm install
```

---

## 🚀 Menjalankan Demo

### Step 1 — Start Semua Services

```bash
./scripts/start.sh
```

Script ini auto-start:
- Substrate contracts node (`ws://127.0.0.1:9944`)
- Ollama daemon (kalau terinstall, port 11434)
- Next.js frontend (`http://localhost:3000`)

Tunggu sampai muncul "✅ All services up."

### Step 2 — Deploy 7 Smart Contracts

```bash
./scripts/deploy.sh
```

Script ini deploy 7 contracts secara berurutan dan wiring otomatis:
1. `agent_registry`
2. `group_registry`
3. `badge_nft`
4. `reputation_registry`
5. `voting_engine`
6. `treasury`
7. `arisan_group`

Plus cross-contract wiring (`set_minter`, `add_whitelisted_prevalidator`, `add_whitelisted_writer`).

Setelah selesai, semua address tersimpan di `deploy.local.env`.

> **Catatan:** Setiap restart node, contracts hilang (karena `--tmp`). Re-run `deploy.sh` lagi.

### Step 3 — Buka Browser

```
http://localhost:3000
```

---

## 🎤 Script Demo (Apa Yang Diceritakan)

### Opening — 30 detik

> "Auralis adalah AI-powered Arisan (rotating savings group) di Portaldot. Ini gabungan financial inclusion + AI risk validation + on-chain multisig governance. Anggota nyetor rutin ke pot, AI agent validasi tiap withdrawal request, dan multisig mengamankan payout."

### Demo Flow — 60-90 detik

#### 1. Sign In sebagai Alice

- Klik "Sign in"
- Pilih `//Alice`

> "Alice login pakai dev key Alice. Di production ini wallet asli — Polkadot.js atau Talisman."

#### 2. Buat Group "Arisan Kelas"

- Klik "Create group"
- Nama: `Arisan Kelas`
- Members: Alice, Bob, Charlie
- Contribution: 100 POT
- Threshold: 2-of-3
- Klik "Create"

> "Group ini multisig 2-of-3. Setiap round, tiap member nyetor 100 POT ke pot bersama."

#### 3. Round 1 — Deposit dari Semua Member

**Sebagai Alice:**
- Klik "Deposit 100 POT" — tunggu confirmed
- Pot balance: 100 POT

**Switch akun ke Bob:**
- Klik avatar kanan atas → Sign out → Sign in as Bob
- Klik "Deposit 100 POT"
- Pot balance: 200 POT

**Switch akun ke Charlie:**
- Sign in as Charlie
- Klik "Deposit 100 POT"
- Pot balance: 300 POT (3/3 deposited)

> "Tiap deposit itu real on-chain `balances.transferKeepAlive` ke multisig address. Lihat block number naik — itu transaksi asli."

#### 4. Request Withdrawal — sebagai Alice

**Sign in lagi sebagai Alice**, lalu:

- Klik "Request withdrawal"
- Amount: 200 POT
- Reason: `Anak saya butuh biaya sekolah mendadak`
- Category: Emergency
- Submit

> "Alice butuh dana buat sekolah anak. Sekarang AI Requester Agent jalan."

#### 5. Phase 1 — AI Pre-Validation

Halaman langsung redirect ke detail request. Phase 1 menampilkan:
- Confidence: 90%
- Verdict: PASS / FAST-TRACK
- Reasoning bullet points

> "AI Requester Agent (LLM via Ollama) cek: deposit history, reputation score, alasan request. Verdict PASS dengan confidence 90% — fast-track ke voting."

#### 6. Phase 2 — Member Voting

**Sebagai Alice (YOU):**
- Klik "Propose on chain" — Alice jadi signer pertama (1 of 2)

> "Alice initiate multisig proposal. Ini real `multisig.approveAsMulti` on-chain (atau simulated di local node)."

**Switch ke Bob:**
- Buka request yang sama
- Klik "Approve & execute" — Bob signer kedua, threshold tercapai (2 of 2)
- Status berubah ke **Completed**

> "Bob approve, threshold 2-of-3 tercapai, multisig auto-execute. Request status: Completed."

#### 7. Phase 3 — Claim Funds (Yang Paling Penting!)

**Switch balik ke Alice:**
- Muncul section **"Phase 3 — Claim funds"**
- Klik **"Claim 200 POT"**

> "Sekarang Alice klaim dananya. Ini real on-chain transfer — 200 POT masuk ke wallet Alice."

Setelah claim:
- Balance Alice naik **+200 POT** (delta hijau)
- Pot balance group turun jadi **100 POT** (300 - 200)
- Phase 3 berubah jadi "Funds claimed" hijau dengan txHash

#### 8. Phase 4 — On-chain History

> "Semua tx tersimpan di Phase 4 — propose, approve, execute, claim. Setiap dengan block number dan tx hash asli."

---

## 🎯 Hal Penting Yang Wajib Disebut

### Real On-Chain Components
- **Deposit** → real `balances.transferKeepAlive` ke multisig address
- **Claim** → real `balances.transferKeepAlive` dari treasury → recipient
- **7 ink! smart contracts** deployed dengan real address

### Simulated Components (Jelaskan Kenapa)
- **Multisig propose/approve** → `substrate-contracts-node` tidak include `pallet-multisig`. Di Portaldot mainnet (ketika pallet-multisig tersedia) akan real.
- **AI agents** → kalau Ollama tidak terinstall, fallback ke seeded mock verdict. UI flow tetap jalan.
- **Treasury payout** → pakai `//Eve` sebagai treasury proxy. Real on-chain transfer, tapi bukan dari multisig (karena pallet-multisig absent).

### Limitasi Yang Harus Dijelaskan
- Portaldot mainnet belum ada → kita pakai `substrate-contracts-node` sebagai PoC
- Portaldot nodes pakai Contracts API v5 (ink! 4.x/5.x reject) → ini blocker dari sisi mereka

---

## 🐛 Troubleshooting Saat Demo

### Node tidak jalan
```bash
./scripts/stop.sh
./scripts/start.sh
```

### Contract belum ter-deploy
```bash
./scripts/deploy.sh
```

### Smoke test cek semua up
```bash
./scripts/test-flow.sh
```

### Frontend error / tidak update
```bash
# Buka DevTools → Application → Local Storage → clear
# Atau di console:
localStorage.clear()
```

### Multisig error "Cannot read properties of undefined"
- Itu sudah di-handle dengan fallback. Refresh halaman, retry.

### Balance tidak update
- Klik tombol ⟳ refresh di sidebar balance
- Auto-poll setiap 20 detik

---

## 📊 Demo Cheat Sheet (Print Ini)

| Step | Aksi | Hasil |
|------|------|-------|
| 1 | Sign in as Alice | Avatar Alice di topbar |
| 2 | Create group "Arisan Kelas" (Alice, Bob, Charlie, 100 POT, 2-of-3) | Group page muncul |
| 3 | Alice deposit 100 POT | Pot: 100, 1/3 |
| 4 | Switch Bob, deposit | Pot: 200, 2/3 |
| 5 | Switch Charlie, deposit | Pot: 300, 3/3 |
| 6 | Switch Alice, request withdrawal 200 POT | AI Phase 1 jalan |
| 7 | Klik "Propose on chain" sebagai Alice | 1 of 2 ✓ |
| 8 | Switch Bob, klik "Approve & execute" | 2 of 2, Completed |
| 9 | Switch Alice, klik "Claim 200 POT" | +200 POT ke Alice |

**Total demo time:** 60-90 detik

---

## 📁 Struktur Project

```
auralis/
├── contracts/           # 7 ink! smart contracts
├── frontend/            # Next.js 16 + Polkadot.js
├── companion/           # Native pallet companion (Portaldot dev proof)
├── scripts/
│   ├── start.sh         # One-command startup
│   ├── deploy.sh        # Deploy 7 contracts
│   ├── test-flow.sh     # Smoke test
│   └── stop.sh          # Cleanup
├── deploy.local.env     # Generated contract addresses
└── DEMO.md              # File ini
```

---

## 💡 Tips Demo

1. **Practice run dulu** sebelum live demo (siapkan state baru setiap kali)
2. **Bukan 1 layar**, buka 4 tab browser:
   - Tab 1: Alice
   - Tab 2: Bob
   - Tab 3: Charlie
   - Tab 4: DevTools (Console / Network)
3. **Jangan close terminal** — kalau crash, butuh logs di `.logs/`
4. **Reset state cepat:** `localStorage.clear()` di DevTools console
5. **Highlight yang real on-chain:** tunjuk block number naik, txHash unik per action
