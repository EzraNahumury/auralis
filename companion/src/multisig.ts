// Multisig helpers for Portaldot. The native pallet-multisig is the closest
// analogue to Auralis' VotingEngine + Treasury combo: a threshold-signed
// account where a quorum of signatories must approve before funds move.

import { ApiPromise } from '@polkadot/api';
import { createKeyMulti, sortAddresses } from '@polkadot/util-crypto';
import { encodeAddress } from '@polkadot/keyring';

/**
 * Derive the deterministic multisig account address from the list of
 * signatories and the threshold. This is a pure function — no chain call.
 */
export function deriveMultisigAddress(
  signatories: string[],
  threshold: number,
  ss58Prefix: number,
): { sortedSignatories: string[]; multisigAddress: string } {
  const sortedSignatories = sortAddresses(signatories, ss58Prefix);
  const multisigPubkey = createKeyMulti(sortedSignatories, threshold);
  const multisigAddress = encodeAddress(multisigPubkey, ss58Prefix);
  return { sortedSignatories, multisigAddress };
}

/**
 * Return the list of OTHER signatories (sorted) for a given approver,
 * which is the format pallet-multisig expects.
 */
export function otherSignatories(sortedSignatories: string[], approver: string): string[] {
  return sortedSignatories.filter((addr) => addr !== approver);
}

/**
 * Decode the timepoint from a Multisig.NewMultisig or Multisig.MultisigApproval event.
 * Used to chain subsequent approvals to the same proposal.
 */
export interface Timepoint {
  height: number;
  index: number;
}

export function extractTimepoint(events: any[], expectedSection: string = 'multisig'): Timepoint | null {
  for (const record of events) {
    const { event } = record;
    if (
      event.section === expectedSection &&
      (event.method === 'NewMultisig' || event.method === 'MultisigApproval' || event.method === 'MultisigExecuted')
    ) {
      // Event data shape varies by chain — try common indices.
      // NewMultisig: [approving, multisig, call_hash]
      // We need the timepoint from when the call was first proposed.
      // For NewMultisig, the timepoint IS this current block.
      // The caller derives it from the block info instead.
      return null; // caller resolves via block info
    }
  }
  return null;
}

/**
 * Compute call hash for use in approveAsMulti / asMulti.
 * @polkadot/api exposes this via the SubmittableExtrinsic's `method.hash`.
 */
export function callHash(api: ApiPromise, call: any): string {
  return call.method.hash.toHex();
}
