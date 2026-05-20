"use client";

// Browser-side derivation. Same algorithm as companion/src/multisig.ts but
// pulled from @polkadot/util-crypto + @polkadot/keyring via dynamic import
// so the heavy polkadot bundle only loads when actually needed.

export interface DerivedMultisig {
  sortedSignatories: string[];
  multisigAddress: string;
}

export async function deriveMultisigAddress(
  signatories: string[],
  threshold: number,
  ss58Prefix: number
): Promise<DerivedMultisig> {
  const [{ createKeyMulti, sortAddresses }, { encodeAddress }] = await Promise.all([
    import("@polkadot/util-crypto"),
    import("@polkadot/keyring"),
  ]);
  const sortedSignatories = sortAddresses(signatories, ss58Prefix) as string[];
  const multisigPubkey = createKeyMulti(sortedSignatories, threshold);
  const multisigAddress = encodeAddress(multisigPubkey, ss58Prefix);
  return { sortedSignatories, multisigAddress };
}

export function otherSignatories(sorted: string[], approver: string): string[] {
  return sorted.filter((a) => a !== approver);
}

export function formatPot(planck: bigint, decimals = 12, symbol = "POT"): string {
  const factor = 10n ** BigInt(decimals);
  const whole = planck / factor;
  const frac = planck % factor;
  if (frac === 0n) return `${whole.toLocaleString()} ${symbol}`;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole.toLocaleString()}.${fracStr} ${symbol}`;
}

export function toPlanck(whole: number, decimals = 12): bigint {
  return BigInt(whole) * 10n ** BigInt(decimals);
}
