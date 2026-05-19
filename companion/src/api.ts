// Chain connection helpers — connect to Portaldot, read chain props,
// expose typed ApiPromise for use by the flow script.

import { ApiPromise, WsProvider } from '@polkadot/api';
import 'dotenv/config';

export interface ChainProps {
  endpoint: string;
  chainName: string;
  ss58Prefix: number;
  tokenSymbol: string;
  tokenDecimals: number;
}

export async function connect(): Promise<{ api: ApiPromise; props: ChainProps }> {
  const endpoint = process.env.PORTALDOT_WS ?? 'wss://drip-node-production.up.railway.app';
  const provider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider, noInitWarn: true });

  const [chain, sysProps] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.properties(),
  ]);

  // ss58Format / tokenDecimals / tokenSymbol come from chain properties as
  // optional Vec<u32>/Vec<String> wrappers — pull the first entry.
  const ss58Prefix = sysProps.ss58Format.isSome
    ? sysProps.ss58Format.unwrap().toNumber()
    : Number(process.env.PORTALDOT_SS58 ?? 42);

  const tokenDecimals = sysProps.tokenDecimals.isSome
    ? sysProps.tokenDecimals.unwrap()[0]?.toNumber() ?? 12
    : Number(process.env.PORTALDOT_TOKEN_DECIMALS ?? 12);

  const tokenSymbol = sysProps.tokenSymbol.isSome
    ? sysProps.tokenSymbol.unwrap()[0]?.toString() ?? 'POT'
    : process.env.PORTALDOT_TOKEN_SYMBOL ?? 'POT';

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

export function formatAmount(planck: bigint, decimals: number, symbol: string): string {
  const factor = 10n ** BigInt(decimals);
  const whole = planck / factor;
  const frac = planck % factor;
  if (frac === 0n) return `${whole.toString()} ${symbol}`;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toString()}.${fracStr} ${symbol}`;
}

export function toPlanck(whole: number, decimals: number): bigint {
  return BigInt(whole) * 10n ** BigInt(decimals);
}
