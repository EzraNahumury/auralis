#!/bin/sh
set -e

# Railway mounts /data as root-owned and ignores any Dockerfile chown that
# happened during build. Fix the volume permission here at startup so the
# substrate process can create its RocksDB directory.
mkdir -p /data
chmod 777 /data

# --rpc-external opens the RPC + WebSocket beyond 127.0.0.1, required by
# the Railway edge proxy. --rpc-cors=all unblocks the Vercel frontend.
#
# --rpc-methods=unsafe enables author_insertKey and similar dev-mode RPCs.
# Acceptable only for the hackathon dev chain — DO NOT keep this flag for
# a production deploy. See node/README.md "Security warning" for details.
#
# --no-prometheus / --no-telemetry trim noisy network egress on Railway.
exec substrate-contracts-node \
  --dev \
  --name=auralis-node \
  --base-path=/data \
  --rpc-external \
  --rpc-cors=all \
  --rpc-methods=unsafe \
  --rpc-port="${PORT:-9944}" \
  --no-prometheus \
  --no-telemetry
