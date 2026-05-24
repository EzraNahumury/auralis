#!/usr/bin/env bash
# Auralis — stop all background services started by start.sh.
#
# Usage:  ./scripts/stop.sh
#
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDDIR="$ROOT/.logs/pids"

stop_pid() {
  local name="$1"; shift
  local pidfile="$1"; shift

  if [ ! -f "$pidfile" ]; then
    echo "→ $name: no pid file (probably not running)"
    return 0
  fi

  local pid
  pid=$(cat "$pidfile" 2>/dev/null || true)
  if [ -z "$pid" ]; then
    rm -f "$pidfile"
    return 0
  fi

  if ! kill -0 "$pid" 2>/dev/null; then
    echo "→ $name: process $pid already gone"
    rm -f "$pidfile"
    return 0
  fi

  echo "→ Stopping $name (pid $pid)..."
  kill "$pid" 2>/dev/null || true
  # Give it a moment to shut down cleanly, then SIGKILL if stuck.
  for _ in 1 2 3 4 5; do
    if ! kill -0 "$pid" 2>/dev/null; then break; fi
    sleep 0.3
  done
  if kill -0 "$pid" 2>/dev/null; then
    echo "  → still alive, sending SIGKILL"
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$pidfile"
}

stop_pid "Next.js frontend"        "$PIDDIR/frontend.pid"
stop_pid "Ollama daemon"           "$PIDDIR/ollama.pid"
stop_pid "substrate-contracts-node" "$PIDDIR/substrate-node.pid"

# Also kill any orphan next-dev processes (Next.js sometimes forks).
pkill -f "next dev" 2>/dev/null || true

echo "✅ All Auralis services stopped."
