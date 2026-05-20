"use client";

import type { ProofBundle, StepState } from "./types";

const STEP_LABELS: Record<number, string> = {
  1: "Alice deposits 100 POT to the group multisig",
  2: "Bob deposits 100 POT to the group multisig",
  3: "Charlie deposits 100 POT to the group multisig",
  4: "Alice proposes the 300 POT withdrawal to Dave",
  5: "Bob approves — quorum 2/3 met, multisig auto-executes",
};

export async function loadRecordedProof(): Promise<ProofBundle> {
  const res = await fetch("/tx-proof.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load tx-proof.json (${res.status})`);
  return (await res.json()) as ProofBundle;
}

export function proofToSteps(proof: ProofBundle): StepState[] {
  return ([1, 2, 3, 4, 5] as const).map((stepNum) => {
    const tx = proof.transactions.find((t) => t.step === stepNum);
    const signer = (
      stepNum <= 3 ? ["Alice", "Bob", "Charlie"][stepNum - 1] : stepNum === 4 ? "Alice" : "Bob"
    ) as "Alice" | "Bob" | "Charlie";
    return {
      step: stepNum,
      label: STEP_LABELS[stepNum],
      description: tx?.description ?? "",
      signer,
      status: tx ? "confirmed" : "pending",
      txHash: tx?.txHash,
      blockHash: tx?.blockHash,
      blockNumber: tx?.blockNumber,
      events: tx?.events,
    };
  });
}

export function emptySteps(): StepState[] {
  return ([1, 2, 3, 4, 5] as const).map((stepNum) => ({
    step: stepNum,
    label: STEP_LABELS[stepNum],
    description: "",
    signer: (stepNum <= 3
      ? ["Alice", "Bob", "Charlie"][stepNum - 1]
      : stepNum === 4
        ? "Alice"
        : "Bob") as "Alice" | "Bob" | "Charlie",
    status: "pending" as const,
  }));
}

export function shortHash(h: string | undefined, head = 8, tail = 6): string {
  if (!h) return "—";
  if (h.length <= head + tail + 1) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function shortAddress(addr: string | undefined): string {
  return shortHash(addr, 6, 4);
}
