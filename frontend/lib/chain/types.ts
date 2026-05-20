// Mirrors the companion's tx-proof.json schema so the UI is grounded in
// the same data the live script produces.

export interface ProofTxEvent {
  section: string;
  method: string;
}

export interface ProofTx {
  step: number;
  description: string;
  signer: string;
  txHash: string;
  blockHash: string;
  blockNumber: number;
  events: ProofTxEvent[];
}

export interface ChainProps {
  endpoint: string;
  chainName: string;
  ss58Prefix: number;
  tokenSymbol: string;
  tokenDecimals: number;
}

export interface ProofParticipants {
  alice: string;
  bob: string;
  charlie: string;
  dave: string;
  multisig: string;
}

export interface ProofBundle {
  network: ChainProps;
  participants: ProofParticipants;
  config: {
    depositPerMember: string;
    threshold: string;
  };
  transactions: ProofTx[];
  finalBalances: {
    multisig: string;
    dave: string;
  };
  generatedAt: string;
}

// Step indices map 1:1 to the companion flow.
export type StepStatus = "pending" | "inflight" | "confirmed" | "failed";

export interface StepState {
  step: 1 | 2 | 3 | 4 | 5;
  label: string;
  signer: "Alice" | "Bob" | "Charlie";
  description: string;
  status: StepStatus;
  txHash?: string;
  blockHash?: string;
  blockNumber?: number;
  events?: ProofTxEvent[];
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface BalanceSnapshot {
  alice: bigint;
  bob: bigint;
  charlie: bigint;
  dave: bigint;
  multisig: bigint;
}
