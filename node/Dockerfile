# Auralis Substrate node — runs substrate-contracts-node on Railway.
#
# Image: prosopo/substrate-contracts-node:v0.41.18dp is a community-maintained
# rebuild of paritytech/substrate-contracts-node (no official Docker image
# is published). v0.41+ includes pallet-contracts compatible with ink! 5.x,
# which the Auralis contracts target.
#
# Runtime: --dev chain spec (single node with Alice/Bob/etc pre-funded),
# data persisted to /data so a Railway volume mount survives restarts.

FROM prosopo/substrate-contracts-node:v0.41.18dp

USER root

# Persist chain state across restarts. Railway must mount a volume here.
RUN mkdir -p /data && chown -R 1000:1000 /data

USER 1000

# Default port if Railway does not inject one (local docker run).
ENV PORT=9944
EXPOSE 9944

# Single-port RPC + WS bind. --rpc-external opens beyond 127.0.0.1, required
# by Railway's edge proxy. --rpc-cors=all unblocks the Vercel frontend.
#
# --rpc-methods=unsafe enables author_insertKey and similar dev-mode RPCs.
# Acceptable only for the hackathon dev chain — DO NOT keep this flag for a
# production deploy. See node/README.md "Security warning" for details.
#
# --no-prometheus / --no-telemetry trim noisy network egress on Railway.
CMD ["sh", "-c", "substrate-contracts-node \
  --dev \
  --name=auralis-node \
  --base-path=/data \
  --rpc-external \
  --rpc-cors=all \
  --rpc-methods=unsafe \
  --rpc-port=${PORT} \
  --no-prometheus \
  --no-telemetry"]
