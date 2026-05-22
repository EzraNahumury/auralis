"use client";

import type { MemberName } from "@/lib/avatars";

export interface ChainTxResult {
  ok: true;
  txHash: string;
  blockHash: string;
  blockNumber: number;
}

export interface ChainError {
  error: string;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T | ChainError;
  if (!res.ok || (json as ChainError).error) {
    throw new Error((json as ChainError).error || `HTTP ${res.status}`);
  }
  return json as T;
}

export async function fetchBalance(address: string): Promise<{
  free: string;
  reserved: string;
  freePot: number;
}> {
  const res = await fetch(`/api/chain/balance?address=${encodeURIComponent(address)}`, {
    cache: "no-store",
  });
  const json = (await res.json()) as { free: string; reserved: string; freePot: number } | ChainError;
  if (!res.ok || "error" in json) {
    throw new Error("error" in json ? json.error : `HTTP ${res.status}`);
  }
  return json;
}

export interface DepositInput {
  groupId: string;
  member: MemberName;
  multisigAddress: string;
  amountPot: number;
}

export async function submitDeposit(
  input: DepositInput
): Promise<ChainTxResult & { groupId: string; member: MemberName; amountPot: number }> {
  return postJSON("/api/chain/deposit", input);
}

export interface ProposeInput {
  groupId: string;
  requestId: string;
  signerMember: MemberName;
  members: MemberName[];
  threshold: number;
  recipientMember: MemberName;
  amountPot: number;
}

export interface ProposeResult extends ChainTxResult {
  multisigAddress: string;
  callHash: string;
  timepointHeight: number;
  timepointIndex: number;
  skipped?: boolean;
}

export async function submitPropose(input: ProposeInput): Promise<ProposeResult> {
  // The skipped-idempotent case returns ok without txHash/block info — fill defaults.
  const res = await fetch("/api/chain/withdraw/propose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
  return {
    ok: true,
    skipped: !!json.skipped,
    txHash: json.txHash ?? "",
    blockHash: json.blockHash ?? "",
    blockNumber: json.blockNumber ?? 0,
    multisigAddress: json.multisigAddress,
    callHash: json.callHash,
    timepointHeight: json.timepointHeight,
    timepointIndex: json.timepointIndex,
  };
}

export interface ApproveInput {
  groupId: string;
  requestId: string;
  signerMember: MemberName;
  members: MemberName[];
  threshold: number;
  callHash: string;
  timepointHeight: number;
  timepointIndex: number;
}

export async function submitApprove(input: ApproveInput): Promise<ChainTxResult> {
  return postJSON("/api/chain/withdraw/approve", input);
}

export interface ExecuteInput {
  groupId: string;
  requestId: string;
  signerMember: MemberName;
  members: MemberName[];
  threshold: number;
  recipientMember: MemberName;
  amountPot: number;
  timepointHeight: number;
  timepointIndex: number;
}

export async function submitExecute(input: ExecuteInput): Promise<ChainTxResult> {
  return postJSON("/api/chain/withdraw/execute", input);
}
