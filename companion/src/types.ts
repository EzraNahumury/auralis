export interface TxRecord {
  step: number;
  description: string;
  signer: string;
  txHash: string;
  blockHash: string;
  blockNumber: number;
  events: { section: string; method: string }[];
}

export interface ProofBundle {
  network: {
    endpoint: string;
    chainName: string;
    ss58Prefix: number;
    tokenSymbol: string;
    tokenDecimals: number;
  };
  participants: {
    alice: string;
    bob: string;
    charlie: string;
    dave: string;
    multisig: string;
  };
  config: {
    depositPerMember: string; // human-readable, e.g. "100 POT"
    threshold: string; // e.g. "2-of-3"
  };
  transactions: TxRecord[];
  finalBalances: {
    multisig: string;
    dave: string;
  };
  generatedAt: string; // ISO-8601
}
