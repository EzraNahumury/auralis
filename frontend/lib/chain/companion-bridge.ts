"use client";

import type { ProofBundle, ProofTx, StepState } from "./types";

export interface BridgeEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface BridgeHandlers {
  onStart?: (data: { dir: string }) => void;
  onLog?: (data: { line: string; stream?: string }) => void;
  onStepStart?: (data: { step: number; description: string }) => void;
  onStepSkip?: (data: { step: number }) => void;
  onStepTx?: (data: { step: number; txHash: string }) => void;
  onStepBlock?: (data: { step: number; blockNumber: number }) => void;
  onStepTimepoint?: (data: {
    step: number;
    blockNumber: number;
    extrinsicIndex: number;
  }) => void;
  onBalance?: (data: { who: string; amount: string }) => void;
  onComplete?: (data: { exitCode: number; proof: ProofBundle }) => void;
  onError?: (data: { message: string; exitCode?: number }) => void;
}

/**
 * POST /api/companion/run and parse the SSE stream. Resolves when the
 * server closes the connection.
 */
export async function runCompanion(handlers: BridgeHandlers, signal?: AbortSignal): Promise<void> {
  const res = await fetch("/api/companion/run", {
    method: "POST",
    signal,
    cache: "no-store",
  });

  if (!res.ok || !res.body) {
    throw new Error(`Companion bridge returned ${res.status}`);
  }

  const reader = res.body
    .pipeThrough(new TextDecoderStream())
    .getReader();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;

    // SSE: events terminated by `\n\n`.
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const ev = parseSSE(raw);
      dispatch(ev, handlers);
    }
  }
}

function parseSSE(raw: string): BridgeEvent {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  const dataStr = dataLines.join("\n");
  let data: Record<string, unknown> = {};
  if (dataStr) {
    try {
      data = JSON.parse(dataStr);
    } catch {
      data = { raw: dataStr };
    }
  }
  return { type: event, data };
}

function dispatch(ev: BridgeEvent, h: BridgeHandlers) {
  switch (ev.type) {
    case "start":
      h.onStart?.(ev.data as { dir: string });
      break;
    case "log":
      h.onLog?.(ev.data as { line: string; stream?: string });
      break;
    case "step:start":
      h.onStepStart?.(ev.data as { step: number; description: string });
      break;
    case "step:skip":
      h.onStepSkip?.(ev.data as { step: number });
      break;
    case "step:tx":
      h.onStepTx?.(ev.data as { step: number; txHash: string });
      break;
    case "step:block":
      h.onStepBlock?.(ev.data as { step: number; blockNumber: number });
      break;
    case "step:timepoint":
      h.onStepTimepoint?.(
        ev.data as { step: number; blockNumber: number; extrinsicIndex: number }
      );
      break;
    case "balance":
      h.onBalance?.(ev.data as { who: string; amount: string });
      break;
    case "complete":
      h.onComplete?.(ev.data as { exitCode: number; proof: ProofBundle });
      break;
    case "error":
      h.onError?.(ev.data as { message: string; exitCode?: number });
      break;
  }
}

/** Convenience: collect emitted txs into a TxRecord list as they confirm. */
export function tapTxs(handlers: BridgeHandlers, sink: (tx: ProofTx) => void): BridgeHandlers {
  const inProgress: Partial<ProofTx>[] = Array.from({ length: 6 }).map(() => ({}));
  const wrap: BridgeHandlers = { ...handlers };

  wrap.onStepStart = (d) => {
    inProgress[d.step] = { step: d.step, description: d.description, signer: signerFor(d.step) };
    handlers.onStepStart?.(d);
  };
  wrap.onStepTx = (d) => {
    inProgress[d.step] = { ...inProgress[d.step], txHash: d.txHash };
    handlers.onStepTx?.(d);
  };
  wrap.onStepBlock = (d) => {
    const partial = inProgress[d.step] ?? {};
    const finished: ProofTx = {
      step: d.step,
      description: partial.description ?? "",
      signer: partial.signer ?? signerFor(d.step),
      txHash: partial.txHash ?? "",
      blockHash: "",
      blockNumber: d.blockNumber,
      events: [],
    };
    sink(finished);
    handlers.onStepBlock?.(d);
  };

  return wrap;
}

function signerFor(step: number): string {
  if (step === 1) return "Alice";
  if (step === 2) return "Bob";
  if (step === 3) return "Charlie";
  if (step === 4) return "Alice";
  if (step === 5) return "Bob";
  return "";
}

export type StepFromEvent = StepState;
