"use client";

// Lazy-loaded Portaldot client. Mirrors companion/src/api.ts + flow.
// We only initialize the WS provider on demand so the landing page doesn't
// pay the ~1.5MB @polkadot bundle cost.

import type { ProofTx, ChainProps, BalanceSnapshot } from "./types";

let cachedApi: unknown | null = null;
let cachedProps: ChainProps | null = null;

export const DEFAULT_ENDPOINT = "wss://drip-node-production.up.railway.app";

export async function connectPortaldot(endpoint = DEFAULT_ENDPOINT): Promise<{
  api: unknown;
  props: ChainProps;
}> {
  if (cachedApi && cachedProps && cachedProps.endpoint === endpoint) {
    return { api: cachedApi, props: cachedProps };
  }
  const { ApiPromise, WsProvider } = await import("@polkadot/api");
  const provider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider, noInitWarn: true });

  const [chain, sysProps] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.properties(),
  ]);

  const ss58 = sysProps.ss58Format.isSome
    ? sysProps.ss58Format.unwrap().toNumber()
    : 42;
  const tokenDecimals = sysProps.tokenDecimals.isSome
    ? sysProps.tokenDecimals.unwrap()[0]?.toNumber() ?? 12
    : 12;
  const tokenSymbol = sysProps.tokenSymbol.isSome
    ? sysProps.tokenSymbol.unwrap()[0]?.toString() ?? "POT"
    : "POT";

  const props: ChainProps = {
    endpoint,
    chainName: chain.toString(),
    ss58Prefix: ss58,
    tokenSymbol,
    tokenDecimals,
  };

  cachedApi = api;
  cachedProps = props;
  return { api, props };
}

export async function devKeyring(ss58Prefix: number) {
  const { Keyring } = await import("@polkadot/api");
  const keyring = new Keyring({ type: "sr25519", ss58Format: ss58Prefix });
  return {
    alice: keyring.addFromUri("//Alice"),
    bob: keyring.addFromUri("//Bob"),
    charlie: keyring.addFromUri("//Charlie"),
    dave: keyring.addFromUri("//Dave"),
  };
}

export async function readBalances(
  api: any,
  addresses: { alice: string; bob: string; charlie: string; dave: string; multisig: string }
): Promise<BalanceSnapshot> {
  const [a, b, c, d, m] = await Promise.all([
    api.query.system.account(addresses.alice),
    api.query.system.account(addresses.bob),
    api.query.system.account(addresses.charlie),
    api.query.system.account(addresses.dave),
    api.query.system.account(addresses.multisig),
  ]);
  return {
    alice: BigInt(a.data.free.toString()),
    bob: BigInt(b.data.free.toString()),
    charlie: BigInt(c.data.free.toString()),
    dave: BigInt(d.data.free.toString()),
    multisig: BigInt(m.data.free.toString()),
  };
}

/** Sign-and-wait helper. Resolves once the tx is in a block, with the canonical TxRecord. */
export function signAndWait(
  api: any,
  tx: any,
  signer: any,
  step: number,
  signerName: string,
  description: string
): Promise<ProofTx> {
  return new Promise((resolve, reject) => {
    let unsub: (() => void) | null = null;
    tx.signAndSend(signer, async ({ status, txHash, events, dispatchError }: any) => {
      if (dispatchError) {
        unsub?.();
        const msg = dispatchError.isModule
          ? (() => {
              const decoded = dispatchError.registry.findMetaError(dispatchError.asModule);
              return `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
            })()
          : dispatchError.toString();
        return reject(new Error(`Step ${step}: ${msg}`));
      }
      if (status.isInBlock) {
        const blockHash = status.asInBlock.toHex();
        const eventSummary = (events ?? []).map((e: any) => ({
          section: e.event?.section ?? "?",
          method: e.event?.method ?? "?",
        }));
        let blockNumber = 0;
        try {
          const header = await api.rpc.chain.getHeader(blockHash);
          blockNumber = header.number.toNumber();
        } catch {
          // header lookup failed (pruned node) — keep 0
        }
        unsub?.();
        resolve({
          step,
          description,
          signer: signerName,
          txHash: txHash.toHex(),
          blockHash,
          blockNumber,
          events: eventSummary,
        });
      }
    })
      .then((u: any) => {
        unsub = u as () => void;
      })
      .catch(reject);
  });
}

/**
 * Run the full 5-step companion flow live. Emits progress via the callback.
 * Returns the array of confirmed TxRecords (matches proof-bundle shape).
 */
export async function runArisanFlow(opts: {
  endpoint?: string;
  depositPot?: number;
  threshold?: number;
  onProgress?: (step: number, partial: Partial<ProofTx> & { phase: "started" | "inflight" | "confirmed" | "failed"; error?: string }) => void;
}): Promise<{ txs: ProofTx[]; finalBalances: BalanceSnapshot; props: ChainProps; participants: { alice: string; bob: string; charlie: string; dave: string; multisig: string } }> {
  const endpoint = opts.endpoint ?? DEFAULT_ENDPOINT;
  const depositPot = opts.depositPot ?? 100;
  const threshold = opts.threshold ?? 2;
  const onProgress = opts.onProgress ?? (() => {});

  const { api, props } = await connectPortaldot(endpoint);
  const keys = await devKeyring(props.ss58Prefix);
  const { deriveMultisigAddress, otherSignatories, toPlanck } = await import("./multisig");
  const { sortedSignatories, multisigAddress } = await deriveMultisigAddress(
    [keys.alice.address, keys.bob.address, keys.charlie.address],
    threshold,
    props.ss58Prefix
  );

  const depositPlanck = toPlanck(depositPot, props.tokenDecimals);
  const totalPotPlanck = depositPlanck * 3n;
  const txs: ProofTx[] = [];

  const members = [
    { name: "Alice", signer: keys.alice },
    { name: "Bob", signer: keys.bob },
    { name: "Charlie", signer: keys.charlie },
  ] as const;

  // Step 1-3: deposits
  for (let i = 0; i < 3; i++) {
    const step = i + 1;
    const m = members[i];
    onProgress(step, { phase: "started", signer: m.name });
    try {
      const tx = (api as any).tx.balances.transferKeepAlive(multisigAddress, depositPlanck);
      onProgress(step, { phase: "inflight", signer: m.name });
      const rec = await signAndWait(api, tx, m.signer, step, m.name, `${m.name} deposits to multisig`);
      txs.push(rec);
      onProgress(step, { phase: "confirmed", ...rec });
    } catch (err: any) {
      onProgress(step, { phase: "failed", error: err?.message ?? String(err) });
      throw err;
    }
  }

  // Step 4: Alice proposes
  const innerCall = (api as any).tx.balances.transferKeepAlive(keys.dave.address, totalPotPlanck);
  const callData = innerCall.method.toHex();
  const callHash = innerCall.method.hash.toHex();
  const maxWeight = 5_000_000_000n;

  const aliceOthers = otherSignatories(sortedSignatories, keys.alice.address);
  const existing: any = await (api as any).query.multisig.multisigs(multisigAddress, callHash);
  let timepoint: { height: number; index: number };

  if (existing.isSome) {
    const m = existing.unwrap();
    timepoint = {
      height: m.when.height.toNumber(),
      index: m.when.index.toNumber(),
    };
    onProgress(4, {
      phase: "confirmed",
      signer: "Alice",
      step: 4,
      description: "Alice proposes withdrawal via multisig (existing timepoint reused)",
      txHash: callHash,
      blockHash: `(timepoint at block #${timepoint.height})`,
      blockNumber: timepoint.height,
      events: [],
    });
    txs.push({
      step: 4,
      description: "Alice proposes withdrawal via multisig (existing timepoint reused)",
      signer: "Alice",
      txHash: callHash,
      blockHash: `(timepoint at block #${timepoint.height})`,
      blockNumber: timepoint.height,
      events: [],
    });
  } else {
    onProgress(4, { phase: "started", signer: "Alice" });
    try {
      const proposeTx = (api as any).tx.multisig.approveAsMulti(
        threshold,
        aliceOthers,
        null,
        callHash,
        maxWeight
      );
      onProgress(4, { phase: "inflight", signer: "Alice" });
      const rec = await signAndWait(api, proposeTx, keys.alice, 4, "Alice", "Alice proposes withdrawal via multisig");
      txs.push(rec);
      onProgress(4, { phase: "confirmed", ...rec });

      const fresh: any = await (api as any).query.multisig.multisigs(multisigAddress, callHash);
      if (!fresh.isSome) {
        throw new Error("Multisig record not found immediately after proposing");
      }
      const m = fresh.unwrap();
      timepoint = {
        height: m.when.height.toNumber(),
        index: m.when.index.toNumber(),
      };
    } catch (err: any) {
      onProgress(4, { phase: "failed", error: err?.message ?? String(err) });
      throw err;
    }
  }

  // Step 5: Bob approves + executes
  onProgress(5, { phase: "started", signer: "Bob" });
  try {
    const bobOthers = otherSignatories(sortedSignatories, keys.bob.address);
    const executeTx = (api as any).tx.multisig.asMulti(
      threshold,
      bobOthers,
      timepoint,
      callData,
      false,
      maxWeight
    );
    onProgress(5, { phase: "inflight", signer: "Bob" });
    const rec = await signAndWait(api, executeTx, keys.bob, 5, "Bob", "Bob approves, multisig auto-executes payout");
    txs.push(rec);
    onProgress(5, { phase: "confirmed", ...rec });
  } catch (err: any) {
    onProgress(5, { phase: "failed", error: err?.message ?? String(err) });
    throw err;
  }

  const finalBalances = await readBalances(api, {
    alice: keys.alice.address,
    bob: keys.bob.address,
    charlie: keys.charlie.address,
    dave: keys.dave.address,
    multisig: multisigAddress,
  });

  return {
    txs,
    finalBalances,
    props,
    participants: {
      alice: keys.alice.address,
      bob: keys.bob.address,
      charlie: keys.charlie.address,
      dave: keys.dave.address,
      multisig: multisigAddress,
    },
  };
}
