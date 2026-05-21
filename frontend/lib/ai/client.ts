"use client";

// Browser-side helpers that hit our own /api/ai/* routes.

import type {
  RequesterInput,
  RequesterOutput,
  ReviewerInput,
  ReviewerOutput,
} from "./schemas";
import type { MemberName } from "@/lib/avatars";

export async function requestAIPrevalidation(
  input: RequesterInput
): Promise<RequesterOutput> {
  const res = await fetch("/api/ai/requester", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Requester Agent failed (${res.status}): ${text}`);
  }
  return (await res.json()) as RequesterOutput;
}

export interface ReviewerBatchResult {
  member: MemberName;
  ok: boolean;
  vote?: ReviewerOutput;
  error?: string;
}

export async function requestAIVotes(
  batch: ReviewerInput[]
): Promise<ReviewerBatchResult[]> {
  const res = await fetch("/api/ai/reviewer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batch }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Reviewer Agents failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { results: ReviewerBatchResult[] };
  return json.results;
}
