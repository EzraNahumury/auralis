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

# Railway mounts the volume as root-owned AFTER the image is built. Any
# chown done during build is overridden once the mount is applied, so we
# fix permissions at container start via the entrypoint instead.
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Default port if Railway does not inject one (local docker run).
ENV PORT=9944
EXPOSE 9944

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
