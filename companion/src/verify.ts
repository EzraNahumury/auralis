// Verify a previously-generated tx-proof.json by re-querying the chain.
// Usage: tsx src/verify.ts
//
// This is useful for judges or reviewers: given the JSON proof bundle,
// re-connect to the same endpoint and confirm every transaction is in
// the chain history.

import { readFileSync } from 'node:fs';
import { connect } from './api.js';
import type { ProofBundle } from './types.js';

async function main() {
  const proofPath = process.env.TX_PROOF_OUTPUT ?? './tx-proof.json';
  const bundle: ProofBundle = JSON.parse(readFileSync(proofPath, 'utf-8'));

  console.log('🔎 Verifying proof bundle');
  console.log(`  Source: ${proofPath}`);
  console.log(`  Generated: ${bundle.generatedAt}`);
  console.log(`  Network: ${bundle.network.chainName} (${bundle.network.endpoint})`);
  console.log();

  const { api } = await connect();
  let pass = 0;
  let fail = 0;

  for (const tx of bundle.transactions) {
    const block: any = await api.rpc.chain.getBlock(tx.blockHash);
    const found = block.block.extrinsics.some((ext: any) => ext.hash.toHex() === tx.txHash);
    if (found) {
      console.log(`  ✓ Step ${tx.step}: ${tx.description}`);
      console.log(`      tx ${tx.txHash} confirmed in block ${tx.blockHash}`);
      pass++;
    } else {
      console.log(`  ✗ Step ${tx.step}: tx ${tx.txHash} NOT found in block ${tx.blockHash}`);
      fail++;
    }
  }

  console.log();
  console.log(`Result: ${pass} confirmed, ${fail} missing`);

  await api.disconnect();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
