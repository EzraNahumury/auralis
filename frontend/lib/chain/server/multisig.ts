import "server-only";
import { createKeyMulti, sortAddresses } from "@polkadot/util-crypto";
import { encodeAddress } from "@polkadot/keyring";

export interface DerivedMultisig {
  sortedSignatories: string[];
  multisigAddress: string;
}

export function deriveMultisigAddressServer(
  signatories: string[],
  threshold: number,
  ss58Prefix: number
): DerivedMultisig {
  const sortedSignatories = sortAddresses(signatories, ss58Prefix) as string[];
  const multisigPubkey = createKeyMulti(sortedSignatories, threshold);
  const multisigAddress = encodeAddress(multisigPubkey, ss58Prefix);
  return { sortedSignatories, multisigAddress };
}

export function otherSignatoriesServer(
  sortedSignatories: string[],
  approver: string
): string[] {
  return sortedSignatories.filter((a) => a !== approver);
}
