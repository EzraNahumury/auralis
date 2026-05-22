import "server-only";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import type { KeyringPair } from "@polkadot/keyring/types";

export type DevMember = "Alice" | "Bob" | "Charlie" | "Dave";

let ringPromise: Promise<Keyring> | null = null;

async function ring(ss58Prefix: number): Promise<Keyring> {
  if (!ringPromise) {
    ringPromise = (async () => {
      await cryptoWaitReady();
      return new Keyring({ type: "sr25519", ss58Format: ss58Prefix });
    })();
  }
  return ringPromise;
}

const cache = new Map<string, KeyringPair>();

export async function signerFor(
  member: DevMember,
  ss58Prefix: number
): Promise<KeyringPair> {
  const cacheKey = `${member}:${ss58Prefix}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const kr = await ring(ss58Prefix);
  const pair = kr.addFromUri(`//${member}`);
  cache.set(cacheKey, pair);
  return pair;
}

export async function addressOf(
  member: DevMember,
  ss58Prefix: number
): Promise<string> {
  return (await signerFor(member, ss58Prefix)).address;
}

export const DEV_MEMBERS: DevMember[] = ["Alice", "Bob", "Charlie", "Dave"];

export function isDevMember(s: string): s is DevMember {
  return (DEV_MEMBERS as string[]).includes(s);
}
