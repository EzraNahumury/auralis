"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useChain } from "@/components/providers/chain-provider";
import { AnimatedNumber } from "./animated-number";
import { AVATARS } from "@/lib/avatars";

export function HeroCard() {
  const { steps, mode, setMode, runLive, running } = useChain();
  const live = mode === "live";
  const confirmed = steps.filter((s) => s.status === "confirmed").length;
  const done = confirmed === 5;

  const [target, setTarget] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setTarget(300), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-gradient-to-b from-[#141414] to-[#0f0f0f] p-8 sm:p-12">
      {/* one very subtle glow — radial, near-static */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full opacity-60 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(145,129,245,0.16) 0%, rgba(145,129,245,0) 60%)",
        }}
      />

      <div className="relative">
        <p className="text-[12px] text-fg-muted">This round&rsquo;s pot</p>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-8">
          <div className="flex items-baseline gap-3">
            <span
              className="text-[88px] font-medium leading-none tabular-nums tracking-tighter text-fg sm:text-[104px]"
              style={{ fontFeatureSettings: '"ss01", "cv11"' }}
            >
              <AnimatedNumber value={target} duration={1700} />
            </span>
            <span className="pb-3 text-[22px] font-normal text-fg-muted">POT</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-fg-dim">
                Goes to
              </p>
              <p className="mt-1 text-[15px] font-medium text-fg">Dave</p>
            </div>
            <ArrowRight className="size-4 text-fg-dim" aria-hidden />
            <span
              className="grid size-12 place-items-center rounded-full text-[24px] shadow-[0_10px_30px_rgba(124,45,82,0.45)]"
              style={{ background: AVATARS.Dave.bg }}
              aria-label="Dave"
            >
              {AVATARS.Dave.emoji}
            </span>
          </div>
        </div>

        {/* progress strip */}
        <div className="mt-10 flex items-center gap-4">
          <div className="flex flex-1 items-center gap-1.5">
            {steps.map((s) => (
              <span
                key={s.step}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  s.status === "confirmed"
                    ? "bg-emerald/80"
                    : s.status === "inflight"
                      ? "bg-amber/80 breathe"
                      : s.status === "failed"
                        ? "bg-rose/80"
                        : "bg-white/[0.07]"
                }`}
              />
            ))}
          </div>
          <p className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-fg-dim">
            <span className="tabular-nums text-fg">{confirmed}</span>
            <span className="mx-1">of</span>
            <span className="tabular-nums text-fg">5</span>
          </p>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (!live) setMode("live");
              runLive();
            }}
            disabled={running}
            className="group relative overflow-hidden rounded-full bg-white px-7 py-3.5 text-[14px] font-medium text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <span className="relative z-10">
              {running ? (
                <span className="inline-flex items-center gap-2">
                  <span className="relative inline-flex size-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-amber/40" />
                    <span className="relative inline-flex size-2 rounded-full bg-amber" />
                  </span>
                  Running on chain
                </span>
              ) : done ? (
                "Run another round"
              ) : (
                "Run the round on chain"
              )}
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.06] to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
          </button>
          <button
            type="button"
            onClick={() => setMode(live ? "recorded" : "live")}
            className="text-[12px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            {live ? "Show recorded run" : "Use recorded run"}
          </button>
        </div>
      </div>
    </div>
  );
}
