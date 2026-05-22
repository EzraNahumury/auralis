// Server-side Portaldot connection. Connects once per process and caches
// the ApiPromise so subsequent route invocations share the same WS.

import "server-only";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { ChainProps } from "@/lib/chain/types";

const DEFAULT_ENDPOINT =
  process.env.PORTALDOT_WS ?? "wss://drip-node-production.up.railway.app";

interface Connection {
  api: ApiPromise;
  props: ChainProps;
}

let pending: Promise<Connection> | null = null;

async function open(): Promise<Connection> {
  const endpoint = DEFAULT_ENDPOINT;
  const provider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider, noInitWarn: true });

  const [chain, sysProps] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.properties(),
  ]);

  const ss58Prefix = sysProps.ss58Format.isSome
    ? sysProps.ss58Format.unwrap().toNumber()
    : 42;
  const tokenDecimals = sysProps.tokenDecimals.isSome
    ? sysProps.tokenDecimals.unwrap()[0]?.toNumber() ?? 12
    : 12;
  const tokenSymbol = sysProps.tokenSymbol.isSome
    ? sysProps.tokenSymbol.unwrap()[0]?.toString() ?? "POT"
    : "POT";

  return {
    api,
    props: {
      endpoint,
      chainName: chain.toString(),
      ss58Prefix,
      tokenSymbol,
      tokenDecimals,
    },
  };
}

export async function getApi(): Promise<Connection> {
  if (!pending) {
    pending = open().catch((err) => {
      pending = null;
      throw err;
    });
  }
  const conn = await pending;
  if (!conn.api.isConnected) {
    pending = null;
    return getApi();
  }
  return conn;
}
