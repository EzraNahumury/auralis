import { ApiPromise, WsProvider } from '@polkadot/api';
async function main() {
  const api = await ApiPromise.create({ provider: new WsProvider('ws://127.0.0.1:9944'), noInitWarn: true });
  const header = await api.rpc.chain.getHeader();
  console.log(`Current best block: #${header.number.toNumber()}`);
  console.log(`Hash: ${header.hash.toHex()}`);
  await api.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
