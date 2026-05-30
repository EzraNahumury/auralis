import { ApiPromise, WsProvider } from '@polkadot/api';
import { createKeyMulti, sortAddresses } from '@polkadot/util-crypto';
import { encodeAddress } from '@polkadot/keyring';

async function main() {
  const provider = new WsProvider('ws://127.0.0.1:9944');
  const api = await ApiPromise.create({ provider, noInitWarn: true });

  const props = await api.rpc.system.properties();
  const decimals = props.tokenDecimals.isSome
    ? props.tokenDecimals.unwrap()[0]?.toNumber() ?? 12
    : 12;
  const symbol = props.tokenSymbol.isSome
    ? props.tokenSymbol.unwrap()[0]?.toString() ?? 'UNIT'
    : 'UNIT';
  const ss58 = 42;

  const alice = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  const bob = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
  const charlie = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y';
  const dave = '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy';

  // Derive multisig (kemungkinan 4-member dengan threshold 2)
  const candidates: Array<{label: string, addr: string}> = [];
  for (const members of [
    [alice, bob, charlie],
    [alice, bob, charlie, dave],
    [alice, bob],
  ]) {
    for (const threshold of [2, 3]) {
      if (threshold > members.length) continue;
      const sorted = sortAddresses(members, ss58) as string[];
      const pubkey = createKeyMulti(sorted, threshold);
      const ms = encodeAddress(pubkey, ss58);
      candidates.push({
        label: `${threshold}/${members.length} (${members.length} mem)`,
        addr: ms,
      });
    }
  }

  console.log('Current balances:\n');
  for (const [name, addr] of [
    ['Alice', alice],
    ['Bob', bob],
    ['Charlie', charlie],
    ['Dave', dave],
  ] as const) {
    const info: any = await api.query.system.account(addr);
    const free = BigInt(info.data.free.toString());
    const whole = free / 10n ** BigInt(decimals);
    const frac = free % (10n ** BigInt(decimals));
    console.log(`  ${name.padEnd(8)}: ${whole}.${frac.toString().padStart(decimals, '0').slice(0,6)} ${symbol}`);
  }
  console.log();
  console.log('Multisig candidates (try to find one with balance):\n');
  for (const c of candidates) {
    const info: any = await api.query.system.account(c.addr);
    const free = BigInt(info.data.free.toString());
    const whole = free / 10n ** BigInt(decimals);
    const frac = free % (10n ** BigInt(decimals));
    console.log(`  [${c.label.padEnd(14)}] ${c.addr}`);
    console.log(`                   balance: ${whole}.${frac.toString().padStart(decimals, '0').slice(0,6)} ${symbol}`);
  }

  // Check block #88230 (execution block)
  console.log('\n--- Block #88230 events (payout execution) ---');
  try {
    const hash = await api.rpc.chain.getBlockHash(88230);
    const block: any = await api.rpc.chain.getBlock(hash);
    const events: any = await api.query.system.events.at(hash);
    block.block.extrinsics.forEach((ext: any, i: number) => {
      const m = ext.method;
      console.log(`\n  Extrinsic [${i}] ${m.section}.${m.method}`);
      if (ext.isSigned) {
        console.log(`    signer: ${ext.signer.toString()}`);
      }
    });
    console.log('\n  Block events:');
    events.forEach((rec: any, i: number) => {
      const ev = rec.event;
      if (ev.section === 'balances' || ev.section === 'multisig') {
        console.log(`    [${i}] ${ev.section}.${ev.method}: ${ev.data.toHuman()}`);
      }
    });
  } catch (e: any) {
    console.log(`  (cannot fetch block 88230: ${e.message})`);
  }

  await api.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
