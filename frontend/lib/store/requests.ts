"use client";

import type { MemberName } from "@/lib/avatars";
import type { RequesterOutput, ReviewerOutput } from "@/lib/ai/schemas";

export type RequestStatus =
  | "draft"
  | "ai_pending"
  | "voting"
  | "approved"
  | "rejected"
  | "executing"
  | "completed"
  | "failed";

export interface MemberVote {
  member: MemberName;
  vote: "APPROVE" | "REJECT";
  reasoning: string;
  confidence: number;
  aiSuggested: boolean;             // true if AI cast on the user's behalf
  txHash?: string;                  // on-chain approveAsMulti tx
  blockNumber?: number;
  createdAt: number;
}

export interface WithdrawRequest {
  id: string;
  groupId: string;
  requester: MemberName;
  recipient: MemberName;            // usually same as requester
  amountPot: number;
  reason: string;
  category: "scheduled" | "emergency" | "other";
  status: RequestStatus;
  aiVerdict: RequesterOutput | null;
  aiError?: string;
  votes: MemberVote[];
  callHash?: string;
  timepointHeight?: number;
  timepointIndex?: number;
  proposalTxHash?: string;
  proposalBlockNumber?: number;
  executionTxHash?: string;
  executionBlockNumber?: number;
  claimTxHash?: string;
  claimBlockNumber?: number;
  claimedAt?: number;
  createdAt: number;
  completedAt?: number;
}

const STORAGE_KEY = "auralis:requests:v1";
const EVENT_KEY = "auralis:requests:changed";

function readAll(): WithdrawRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WithdrawRequest[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: WithdrawRequest[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch {
    // ignore
  }
}

export function newRequestId(): string {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `req_${Date.now().toString(36)}_${suffix}`;
}

export function listRequests(groupId: string): WithdrawRequest[] {
  return readAll()
    .filter((r) => r.groupId === groupId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function findRequest(id: string): WithdrawRequest | null {
  return readAll().find((r) => r.id === id) ?? null;
}

export function saveRequest(r: WithdrawRequest) {
  const next = readAll().filter((x) => x.id !== r.id);
  next.unshift(r);
  writeAll(next);
}

export function updateRequest(id: string, patch: Partial<WithdrawRequest>) {
  const next = readAll().map((r) =>
    r.id === id ? { ...r, ...patch } : r
  );
  writeAll(next);
}

export function recordVote(id: string, vote: MemberVote) {
  const next = readAll().map((r) => {
    if (r.id !== id) return r;
    const others = r.votes.filter((v) => v.member !== vote.member);
    return { ...r, votes: [...others, vote] };
  });
  writeAll(next);
}

/**
 * Convert raw AI reviewer output into a MemberVote suitable for storage.
 */
export function reviewerToVote(
  member: MemberName,
  out: ReviewerOutput
): MemberVote {
  return {
    member,
    vote: out.vote,
    reasoning: out.reasoning,
    confidence: out.confidence,
    aiSuggested: true,
    createdAt: Date.now(),
  };
}

export function onRequestsChanged(cb: () => void): () => void {
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
