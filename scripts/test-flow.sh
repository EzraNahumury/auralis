#!/usr/bin/env bash
# Auralis — smoke test the running stack.
#
# Verifies:
#   1. Substrate node is reachable + producing blocks
#   2. Ollama is reachable + has a model loaded (if installed)
#   3. Next.js dev server is serving
#   4. The /api/chain/balance endpoint round-trips
#
# Usage:  ./scripts/test-flow.sh
#
set -eu

OK="✅"
FAIL="❌"
WARN="⚠️ "

failures=0
warnings=0

# ── 1. Substrate node ───────────────────────────────────────────────────
echo "→ Test 1: substrate-contracts-node"

block_now() {
  curl -s -H "Content-Type: application/json" \
    -d '{"id":1,"jsonrpc":"2.0","method":"chain_getHeader"}' \
    http://localhost:9944 2>/dev/null \
    | python3 -c "import sys,json; r=json.load(sys.stdin); print(int(r['result']['number'], 16))" 2>/dev/null \
    || echo "ERR"
}

b1=$(block_now)
if [ "$b1" = "ERR" ]; then
  echo "  ${FAIL} Could not reach node at ws://127.0.0.1:9944"
  failures=$((failures + 1))
else
  echo "  ${OK} Node reachable. Current block: #$b1"
  echo "  → Waiting 3s to confirm block production..."
  sleep 3
  b2=$(block_now)
  if [ "$b2" = "ERR" ]; then
    echo "  ${FAIL} Node dropped during test"
    failures=$((failures + 1))
  elif [ "$b2" -gt "$b1" ]; then
    echo "  ${OK} Block production live (advanced from #$b1 to #$b2)"
  else
    echo "  ${OK} Node at block #$b1 — instant-seal mode (blocks advance on transactions only)"
  fi
fi

# ── 2. Ollama ───────────────────────────────────────────────────────────
echo
echo "→ Test 2: Ollama"
if curl -s --max-time 3 http://localhost:11434/api/tags >/dev/null 2>&1; then
  models=$(curl -s http://localhost:11434/api/tags 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(','.join(m['name'] for m in d.get('models',[])))" 2>/dev/null \
    || echo "")
  if [ -n "$models" ]; then
    echo "  ${OK} Ollama reachable. Models loaded: $models"
  else
    echo "  ${WARN} Ollama reachable but no models pulled."
    echo "        Run: ollama pull llama3.2"
    warnings=$((warnings + 1))
  fi
else
  echo "  ${WARN} Ollama not reachable. AI agents will fall back to mock data."
  echo "        Start: ollama serve  (in another terminal)"
  warnings=$((warnings + 1))
fi

# ── 3. Next.js frontend ─────────────────────────────────────────────────
echo
echo "→ Test 3: Next.js frontend"
if status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null); then
  if [ "$status" = "200" ]; then
    echo "  ${OK} Frontend serving on http://localhost:3000"
  else
    echo "  ${WARN} Frontend returned HTTP $status (may be redirecting or compiling)"
    warnings=$((warnings + 1))
  fi
else
  echo "  ${FAIL} Frontend not reachable on http://localhost:3000"
  failures=$((failures + 1))
fi

# ── 4. Chain balance round-trip via frontend API ───────────────────────
echo
echo "→ Test 4: /api/chain/balance round-trip"
# Alice's well-known dev address
alice="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
if balance_json=$(curl -s --max-time 5 "http://localhost:3000/api/chain/balance?address=$alice" 2>/dev/null); then
  free=$(echo "$balance_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('freePot', 'ERR'))" 2>/dev/null || echo "ERR")
  if [ "$free" = "ERR" ] || [ -z "$free" ]; then
    echo "  ${WARN} API returned non-JSON response. Frontend may still be compiling."
    echo "        Response: $balance_json"
    warnings=$((warnings + 1))
  else
    echo "  ${OK} Alice balance via API: $free POT"
  fi
else
  echo "  ${WARN} Could not call /api/chain/balance"
  warnings=$((warnings + 1))
fi

# ── Summary ─────────────────────────────────────────────────────────────
echo
echo "────────────────────────"
if [ "$failures" -gt 0 ]; then
  echo "${FAIL} $failures critical issue(s). The demo will not work until these are fixed."
  exit 1
elif [ "$warnings" -gt 0 ]; then
  echo "${WARN} $warnings warning(s). Demo will work in degraded mode (mock AI / missing model)."
  exit 0
else
  echo "${OK} All tests passed. Open http://localhost:3000 and try the demo."
  exit 0
fi
