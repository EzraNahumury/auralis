"use client";

import type { MemberName } from "@/lib/avatars";

export type DepositStatus = "pending" | "submitting" | "confirmed" | "failed";

export interface Deposit {
  id: string;
  groupId: string;
  member: MemberName;
  amountPot: number;
  status: DepositStatus;
  txHash?: string;
  blockNumber?: number;
  blockHash?: string;
  error?: string;
  createdAt: number;
  confirmedAt?: number;
}

const STORAGE_KEY = "auralis:deposits:v1";
const EVENT_KEY = "auralis:deposits:changed";

function readAll(): Deposit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Deposit[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Deposit[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch {
    // ignore
  }
}

export function listDeposits(groupId: string): Deposit[] {
  return readAll()
    .filter((d) => d.groupId === groupId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getMemberDeposit(
  groupId: string,
  member: MemberName,
  round: number
): Deposit | undefined {
  return listDeposits(groupId).find(
    (d) =>
      d.member === member && d.id === depositIdFor(groupId, member, round)
  );
}

export function depositIdFor(
  groupId: string,
  member: MemberName,
  round: number
): string {
  return `${groupId}:r${round}:${member}`;
}

export function saveDeposit(d: Deposit) {
  const next = readAll().filter((x) => x.id !== d.id);
  next.push(d);
  writeAll(next);
}

export function updateDeposit(id: string, patch: Partial<Deposit>) {
  const next = readAll().map((d) =>
    d.id === id ? { ...d, ...patch } : d
  );
  writeAll(next);
}

export function onDepositsChanged(cb: () => void): () => void {
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
