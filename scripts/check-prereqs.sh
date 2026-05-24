#!/usr/bin/env bash
# Auralis prerequisite check.
#
# Verifies that all tools required to run the full Auralis stack are
# installed and reachable. Exits 0 if everything is OK, non-zero if any
# required tool is missing.
#
# Usage:  ./scripts/check-prereqs.sh
#
set -u

OK="✅"
FAIL="❌"
WARN="⚠️ "

failures=0

check() {
  local name="$1"; shift
  local check_cmd="$1"; shift
  local hint="${1:-}"

  if eval "$check_cmd" >/dev/null 2>&1; then
    echo "${OK}  ${name}"
  else
    echo "${FAIL}  ${name}"
    if [ -n "${hint}" ]; then
      echo "        → ${hint}"
    fi
    failures=$((failures + 1))
  fi
}

warn() {
  local name="$1"; shift
  local check_cmd="$1"; shift
  local hint="${1:-}"

  if eval "$check_cmd" >/dev/null 2>&1; then
    echo "${OK}  ${name}"
  else
    echo "${WARN}  ${name} (optional)"
    if [ -n "${hint}" ]; then
      echo "        → ${hint}"
    fi
  fi
}

echo "Auralis prerequisite check"
echo "──────────────────────────"

# ── Required ─────────────────────────────────────────────────────────────
check "Node.js (>= 20.x)" \
  "node --version | awk -F. '{ exit (substr(\$1,2)+0 >= 20) ? 0 : 1 }'" \
  "install Node 20+: https://nodejs.org/ or 'brew install node'"

check "npm" \
  "command -v npm" \
  ""

check "substrate-contracts-node" \
  "command -v substrate-contracts-node" \
  "install: cargo install contracts-node --locked"

check "curl" \
  "command -v curl" \
  ""

check "Python 3 (any version)" \
  "command -v python3" \
  "system Python is fine; only used by scripts to parse JSON"

# ── Optional (only needed for AI agents / BE simulation) ────────────────
warn "Python 3.11+ (for BE simulation)" \
  "python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)'" \
  "needed only for agents/simulation/. macOS: brew install python@3.12"

warn "Ollama daemon" \
  "command -v ollama" \
  "AI agents need Ollama. Install: brew install ollama, then 'ollama serve' + 'ollama pull llama3.2'"

# Frontend env file presence
if [ -f "$(dirname "$0")/../frontend/.env.local" ]; then
  echo "${OK}  frontend/.env.local exists"
else
  echo "${WARN}  frontend/.env.local missing — will be created by start.sh"
fi

echo "──────────────────────────"
if [ "$failures" -gt 0 ]; then
  echo "${FAIL} ${failures} required tool(s) missing. Install them first."
  exit 1
fi
echo "${OK} All required tools present."
exit 0
