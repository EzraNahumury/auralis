#!/usr/bin/env bash
# Auralis — deploy all 7 ink! contracts to substrate-contracts-node.
# Usage: ./scripts/deploy.sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS="$ROOT/contracts"
ENV_FILE="$ROOT/deploy.local.env"
URL="ws://127.0.0.1:9944"
ALICE="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"

# Cek node jalan
echo "→ Checking node..."
BLOCK=$(curl -s -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"chain_getHeader"}' \
  http://localhost:9944 2>/dev/null \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(int(r['result']['number'],16))" 2>/dev/null || echo "ERR")
[ "$BLOCK" = "ERR" ] && { echo "✗ Node tidak jalan. Jalankan ./scripts/start.sh dulu."; exit 1; }
echo "  ✓ Node up di block #$BLOCK"
echo

# ── 1. agent_registry ────────────────────────────────────────────────────
echo "→ [1/7] Deploying agent_registry..."
cd "$CONTRACTS/agent_registry"
OUT=$(cargo contract instantiate target/ink/agent_registry.contract \
  --constructor new --suri //Alice --url "$URL" --execute --skip-confirm 2>&1)
AGENT=$(echo "$OUT" | grep "Contract " | tail -1 | awk '{print $NF}')
[ -z "$AGENT" ] && { echo "$OUT"; echo "✗ agent_registry deploy gagal"; exit 1; }
echo "  ✓ $AGENT"

# ── 2. group_registry ────────────────────────────────────────────────────
echo "→ [2/7] Deploying group_registry..."
cd "$CONTRACTS/group_registry"
OUT=$(cargo contract instantiate target/ink/group_registry.contract \
  --constructor new --suri //Alice --url "$URL" --execute --skip-confirm 2>&1)
GROUP_REG=$(echo "$OUT" | grep "Contract " | tail -1 | awk '{print $NF}')
[ -z "$GROUP_REG" ] && { echo "$OUT"; echo "✗ group_registry deploy gagal"; exit 1; }
echo "  ✓ $GROUP_REG"

# ── 3. badge_nft ─────────────────────────────────────────────────────────
echo "→ [3/7] Deploying badge_nft..."
cd "$CONTRACTS/badge_nft"
OUT=$(cargo contract instantiate target/ink/badge_nft.contract \
  --constructor new --args "$ALICE" --suri //Alice --url "$URL" --execute --skip-confirm 2>&1)
BADGE=$(echo "$OUT" | grep "Contract " | tail -1 | awk '{print $NF}')
[ -z "$BADGE" ] && { echo "$OUT"; echo "✗ badge_nft deploy gagal"; exit 1; }
echo "  ✓ $BADGE"

# ── 4. reputation_registry ───────────────────────────────────────────────
echo "→ [4/7] Deploying reputation_registry..."
cd "$CONTRACTS/reputation_registry"
OUT=$(cargo contract instantiate target/ink/reputation_registry.contract \
  --constructor new --args "$BADGE" --suri //Alice --url "$URL" --execute --skip-confirm 2>&1)
REP=$(echo "$OUT" | grep "Contract " | tail -1 | awk '{print $NF}')
[ -z "$REP" ] && { echo "$OUT"; echo "✗ reputation_registry deploy gagal"; exit 1; }
echo "  ✓ $REP"

# ── 5. voting_engine ─────────────────────────────────────────────────────
echo "→ [5/7] Deploying voting_engine..."
cd "$CONTRACTS/voting_engine"
OUT=$(cargo contract instantiate target/ink/voting_engine.contract \
  --constructor new --args "$REP" "$AGENT" --suri //Alice --url "$URL" --execute --skip-confirm 2>&1)
VE=$(echo "$OUT" | grep "Contract " | tail -1 | awk '{print $NF}')
[ -z "$VE" ] && { echo "$OUT"; echo "✗ voting_engine deploy gagal"; exit 1; }
echo "  ✓ $VE"

# ── 6. treasury ──────────────────────────────────────────────────────────
echo "→ [6/7] Deploying treasury..."
cd "$CONTRACTS/treasury"
OUT=$(cargo contract instantiate target/ink/treasury.contract \
  --constructor new --args "$VE" --suri //Alice --url "$URL" --execute --skip-confirm 2>&1)
TREASURY=$(echo "$OUT" | grep "Contract " | tail -1 | awk '{print $NF}')
[ -z "$TREASURY" ] && { echo "$OUT"; echo "✗ treasury deploy gagal"; exit 1; }
echo "  ✓ $TREASURY"

# ── 7. arisan_group ──────────────────────────────────────────────────────
echo "→ [7/7] Deploying arisan_group..."
cd "$CONTRACTS/arisan_group"
OUT=$(cargo contract instantiate target/ink/arisan_group.contract \
  --constructor new \
  --args 1 "$GROUP_REG" "$TREASURY" "$VE" "$ALICE" 100000000000000 30 10 \
  --suri //Alice --url "$URL" --execute --skip-confirm 2>&1)
ARISAN=$(echo "$OUT" | grep "Contract " | tail -1 | awk '{print $NF}')
[ -z "$ARISAN" ] && { echo "$OUT"; echo "✗ arisan_group deploy gagal"; exit 1; }
echo "  ✓ $ARISAN"

# ── Cross-contract wiring ────────────────────────────────────────────────
echo
echo "→ Cross-contract wiring..."

cd "$CONTRACTS/badge_nft"
cargo contract call --contract "$BADGE" --message set_minter \
  --args "$REP" --suri //Alice --url "$URL" --execute --skip-confirm 2>&1 | grep -E "ExtrinsicSuccess|Error" | head -1
echo "  ✓ badge_nft.set_minter(rep)"

cd "$CONTRACTS/voting_engine"
cargo contract call --contract "$VE" --message add_whitelisted_prevalidator \
  --args "$ALICE" --suri //Alice --url "$URL" --execute --skip-confirm 2>&1 | grep -E "ExtrinsicSuccess|Error" | head -1
echo "  ✓ voting_engine.add_whitelisted_prevalidator(alice)"

cd "$CONTRACTS/reputation_registry"
cargo contract call --contract "$REP" --message add_whitelisted_writer \
  --args "$VE" --suri //Alice --url "$URL" --execute --skip-confirm 2>&1 | grep -E "ExtrinsicSuccess|Error" | head -1
echo "  ✓ reputation_registry.add_whitelisted_writer(ve)"

# ── Simpan deploy.local.env ──────────────────────────────────────────────
cat > "$ENV_FILE" <<EOF
# Generated: $(date -u +"%Y-%m-%d %H:%M UTC")
PORTALDOT_WS_ENDPOINT=ws://127.0.0.1:9944
DEPLOYER_PUBKEY=$ALICE
CONTRACT_AGENT_REGISTRY=$AGENT
CONTRACT_GROUP_REGISTRY=$GROUP_REG
CONTRACT_BADGE_NFT=$BADGE
CONTRACT_REPUTATION_REGISTRY=$REP
CONTRACT_VOTING_ENGINE=$VE
CONTRACT_TREASURY=$TREASURY
CONTRACT_ARISAN_GROUP=$ARISAN
EOF

echo
echo "========================================"
echo "  ✅ Semua 7 contract berhasil di-deploy"
echo "========================================"
echo "  agent_registry       $AGENT"
echo "  group_registry       $GROUP_REG"
echo "  badge_nft            $BADGE"
echo "  reputation_registry  $REP"
echo "  voting_engine        $VE"
echo "  treasury             $TREASURY"
echo "  arisan_group         $ARISAN"
echo "========================================"
echo "  deploy.local.env updated ✓"
echo "========================================"
