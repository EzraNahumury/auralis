"use client";

import { useEffect, useRef, useState } from "react";
import { shortHash } from "@/lib/chain/proof";
import type { StepState } from "@/lib/chain/types";
import { useChain } from "@/components/providers/chain-provider";

const STEP_COPY: Record<number, string> = {
  1: "Alice sent 100 POT to the group.",
  2: "Bob sent 100 POT to the group.",
  3: "Charlie sent 100 POT to the group.",
  4: "Alice proposed paying the 300 POT pot to Dave.",
  5: "Bob approved. The pot moved to Dave automatically.",
};

function StatusDot({ status }: { status: StepState["status"] }) {
  const base =
    "relative grid size-[14px] place-items-center rounded-full transition-all duration-500";
  if (status === "confirmed") {
    return (
      <span
        className={`${base} bg-emerald/90 shadow-[0_0_0_4px_rgba(15,17,15,1),0_0_16px_rgba(108,242,204,0.45)]`}
      />
    );
  }
  if (status === "inflight") {
    return (
      <span
        className={`${base} bg-amber breathe shadow-[0_0_0_4px_rgba(15,17,15,1)]`}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-amber/45" />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className={`${base} bg-rose shadow-[0_0_0_4px_rgba(15,17,15,1)]`}
      />
    );
  }
  return (
    <span
      className={`${base} border border-fg-dim/40 bg-bg shadow-[0_0_0_4px_rgba(15,17,15,1)]`}
    />
  );
}

function StepNode({ step, isLast }: { step: StepState; isLast: boolean }) {
  const prev = useRef(step.status);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (step.status === "confirmed" && prev.current !== "confirmed") {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1600);
      prev.current = step.status;
      return () => clearTimeout(t);
    }
    prev.current = step.status;
  }, [step.status]);

  const explorer = step.blockHash?.startsWith("0x")
    ? `https://drip-node-production.up.railway.app/?#/explorer/query/${step.blockHash}`
    : null;

  const phase =
    step.status === "confirmed"
      ? "Done"
      : step.status === "inflight"
        ? "Sending"
        : step.status === "failed"
          ? "Failed"
          : "Waiting";

  const phaseColor =
    step.status === "confirmed"
      ? "text-emerald-soft"
      : step.status === "inflight"
        ? "text-amber"
        : step.status === "failed"
          ? "text-rose"
          : "text-fg-dim";

  return (
    <li className="relative pb-9 last:pb-0">
      <span className="absolute left-0 top-0.5">
        <StatusDot status={step.status} />
      </span>
      <div
        className={`ml-9 rounded-xl px-4 py-3 transition-colors duration-300 hover:bg-white/[0.025] ${
          flash ? "confirm-flash" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="min-w-0 flex-1 text-[14px] text-fg">
            {STEP_COPY[step.step]}
          </p>
          <span className={`text-[12px] ${phaseColor}`}>{phase}</span>
        </div>
        {(step.txHash || step.blockNumber) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-fg-dim">
            {step.txHash && (
              <a
                href={explorer ?? "#"}
                target={explorer ? "_blank" : undefined}
                rel={explorer ? "noreferrer" : undefined}
                className={`tabular-nums ${
                  explorer
                    ? "underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
                    : ""
                }`}
                style={{
                  fontFamily:
                    "var(--font-geist-mono), ui-monospace, monospace",
                }}
              >
                {shortHash(step.txHash, 6, 4)}
              </a>
            )}
            {step.blockNumber ? (
              <span
                className="tabular-nums"
                style={{
                  fontFamily:
                    "var(--font-geist-mono), ui-monospace, monospace",
                }}
              >
                block #{step.blockNumber}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </li>
  );
}

export function Timeline() {
  const { steps } = useChain();
  const lastConfirmedIdx = steps.reduce(
    (acc, s, i) => (s.status === "confirmed" ? i : acc),
    -1
  );

  return (
    <ol className="relative">
      {/* base vertical line */}
      <span
        aria-hidden
        className="absolute left-[6.5px] top-2 h-[calc(100%-1rem)] w-px bg-border"
      />
      {/* progress fill on the same line, animates as steps confirm */}
      <span
        aria-hidden
        className="absolute left-[6.5px] top-2 w-px bg-gradient-to-b from-emerald/80 to-emerald/30 transition-all duration-700"
        style={{
          height:
            lastConfirmedIdx >= 0
              ? `calc(${((lastConfirmedIdx + 1) / steps.length) * 100}% - 1rem)`
              : "0%",
        }}
      />
      {steps.map((step, i) => (
        <StepNode
          key={step.step}
          step={step}
          isLast={i === steps.length - 1}
        />
      ))}
    </ol>
  );
}
