"use client";

import { useChain } from "@/components/providers/chain-provider";
import { AVATARS } from "@/lib/avatars";

export function Topbar() {
  const { mode, running, props } = useChain();
  const live = mode === "live";
  const chain = props?.chainName ?? "Portaldot dev";

  return (
    <header className="border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-8 lg:px-12">
        <div className="flex items-center gap-2 text-[12px] text-fg-dim">
          <span className="relative inline-flex size-2">
            {(live || running) && (
              <span
                className={`absolute inset-0 animate-ping rounded-full ${
                  running ? "bg-amber/50" : "bg-emerald/40"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative size-2 rounded-full ${
                running
                  ? "bg-amber"
                  : live
                    ? "bg-emerald"
                    : "bg-fg-dim/60"
              }`}
              aria-hidden
            />
          </span>
          <span>{live ? (running ? "Running on chain" : "Live") : "Recorded"}</span>
          <span className="text-fg-dim/60">·</span>
          <span>{chain}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="grid size-7 place-items-center rounded-full text-[15px] shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
            style={{ background: AVATARS.Alice.bg }}
            aria-label="Alice"
          >
            {AVATARS.Alice.emoji}
          </span>
          <span className="text-[13px] text-fg">Alice</span>
        </div>
      </div>
    </header>
  );
}
