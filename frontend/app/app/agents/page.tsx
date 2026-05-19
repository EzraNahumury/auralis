"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { BrainCircuit, Sparkles } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { PageHeader } from "@/components/app/page-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type Policy = "conservative" | "trust-default" | "strict-emergency";

const policies: Record<
  Policy,
  { label: string; description: string; tone: "violet" | "emerald" | "cyan" }
> = {
  conservative: {
    label: "Conservative",
    description:
      "Requires high deposit consistency and platinum-tier requester. Auto-rejects vague reasons.",
    tone: "violet",
  },
  "trust-default": {
    label: "Trust by default",
    description:
      "Approves any request with reputation ≥ 500 and consistent deposits. Manual review for outliers.",
    tone: "emerald",
  },
  "strict-emergency": {
    label: "Strict emergency",
    description:
      "Approves emergencies only with hospital/document timestamps. Otherwise rejects.",
    tone: "cyan",
  },
};

export default function AgentsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [policy, setPolicy] = useState<Policy>("trust-default");
  const [autoVote, setAutoVote] = useState(true);
  const [llm, setLlm] = useState("claude-opus-4-7");

  useGSAP(
    () => {
      registerGsap();
      gsap.fromTo(
        ".anim-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="Agent settings"
        title="Configure how your Reviewer Agent reasons."
        description="Each member runs a personal Reviewer Agent. Tune its policy, model, and autonomy level here."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="size-4 text-violet-soft" />
                <h3 className="text-sm font-semibold text-fg">
                  Reviewer Agent policy
                </h3>
              </div>
              <Badge tone="violet">Tier 2</Badge>
            </div>

            <div className="space-y-3 p-6">
              {(Object.keys(policies) as Policy[]).map((p) => {
                const cfg = policies[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPolicy(p)}
                    className={cn(
                      "flex w-full flex-col gap-2 rounded-2xl border bg-bg/40 p-4 text-left transition-colors",
                      policy === p
                        ? "border-violet/40 bg-violet/[0.07]"
                        : "border-border hover:border-border-strong"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-fg">{cfg.label}</p>
                      <Badge tone={cfg.tone}>
                        {policy === p ? "active" : "select"}
                      </Badge>
                    </div>
                    <p className="text-sm text-fg-muted">{cfg.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 border-t border-border p-6">
              <label className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-fg">
                    Auto-cast vote
                  </span>
                  <span className="text-xs text-fg-muted">
                    Agent commits the vote onchain without waiting for your confirmation.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoVote((v) => !v)}
                  className={cn(
                    "relative h-7 w-12 rounded-full border transition-colors",
                    autoVote
                      ? "border-emerald/40 bg-emerald/30"
                      : "border-border bg-bg/40"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-fg transition-all",
                      autoVote ? "right-1 bg-emerald-soft" : "left-1 bg-fg-dim"
                    )}
                  />
                </button>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-fg-dim">
                  LLM model
                </span>
                <select
                  value={llm}
                  onChange={(e) => setLlm(e.target.value)}
                  className="rounded-2xl border border-border bg-bg/40 px-4 py-3 text-sm text-fg outline-none transition-colors focus:border-violet/50"
                >
                  <option value="claude-opus-4-7">Claude Opus 4.7</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                </select>
              </label>
            </div>
          </GlowCard>
        </div>

        <div className="anim-card">
          <GlowCard glow="emerald" interactive={false} className="h-full">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-soft" />
                <h3 className="text-sm font-semibold text-fg">Live policy preview</h3>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-border bg-bg/40 p-4">
                <p className="text-[11px] uppercase tracking-wider text-fg-dim">
                  Selected policy
                </p>
                <p className="mt-2 text-lg font-semibold text-fg">
                  {policies[policy].label}
                </p>
                <p className="mt-2 text-sm text-fg-muted">
                  {policies[policy].description}
                </p>
              </div>

              <pre className="overflow-x-auto rounded-2xl border border-border bg-bg/60 p-4 font-mono text-[11px] leading-relaxed text-fg-muted">
{`policy:
  name: ${policy}
  llm: ${llm}
  auto_vote: ${autoVote}
  voting_rules:
    - min_reputation: ${policy === "conservative" ? 700 : policy === "trust-default" ? 500 : 600}
    - require_emergency_proof: ${policy === "strict-emergency"}
    - reject_threshold_confidence: 0.5
    - approve_threshold_confidence: 0.7`}
              </pre>

              <div className="rounded-2xl border border-violet/20 bg-violet/[0.06] p-4 text-xs text-violet-soft">
                <p>
                  Saves to <span className="font-mono">ReputationRegistry.policy(account)</span>{" "}
                  · gas ≈ 0.08 POT
                </p>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
