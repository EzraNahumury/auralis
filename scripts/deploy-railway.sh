#!/usr/bin/env bash
# Auralis — auto-deploy all 7 ink! contracts to a fresh Railway node.
#
# Usage:
#   ./scripts/deploy-railway.sh wss://auralis-production-0d6a.up.railway.app
#
# What it does:
#   1. Sanity-checks cargo-contract version (must be 4.x).
#   2. Builds every contract under contracts/ in --release.
#   3. Instantiates contracts in dependency order, captures each new
#      address from cargo-contract's "Contract <addr>" output line.
#   4. Wires the cross-contract permissions (BadgeNFT minter, VotingEngine
#      prevalidator, ReputationRegistry writer).
#   5. Writes the final address set to deploy.railway.env (does NOT touch
#      deploy.local.env so the local dev chain config stays intact).
#
# Prereqs:
#   - cargo-contract 4.1.3 (Discord admin LevelMax 2026-05-13)
#   - Rust 1.85.0 (pinned in rust-toolchain.toml)

set -eu

WS_URL="${1:-}"
if [ -z "${WS_URL}" ]; then
  echo "Usage: $0 <ws-url>"
  echo "Example: $0 wss://auralis-production-0d6a.up.railway.app"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS_DIR="$ROOT/contracts"
OUT_FILE="$ROOT/deploy.railway.env"
ALICE_PUBKEY="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
SURI="//Alice"

# ── Pre-flight ──────────────────────────────────────────────────────────
if ! command -v cargo-contract >/dev/null 2>&1; then
  echo "✗ cargo-contract not found. Install:"
  echo "  RUSTUP_TOOLCHAIN=1.85.0 cargo install --locked --force --version 4.1.3 cargo-contract"
  exit 1
fi

CC_VERSION=$(cargo contract --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
CC_MAJOR=$(echo "$CC_VERSION" | cut -d. -f1)
if [ "$CC_MAJOR" != "4" ]; then
  echo "✗ cargo-contract $CC_VERSION detected; Auralis requires 4.x (Discord LevelMax)."
  echo "  Reinstall: RUSTUP_TOOLCHAIN=1.85.0 cargo install --locked --force --version 4.1.3 cargo-contract"
  exit 1
fi
echo "→ cargo-contract $CC_VERSION  ✓"

echo "→ Endpoint: $WS_URL"
echo "→ Deployer: $SURI ($ALICE_PUBKEY)"
echo

# ── Build all 7 ────────────────────────────────────────────────────────
CONTRACTS=(agent_registry group_registry badge_nft reputation_registry voting_engine treasury arisan_group)
for d in "${CONTRACTS[@]}"; do
  echo "→ Building $d..."
  (cd "$CONTRACTS_DIR/$d" && cargo contract build --release --quiet) || {
    echo "✗ Build failed for $d"
    exit 1
  }
done
echo "✓ All 7 contracts built."
echo

# ── Helper: instantiate + capture address ──────────────────────────────
# IMPORTANT: only the final address goes to stdout. Every status line is
# redirected to stderr so that callers using $(instantiate ...) capture a
# clean single-token address.
instantiate() {
  local name="$1"; shift
  local ctor="$1"; shift
  local args_str="$*"

  echo "→ Deploying $name..." >&2
  local bundle="$CONTRACTS_DIR/$name/target/ink/$name.contract"
  # Random 16-byte salt so re-runs of this script do not collide with
  # contracts the chain already stores at the deterministic default address.
  local salt
  salt="0x$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')"
  local cmd=(cargo contract instantiate "$bundle"
    --constructor "$ctor"
    --suri "$SURI"
    --url "$WS_URL"
    --salt "$salt"
    --execute --skip-confirm)
  if [ -n "$args_str" ]; then
    # shellcheck disable=SC2206
    local arg_arr=($args_str)
    cmd+=(--args "${arg_arr[@]}")
  fi

  local out
  out=$("${cmd[@]}" 2>&1) || { echo "$out" >&2; echo "✗ Instantiate failed for $name" >&2; exit 1; }
  echo "$out" | tail -8 >&2

  local addr
  addr=$(echo "$out" | grep -oE 'Contract [1-9A-HJ-NP-Za-km-z]{47,48}' | head -1 | awk '{print $2}')
  if [ -z "$addr" ]; then
    echo "$out" >&2
    echo "✗ Could not parse contract address for $name" >&2
    exit 1
  fi
  echo "  → $name = $addr" >&2
  echo >&2
  printf '%s' "$addr"
}

# ── Helper: call a method ──────────────────────────────────────────────
call_method() {
  local contract="$1"; shift
  local method="$1"; shift
  local args_str="$*"

  echo "→ $method on $contract..."
  local cmd=(cargo contract call
    --contract "$contract"
    --message "$method"
    --suri "$SURI"
    --url "$WS_URL"
    --execute --skip-confirm)
  if [ -n "$args_str" ]; then
    # shellcheck disable=SC2206
    local arg_arr=($args_str)
    cmd+=(--args "${arg_arr[@]}")
  fi

  "${cmd[@]}" 2>&1 | tail -4 || { echo "✗ Call failed: $method"; exit 1; }
  echo
}

# ── Deploy in dependency order ─────────────────────────────────────────
AGENT_REGISTRY=$(instantiate agent_registry new "")
GROUP_REGISTRY=$(instantiate group_registry new "")
BADGE_NFT=$(instantiate badge_nft new "$ALICE_PUBKEY")
REPUTATION_REGISTRY=$(instantiate reputation_registry new "$BADGE_NFT")

call_method "$BADGE_NFT" set_minter "$REPUTATION_REGISTRY"

VOTING_ENGINE=$(instantiate voting_engine new "$REPUTATION_REGISTRY $AGENT_REGISTRY")
TREASURY=$(instantiate treasury new "$VOTING_ENGINE")

call_method "$VOTING_ENGINE" add_whitelisted_prevalidator "$ALICE_PUBKEY"
call_method "$REPUTATION_REGISTRY" add_whitelisted_writer "$VOTING_ENGINE"

# ── Write env file ─────────────────────────────────────────────────────
cat >"$OUT_FILE" <<EOF
# ==========================================
# Auralis RAILWAY DEPLOY — substrate-contracts-node on Railway
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
# Endpoint: $WS_URL
# ==========================================

PORTALDOT_WS_ENDPOINT=$WS_URL
PORTALDOT_SS58_PREFIX=42
PORTALDOT_TOKEN_DECIMALS=12

DEPLOYER_SURI=$SURI
DEPLOYER_PUBKEY=$ALICE_PUBKEY

# ==========================================
# Contract addresses
# ==========================================
CONTRACT_AGENT_REGISTRY=$AGENT_REGISTRY
CONTRACT_GROUP_REGISTRY=$GROUP_REGISTRY
CONTRACT_BADGE_NFT=$BADGE_NFT
CONTRACT_REPUTATION_REGISTRY=$REPUTATION_REGISTRY
CONTRACT_VOTING_ENGINE=$VOTING_ENGINE
CONTRACT_TREASURY=$TREASURY
EOF

echo "✓ Deploy complete."
echo "  Wrote: $OUT_FILE"
echo
echo "Next:"
echo "  1. Copy $OUT_FILE values into your Vercel project env."
echo "  2. Verify with: cargo contract call --contract \$CONTRACT_GROUP_REGISTRY --message group_count --suri //Alice --url $WS_URL --dry-run"
