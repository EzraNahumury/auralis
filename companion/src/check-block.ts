import { ApiPromise, WsProvider } from '@polkadot/api';
async function main() {
  const api = await ApiPromise.create({ provider: new WsProvider('ws://127.0.0.1:9944'), noInitWarn: true });
  for (const bn of [88045, 88076]) {
    const hash = await api.rpc.chain.getBlockHash(bn);
    const block: any = await api.rpc.chain.getBlock(hash);
    console.log(`\n=== Block #${bn} ===`);
    block.block.extrinsics.forEach((ext: any, i: number) => {
      const m = ext.method;
      console.log(`  [${i}] ${m.section}.${m.method}`);
      if (m.section === 'balances') {
        m.args.forEach((arg: any, j: number) => {
          console.log(`       arg[${j}]: ${arg.toString()}`);
        });
      }
    });
  }
  await api.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
