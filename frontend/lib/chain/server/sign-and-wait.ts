import "server-only";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { TxRecord } from "@/lib/chain/types";

/**
 * Sign and wait until the extrinsic is included in a block, then return
 * the canonical TxRecord (hash + block hash + block number).
 *
 * If the extrinsic fails on chain (dispatchError) we reject with a
 * decoded error message.
 */
export async function signAndWait(
  api: ApiPromise,
  tx: SubmittableExtrinsic<"promise">,
  signer: KeyringPair
): Promise<TxRecord> {
  return new Promise((resolve, reject) => {
    let unsub: (() => void) | null = null;
    tx.signAndSend(signer, async ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        unsub?.();
        if (dispatchError.isModule) {
          const decoded = dispatchError.registry.findMetaError(
            dispatchError.asModule
          );
          return reject(
            new Error(
              `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`
            )
          );
        }
        return reject(new Error(dispatchError.toString()));
      }
      if (status.isInBlock) {
        const blockHash = status.asInBlock.toHex();
        let blockNumber = 0;
        try {
          const header = await api.rpc.chain.getHeader(blockHash);
          blockNumber = header.number.toNumber();
        } catch {
          /* keep 0 */
        }
        unsub?.();
        resolve({
          txHash: txHash.toHex(),
          blockHash,
          blockNumber,
        });
      }
    })
      .then((u) => {
        unsub = u as () => void;
      })
      .catch(reject);
  });
}
