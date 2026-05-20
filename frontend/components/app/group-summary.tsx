"use client";

import { useChain } from "@/components/providers/chain-provider";
import { Coins, Users, Vote } from "lucide-react";

export function GroupSummary() {
  const { proof, steps } = useChain();
  const confirmed = steps.filter((s) => s.status === "confirmed").length;
  const inflight = steps.some((s) => s.status === "inflight");
  const failed = steps.some((s) => s.status === "failed");

  const phase = failed
    ? { label: "Halted", tone: "text-rose" }
    : inflight
      ? { label: "In progress", tone: "text-violet-soft" }
      : confirmed === 5
        ? { label: "Round complete", tone: "text-emerald-soft" }
        : confirmed === 0
          ? { label: "Awaiting deposits", tone: "text-fg-muted" }
          : { label: `Step ${confirmed + 1}/5 next`, tone: "text-fg-muted" };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-surface/40 p-5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-fg-dim">Group</p>
        <p
          className="mt-2 text-[18px] font-semibold tracking-tight text-fg"
          style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif" }}
        >
          Arisan Tetangga RT 03
        </p>
        <p className="mt-1 text-[12px] text-fg-muted">
          Round 1 · 3 members · 1 recipient
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface/40 p-5">
        <div className="flex items-center gap-2 text-fg-dim">
          <Coins className="size-3.5" />
          <p className="text-[10px] uppercase tracking-[0.16em]">Pot size</p>
        </div>
        <p
          className="mt-2 text-[20px] font-semibold tracking-tight text-fg"
          style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
        >
          300 <span className="text-[14px] text-fg-muted">POT</span>
        </p>
        <p className="mt-1 text-[12px] text-fg-muted">
          {proof?.config.depositPerMember ?? "100 POT"} × 3 members
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface/40 p-5">
        <div className="flex items-center gap-2 text-fg-dim">
          <Vote className="size-3.5" />
          <p className="text-[10px] uppercase tracking-[0.16em]">Threshold</p>
        </div>
        <p
          className="mt-2 text-[20px] font-semibold tracking-tight text-fg"
          style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
        >
          {proof?.config.threshold ?? "2-of-3"}
        </p>
        <p className="mt-1 text-[12px] text-fg-muted">
          pallet-multisig · ≥ 2 sigs to release
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface/40 p-5">
        <div className="flex items-center gap-2 text-fg-dim">
          <Users className="size-3.5" />
          <p className="text-[10px] uppercase tracking-[0.16em]">Phase</p>
        </div>
        <p
          className={`mt-2 text-[20px] font-semibold tracking-tight ${phase.tone}`}
          style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
        >
          {phase.label}
        </p>
        <p className="mt-1 text-[12px] text-fg-muted">
          {confirmed}/5 transactions confirmed
        </p>
      </div>
    </div>
  );
}
