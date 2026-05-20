// Quick connectivity + balance probe against Portaldot mainnet.
// Usage: tsx src/check-mainnet.ts
//
// Answers: is wss://mainnet.portaldot.io/ alive? does Alice have POT?
// does the chain still use Contracts API v5 (same blocker as dev)?

import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { sortAddresses, createKeyMulti } from '@polkadot/util-crypto';
import { encodeAddress } from '@polkadot/keyring';

const MAINNET_URL = 'wss://mainnet.portaldot.io/';

async function main() {
  console.log(`🔍 Probing ${MAINNET_URL}\n`);

  const provider = new WsProvider(MAINNET_URL);
  const api = await ApiPromise.create({ provider, noInitWarn: true });

  // ── Chain identity ────────────────────────────────────────────────
  const [chain, version, properties, header] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.version(),
    api.rpc.system.properties(),
    api.rpc.chain.getHeader(),
  ]);

  console.log('Chain identity:');
  console.log(`  Chain        : ${chain.toString()}`);
  console.log(`  Node version : ${version.toString()}`);
  console.log(`  Latest block : #${header.number.toNumber()}`);
  console.log();

  const ss58Prefix = properties.ss58Format.isSome
    ? properties.ss58Format.unwrap().toNumber()
    : 42;
  const tokenDecimals = properties.tokenDecimals.isSome
    ? properties.tokenDecimals.unwrap()[0]?.toNumber() ?? 14
    : 14;
  const tokenSymbol = properties.tokenSymbol.isSome
    ? properties.tokenSymbol.unwrap()[0]?.toString() ?? 'POT'
    : 'POT';

  console.log('Chain properties:');
  console.log(`  SS58 prefix  : ${ss58Prefix}`);
  console.log(`  Token        : ${tokenSymbol}`);
  console.log(`  Decimals     : ${tokenDecimals}`);
  console.log();

  // ── Runtime version ──────────────────────────────────────────────
  const runtimeVersion: any = await api.rpc.state.getRuntimeVersion();
  console.log('Runtime version:');
  console.log(`  specName     : ${runtimeVersion.specName.toString()}`);
  console.log(`  specVersion  : ${runtimeVersion.specVersion.toNumber()}`);
  console.log(`  implVersion  : ${runtimeVersion.implVersion.toNumber()}`);
  console.log(`  apis         : ${runtimeVersion.apis.length} runtime APIs`);
  console.log();

  // Look for Contracts API specifically (matches Discord finding for v5 blocker)
  const apis = runtimeVersion.apis;
  for (const apiEntry of apis as any) {
    const [hash, ver] = apiEntry;
    const hashHex = hash.toHex();
    if (hashHex === '0x40fe3ad401f8959a') {
      console.log(`  ⚠️  Contracts API: version ${ver.toNumber()}`);
      console.log(`     ${ver.toNumber() >= 9 ? '✅ supports ink! 4.x/5.x' : '❌ only ink! 3.x (same blocker as dev)'}`);
      console.log();
    }
  }

  // ── Alice's balance ──────────────────────────────────────────────
  const keyring = new Keyring({ type: 'sr25519', ss58Format: ss58Prefix });
  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');
  const charlie = keyring.addFromUri('//Charlie');
  const dave = keyring.addFromUri('//Dave');

  // Pre-derive the same multisig we use in the main script (to check if any
  // historical txs are visible at that address on mainnet)
  const sorted = sortAddresses([alice.address, bob.address, charlie.address], ss58Prefix);
  const multisigAddr = encodeAddress(createKeyMulti(sorted, 2), ss58Prefix);

  console.log('Pre-funded dev account balances on mainnet:');
  for (const [name, account] of [
    ['Alice', alice],
    ['Bob', bob],
    ['Charlie', charlie],
    ['Dave', dave],
    ['Multisig (Alice+Bob+Charlie 2/3)', { address: multisigAddr }],
  ] as const) {
    const info: any = await api.query.system.account(account.address);
    const free = BigInt(info.data.free.toString());
    const factor = 10n ** BigInt(tokenDecimals);
    const wholePot = free / factor;
    console.log(`  ${name.padEnd(38)} ${account.address}`);
    console.log(`  ${''.padEnd(38)} ${wholePot.toString()} ${tokenSymbol} (${free.toString()} planck)`);
  }
  console.log();

  // ── Verdict ──────────────────────────────────────────────────────
  const aliceInfo: any = await api.query.system.account(alice.address);
  const aliceBalance = BigInt(aliceInfo.data.free.toString());
  const verdict = aliceBalance > 0n
    ? '✅ Alice has POT on mainnet — re-running companion against mainnet is viable.'
    : '❌ Alice has 0 POT on mainnet — cannot pay gas. Need POT acquisition path (faucet/Discord) before mainnet re-run.';

  console.log(`Verdict: ${verdict}`);

  await api.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
