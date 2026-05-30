"use client";

import type { MemberName } from "@/lib/avatars";

export type TxKind =
  | "deposit"
  | "withdraw_propose"
  | "withdraw_approve"
  | "withdraw_execute"
  | "withdraw_claim";

export interface TxLogEntry {
  id: string;
  groupId: string;
  requestId?: string;
  kind: TxKind;
  signer: MemberName;
  amountPot?: number;
  txHash: string;
  blockHash: string;
  blockNumber: number;
  createdAt: number;
}

const STORAGE_KEY = "auralis:txs:v1";
const EVENT_KEY = "auralis:txs:changed";

function readAll(): TxLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TxLogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: TxLogEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch {
    // ignore
  }
}

export function listTxs(groupId: string): TxLogEntry[] {
  return readAll()
    .filter((t) => t.groupId === groupId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function listRequestTxs(requestId: string): TxLogEntry[] {
  return readAll()
    .filter((t) => t.requestId === requestId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function appendTx(entry: TxLogEntry) {
  const next = readAll().filter((x) => x.id !== entry.id);
  next.push(entry);
  writeAll(next);
}

export function newTxId(): string {
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function onTxsChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const a = () => cb();
  const b = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener(EVENT_KEY, a);
  window.addEventListener("storage", b);
  return () => {
    window.removeEventListener(EVENT_KEY, a);
    window.removeEventListener("storage", b);
  };
}
