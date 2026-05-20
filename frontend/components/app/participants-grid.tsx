"use client";

import { useChain } from "@/components/providers/chain-provider";
import { shortAddress } from "@/lib/chain/proof";
import { Crown, User, Banknote, Shield } from "lucide-react";

type ParticipantRow = {
  key: keyof NonNullable<ReturnType<typeof useChain>["proof"]>["participants"];
  label: string;
  role: string;
  icon: typeof User;
};

const rows: ParticipantRow[] = [
  { key: "alice", label: "Alice", role: "Founder · proposer", icon: Crown },
  { key: "bob", label: "Bob", role: "Member · approver", icon: User },
  { key: "charlie", label: "Charlie", role: "Member", icon: User },
  { key: "dave", label: "Dave", role: "Recipient (Round 1 winner)", icon: Banknote },
  { key: "multisig", label: "Group multisig", role: "2-of-3 — holds the pot", icon: Shield },
];

export function ParticipantsGrid() {
  const { proof } = useChain();
  const participants = proof?.participants;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface/30">
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:grid-cols-3 md:divide-y-0 lg:grid-cols-5">
        {rows.map((r) => {
          const Icon = r.icon;
          const addr = participants?.[r.key];
          const isMultisig = r.key === "multisig";
          return (
            <div
              key={r.key}
              className={`flex flex-col gap-3 p-4 sm:p-5 ${
                isMultisig ? "bg-violet/[0.04]" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`grid size-8 place-items-center rounded-full ${
                    isMultisig
                      ? "bg-violet/15 text-violet-soft"
                      : "bg-white/[0.05] text-fg-muted"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[13px] font-medium text-fg"
                    style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
                  >
                    {r.label}
                  </p>
                  <p className="truncate text-[10px] uppercase tracking-[0.14em] text-fg-dim">
                    {r.role}
                  </p>
                </div>
              </div>
              <code
                className="block break-all rounded-md bg-bg/40 px-2 py-1.5 text-[10px] text-fg-muted"
                style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
                title={addr}
              >
                {addr ? shortAddress(addr) : "—"}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
}
