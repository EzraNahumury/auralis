"use client";

import { Play, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { useChain } from "@/components/providers/chain-provider";

export function FlowControls() {
  const { mode, setMode, running, runLive, resetSteps, liveError } = useChain();
  const isLive = mode === "live";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-border bg-surface/40 p-1">
          <button
            type="button"
            onClick={() => setMode("recorded")}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
              !isLive
                ? "bg-white text-bg shadow-[0_-4px_8px_rgba(225,225,225,0.32)_inset]"
                : "text-fg-muted hover:text-fg"
            }`}
            style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
          >
            Recorded run
          </button>
          <button
            type="button"
            onClick={() => setMode("live")}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors ${
              isLive
                ? "bg-white text-bg shadow-[0_-4px_8px_rgba(225,225,225,0.32)_inset]"
                : "text-fg-muted hover:text-fg"
            }`}
            style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
          >
            Live on Portaldot
          </button>
        </div>

        {isLive ? (
          <button
            type="button"
            onClick={runLive}
            disabled={running}
            className="group inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-[13px] font-medium text-white shadow-[0_-4px_8px_rgba(255,255,255,0.25)_inset] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: "var(--gradient-brand)", fontFamily: "var(--font-tech), ui-sans-serif" }}
          >
            {running ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running 5-step flow…
              </>
            ) : (
              <>
                <Play className="size-4 fill-current" />
                Run 5-step Arisan flow
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={resetSteps}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/40 px-4 py-2 text-[12px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            style={{ fontFamily: "var(--font-tech), ui-sans-serif" }}
          >
            <RotateCcw className="size-3.5" />
            Replay recorded
          </button>
        )}

        {isLive && (
          <p
            className="text-[11px] text-fg-dim"
            style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
          >
            wss://drip-node-production.up.railway.app
          </p>
        )}
      </div>

      {liveError && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose/40 bg-rose/[0.06] px-4 py-3 text-[13px] text-rose">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-rose">Live run failed</p>
            <p
              className="mt-0.5 break-all text-rose/80"
              style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
            >
              {liveError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
