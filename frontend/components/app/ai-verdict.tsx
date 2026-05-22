"use client";

import { useEffect, useState } from "react";
import type { RequesterOutput } from "@/lib/ai/schemas";
import { AnimatedNumber } from "./animated-number";

function routingLabel(r: string) {
  if (r === "HYBRID_FAST_TRACK") return "Fast-track";
  if (r === "NORMAL") return "Standard vote";
  return "Auto-reject";
}

function routingTone(r: string): "emerald" | "amber" | "rose" {
  if (r === "HYBRID_FAST_TRACK") return "emerald";
  if (r === "NORMAL") return "amber";
  return "rose";
}

interface Props {
  verdict: RequesterOutput | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function AIVerdict({ verdict, loading, error, onRetry }: Props) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!verdict) {
      setPct(0);
      return;
    }
    const target = Math.round(verdict.confidence * 100);
    const t = setTimeout(() => setPct(target), 80);
    return () => clearTimeout(t);
  }, [verdict]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/[0.06] bg-[#141414] p-7 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex size-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-violet/50" />
            <span className="relative inline-flex size-2.5 rounded-full bg-violet" />
          </span>
          <p className="text-[14px] text-fg">Requester Agent is thinking…</p>
        </div>
        <p className="mt-3 text-[12px] text-fg-muted">
          Ollama is scoring the request against deposit history, reputation,
          cross-group activity, reason plausibility, and emergency verification.
        </p>
      </div>
    );
  }

  if (error && !verdict) {
    return (
      <div className="rounded-3xl border border-rose/30 bg-rose/[0.04] p-7 sm:p-8">
        <p className="text-[14px] text-fg">Requester Agent failed.</p>
        <p
          className="mt-2 break-words text-[12px] text-rose/80"
          style={{
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          }}
        >
          {error}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center justify-center rounded-full border border-border bg-white/[0.04] px-4 py-2 text-[12px] text-fg-muted transition-colors hover:border-fg-dim hover:text-fg"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!verdict) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-[#141414] p-7 sm:p-8">
        <p className="text-[14px] text-fg-muted">
          No verdict yet — the Requester Agent will run when the request is
          submitted.
        </p>
      </div>
    );
  }

  const v = verdict;
  const tone = routingTone(v.routing);
  const toneClass =
    tone === "emerald"
      ? "text-emerald-soft border-emerald/30 bg-emerald/[0.05]"
      : tone === "amber"
        ? "text-amber border-amber/30 bg-amber/[0.05]"
        : "text-rose border-rose/40 bg-rose/[0.05]";

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-[#141414] p-7 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-fg-muted">Requester Agent</p>
          <p className="mt-1 text-[15px] font-medium text-fg">
            Pre-validation verdict
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${toneClass}`}
        >
          <span
            className={`size-1.5 rounded-full ${
              tone === "emerald"
                ? "bg-emerald"
                : tone === "amber"
                  ? "bg-amber"
                  : "bg-rose"
            }`}
            aria-hidden
          />
          {routingLabel(v.routing)}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p
            className="text-[72px] font-medium leading-none tabular-nums tracking-tighter text-fg sm:text-[88px]"
            style={{ fontFeatureSettings: '"ss01", "cv11"' }}
          >
            <AnimatedNumber value={pct} duration={1400} />
            <span className="ml-1 text-[24px] font-normal text-fg-muted">%</span>
          </p>
          <p className="mt-2 text-[12px] text-fg-muted">Confidence</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.14em] text-fg-dim">
            Verdict
          </p>
          <p
            className={`mt-1 text-[20px] font-semibold tracking-tight ${
              v.verdict === "PASS" ? "text-emerald-soft" : "text-rose"
            }`}
          >
            {v.verdict}
          </p>
        </div>
      </div>

      <ul className="mt-8 space-y-2">
        {v.reasoning.map((line, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3 text-[13px] leading-relaxed text-fg-muted"
          >
            <span
              className="mt-1.5 size-1 shrink-0 rounded-full bg-fg-dim"
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <details className="group mt-6 border-t border-border pt-5">
        <summary className="cursor-pointer list-none text-[12px] text-fg-muted transition-colors hover:text-fg">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-fg-dim transition-transform group-open:rotate-90">
              ›
            </span>
            Pre-validation checks
          </span>
        </summary>
        <ul className="mt-4 space-y-2.5">
          {v.checks.map((c) => (
            <li
              key={c.label}
              className="flex items-center justify-between text-[12px]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`size-1.5 rounded-full ${
                    c.ok ? "bg-emerald" : "bg-rose"
                  }`}
                  aria-hidden
                />
                <span className="text-fg-muted">{c.label}</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-fg">{c.value}</span>
                <span
                  className="w-9 text-right tabular-nums text-fg-dim"
                  style={{
                    fontFamily:
                      "var(--font-geist-mono), ui-monospace, monospace",
                  }}
                >
                  {c.weight}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
