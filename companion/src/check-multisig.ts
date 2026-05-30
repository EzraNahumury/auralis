import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { createKeyMulti, sortAddresses } from '@polkadot/util-crypto';
import { encodeAddress } from '@polkadot/keyring';

async function main() {
  const provider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create({ provider, noInitWarn: true });

  const props = await api.rpc.system.properties();
  const ss58 = 42;
  const decimals = props.tokenDecimals.isSome
    ? props.tokenDecimals.unwrap()[0]?.toNumber() ?? 12
    : 12;
  const symbol = props.tokenSymbol.isSome
    ? props.tokenSymbol.unwrap()[0]?.toString() ?? 'UNIT'
    : 'UNIT';

  console.log(`Chain decimals: ${decimals}, symbol: ${symbol}\n`);

  // Derive Alice + Bob 2-of-2 multisig
  const alice = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const bob = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
  const sorted = sortAddresses([alice, bob], ss58) as string[];
  const multisigPubkey = createKeyMulti(sorted, 2);
  const multisig = encodeAddress(multisigPubkey, ss58);

  console.log(`Multisig 2-of-2 (Alice+Bob): ${multisig}`);
  console.log(`Short form: ${multisig.slice(0, 6)}...${multisig.slice(-4)}\n`);

  for (const [name, addr] of [['Alice', alice], ['Bob', bob], ['Multisig 2/2', multisig]] as const) {
    const info: any = await api.query.system.account(addr);
    const free = BigInt(info.data.free.toString());
    const wholeAtToken = free / 10n ** BigInt(decimals);
    const frac = free % (10n ** BigInt(decimals));
    console.log(`${name.padEnd(15)}: ${wholeAtToken}.${frac.toString().padStart(decimals, '0').slice(0,6)} ${symbol} (raw planck: ${free})`);
  }

  await api.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
