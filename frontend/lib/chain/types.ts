export interface ChainProps {
  endpoint: string;
  chainName: string;
  ss58Prefix: number;
  tokenSymbol: string;
  tokenDecimals: number;
}

export interface Timepoint {
  height: number;
  index: number;
}

export interface TxRecord {
  txHash: string;
  blockHash: string;
  blockNumber: number;
}
