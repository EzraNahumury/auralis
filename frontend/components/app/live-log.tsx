"use client";

import { useEffect, useRef } from "react";
import { useChain } from "@/components/providers/chain-provider";

export function LiveLog() {
  const { log, running, mode } = useChain();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [log.length]);

  if (mode !== "live" || (!running && log.length === 0)) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex size-2">
            {running && (
              <span className="absolute inset-0 animate-ping rounded-full bg-amber/40" />
            )}
            <span
              className={`relative size-2 rounded-full ${
                running ? "bg-amber" : "bg-fg-dim/60"
              }`}
              aria-hidden
            />
          </span>
          <p className="text-[12px] text-fg-muted">
            {running ? "companion stdout — live" : "companion stdout"}
          </p>
        </div>
        <p
          className="text-[11px] text-fg-dim"
          style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
        >
          {log.length} lines
        </p>
      </div>
      <div
        ref={ref}
        className="max-h-[280px] overflow-y-auto px-5 py-4"
        style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
      >
        {log.length === 0 && (
          <p className="text-[12px] text-fg-dim">waiting for first line…</p>
        )}
        <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-fg-muted">
          {log.map((l, i) => (
            <span
              key={`${i}-${l.ts}`}
              className={l.stream === "stderr" ? "text-amber" : ""}
            >
              {l.line}
              {"\n"}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
