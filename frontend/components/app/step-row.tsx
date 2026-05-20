"use client";

import { useEffect, useRef, useState } from "react";
import { shortHash } from "@/lib/chain/proof";
import type { StepState } from "@/lib/chain/types";

const STEP_COPY: Record<number, string> = {
  1: "Alice sent 100 POT to the group.",
  2: "Bob sent 100 POT to the group.",
  3: "Charlie sent 100 POT to the group.",
  4: "Alice proposed paying the 300 POT pot to Dave.",
  5: "Bob approved. The pot moved to Dave automatically.",
};

export function StepRow({ step }: { step: StepState }) {
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
    <li
      className={`group flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border bg-[#141414] px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] ${
        step.status === "confirmed"
          ? "border-emerald/15"
          : step.status === "inflight"
            ? "border-amber/30"
            : step.status === "failed"
              ? "border-rose/40"
              : "border-border"
      } ${flash ? "confirm-flash" : ""}`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.04] text-[12px] font-medium tabular-nums text-fg-muted transition-colors group-hover:bg-white/[0.08] group-hover:text-fg">
        {step.step}
      </span>
      <p className="min-w-0 flex-1 text-[14px] text-fg">
        {STEP_COPY[step.step]}
      </p>

      <div className="flex items-center gap-4 text-[12px]">
        {step.txHash && (
          <a
            href={explorer ?? "#"}
            target={explorer ? "_blank" : undefined}
            rel={explorer ? "noreferrer" : undefined}
            className={`tabular-nums text-fg-muted ${
              explorer
                ? "underline decoration-fg-dim underline-offset-4 hover:text-fg"
                : ""
            }`}
            style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
          >
            {shortHash(step.txHash, 6, 4)}
          </a>
        )}
        {step.blockNumber ? (
          <span
            className="tabular-nums text-fg-dim"
            style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
          >
            #{step.blockNumber}
          </span>
        ) : null}
        <span
          className={`flex items-center gap-1.5 text-[12px] ${phaseColor}`}
        >
          {step.status === "inflight" && (
            <span className="relative inline-flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-amber/40" />
              <span className="relative inline-flex size-1.5 rounded-full bg-amber" />
            </span>
          )}
          {phase}
        </span>
      </div>
    </li>
  );
}
