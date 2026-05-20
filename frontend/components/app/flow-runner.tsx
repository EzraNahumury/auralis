"use client";

import { CheckCircle2, Loader2, Circle, XCircle, ExternalLink, ChevronRight } from "lucide-react";
import { useChain } from "@/components/providers/chain-provider";
import type { StepState } from "@/lib/chain/types";
import { shortHash } from "@/lib/chain/proof";
import { cn } from "@/lib/cn";

function StatusBadge({ status }: { status: StepState["status"] }) {
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald/30 bg-emerald/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-soft">
        <span className="size-1.5 rounded-full bg-emerald shadow-[0_0_8px_rgba(22,217,168,0.7)]" />
        Confirmed
      </span>
    );
  }
  if (status === "inflight") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet/30 bg-violet/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-soft">
        <Loader2 className="size-3 animate-spin" />
        In flight
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose/40 bg-rose/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-rose">
        <XCircle className="size-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-dim">
      <Circle className="size-2" />
      Pending
    </span>
  );
}

function StepIcon({ status }: { status: StepState["status"] }) {
  if (status === "confirmed") return <CheckCircle2 className="size-5 text-emerald" />;
  if (status === "inflight") return <Loader2 className="size-5 animate-spin text-violet-soft" />;
  if (status === "failed") return <XCircle className="size-5 text-rose" />;
  return <Circle className="size-5 text-fg-dim" />;
}

function StepRow({ step }: { step: StepState }) {
  const explorerLink = step.blockHash?.startsWith("0x")
    ? `https://drip-node-production.up.railway.app/?#/explorer/query/${step.blockHash}`
    : null;

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-surface/40 px-5 py-5 transition-colors sm:px-6 sm:py-6",
        step.status === "confirmed" && "border-emerald/20 bg-emerald/[0.03]",
        step.status === "inflight" && "border-violet/30 bg-violet/[0.04]",
        step.status === "failed" && "border-rose/40 bg-rose/[0.05]",
        step.status === "pending" && "border-border"
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <StepIcon status={step.status} />
          <div>
            <p
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-fg-dim"
              style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
            >
              Step {step.step}
            </p>
            <p
              className="text-[15px] font-medium text-fg sm:text-base"
              style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
            >
              {step.signer}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-[14px] leading-snug text-fg-muted sm:text-[15px]"
            style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
          >
            {step.label}
          </p>

          {step.txHash && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
              <span
                className="text-fg-dim"
                style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
              >
                tx
              </span>
              <code
                className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-fg"
                style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
              >
                {shortHash(step.txHash, 10, 8)}
              </code>
              {step.blockNumber ? (
                <>
                  <span className="text-fg-dim">block</span>
                  <code
                    className="rounded bg-white/[0.04] px-1.5 py-0.5 text-fg"
                    style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
                  >
                    #{step.blockNumber}
                  </code>
                </>
              ) : null}
              {explorerLink && (
                <a
                  href={explorerLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-fg-dim transition-colors hover:text-fg"
                >
                  <span>Explorer</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          )}

          {step.events && step.events.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {step.events.map((ev, idx) => (
                <span
                  key={`${ev.section}-${ev.method}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-bg/40 px-2 py-0.5 text-[10px] text-fg-muted"
                  style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
                >
                  <span className="text-fg-dim">{ev.section}</span>
                  <ChevronRight className="size-2.5 text-fg-dim" />
                  <span className="text-fg">{ev.method}</span>
                </span>
              ))}
            </div>
          )}

          {step.error && (
            <p className="mt-3 text-[12px] text-rose">{step.error}</p>
          )}
        </div>

        <div className="shrink-0">
          <StatusBadge status={step.status} />
        </div>
      </div>
    </div>
  );
}

export function FlowRunner() {
  const { steps } = useChain();

  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <StepRow key={step.step} step={step} />
      ))}
    </div>
  );
}
