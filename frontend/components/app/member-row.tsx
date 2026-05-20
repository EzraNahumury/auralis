"use client";

import { useEffect, useRef, useState } from "react";
import { useChain } from "@/components/providers/chain-provider";
import type { StepState } from "@/lib/chain/types";
import { AVATARS, type MemberName } from "@/lib/avatars";

type MemberDef = {
  name: MemberName;
  role: string;
  reputation?: number;
  tier?: string;
};

const MEMBERS: MemberDef[] = [
  { name: "Alice", role: "Founder", reputation: 887, tier: "Platinum" },
  { name: "Bob", role: "Member", reputation: 645, tier: "Gold" },
  { name: "Charlie", role: "Member", reputation: 521, tier: "Gold" },
  { name: "Dave", role: "This round’s recipient" },
];

function depositStatus(name: string, steps: StepState[]) {
  const stepNum =
    name === "Alice" ? 1 : name === "Bob" ? 2 : name === "Charlie" ? 3 : null;
  if (stepNum === null) return { paid: false, status: "Receiving" };
  const step = steps.find((s) => s.step === stepNum);
  if (step?.status === "confirmed") return { paid: true, status: "Paid 100 POT" };
  if (step?.status === "inflight") return { paid: false, status: "Sending…" };
  if (step?.status === "failed") return { paid: false, status: "Failed" };
  return { paid: false, status: "Pending" };
}

function MemberRowItem({
  m,
  stepStatus,
  paid,
  isInflight,
  isFailed,
}: {
  m: MemberDef;
  stepStatus: string;
  paid: boolean;
  isInflight: boolean;
  isFailed: boolean;
}) {
  const prev = useRef(paid);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (paid && !prev.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1600);
      return () => clearTimeout(t);
    }
    prev.current = paid;
  }, [paid]);

  const avatar = AVATARS[m.name];

  return (
    <li
      className={`group flex items-center justify-between gap-4 px-2 py-4 transition-all duration-300 hover:translate-x-0.5 hover:bg-white/[0.02] ${
        flash ? "confirm-flash" : ""
      }`}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="grid size-10 place-items-center rounded-full text-[20px] shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.05]"
          style={{ background: avatar.bg }}
          aria-label={m.name}
        >
          {avatar.emoji}
        </span>
        <div>
          <p className="text-[14px] font-medium text-fg">{m.name}</p>
          <p className="text-[12px] text-fg-muted">{m.role}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {m.reputation && (
          <div className="hidden text-right sm:block">
            <p className="text-[13px] tabular-nums text-fg">{m.reputation}</p>
            <p className="text-[11px] text-fg-dim">{m.tier}</p>
          </div>
        )}
        <div className="text-right">
          <p
            className={`flex items-center justify-end gap-2 text-[13px] ${
              isFailed ? "text-rose" : "text-fg"
            }`}
          >
            {isInflight && (
              <span className="relative inline-flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-amber/50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-amber" />
              </span>
            )}
            {stepStatus}
          </p>
          <p
            className={`text-[11px] ${
              paid ? "text-emerald-soft" : "text-fg-dim"
            }`}
          >
            {paid
              ? "Confirmed"
              : m.name === "Dave"
                ? "Awaiting payout"
                : "—"}
          </p>
        </div>
      </div>
    </li>
  );
}

export function MemberRow() {
  const { steps } = useChain();
  return (
    <ul className="divide-y divide-border border-y border-border">
      {MEMBERS.map((m) => {
        const dep = depositStatus(m.name, steps);
        const stepNum =
          m.name === "Alice" ? 1 : m.name === "Bob" ? 2 : m.name === "Charlie" ? 3 : null;
        const step = stepNum
          ? steps.find((s) => s.step === stepNum)
          : undefined;
        return (
          <MemberRowItem
            key={m.name}
            m={m}
            stepStatus={dep.status}
            paid={dep.paid}
            isInflight={step?.status === "inflight"}
            isFailed={step?.status === "failed"}
          />
        );
      })}
    </ul>
  );
}
