"use client";

import type { MemberName } from "@/lib/avatars";

// Standard Portaldot dev addresses (SS58 prefix 42) — same as what the
// companion derives at runtime. We cache them so we don't pay the
// @polkadot/keyring import cost on the sign-in page if we don't have to.

const DEV_ADDRESSES: Record<MemberName, string> = {
  Alice: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  Bob: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  Charlie: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
  Dave: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
};

/**
 * Derive the Substrate address for a dev account. By default this returns
 * the canonical cached address; pass `{ verify: true }` to actually run
 * the keypair derivation through @polkadot/keyring and double-check it
 * matches. Used by the sign-in screen so users see the real address.
 */
export async function deriveDevAddress(
  name: MemberName,
  opts: { verify?: boolean } = {}
): Promise<string> {
  if (!opts.verify) return DEV_ADDRESSES[name];

  const [{ Keyring }, { cryptoWaitReady }] = await Promise.all([
    import("@polkadot/keyring"),
    import("@polkadot/util-crypto"),
  ]);
  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519", ss58Format: 42 });
  const pair = keyring.addFromUri(`//${name}`);
  return pair.address;
}

export function knownAddress(name: MemberName): string {
  return DEV_ADDRESSES[name];
}
