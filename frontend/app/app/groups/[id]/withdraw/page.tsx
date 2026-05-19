"use client";

import { use, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { notFound } from "next/navigation";
import { BrainCircuit, Sparkles, ShieldAlert } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { getGroup, me } from "@/lib/mock";
import { PageHeader } from "@/components/app/page-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const inputClass =
  "w-full rounded-2xl border border-border bg-bg/40 px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-violet/50 focus:bg-bg/60";

export default function WithdrawPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const group = getGroup(id);
  const ref = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("500");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<"scheduled" | "emergency" | "early">(
    "scheduled"
  );

  useGSAP(
    () => {
      registerGsap();
      gsap.fromTo(
        ".anim-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  if (!group) notFound();

  // Mock confidence estimate based on reason length + category + member reputation
  const reasonScore = Math.min(1, reason.length / 80);
  const categoryScore = category === "emergency" ? 0.85 : category === "scheduled" ? 0.95 : 0.55;
  const repScore = me.reputation / 1000;
  const estimatedConfidence = Math.min(
    0.99,
    0.4 + reasonScore * 0.2 + categoryScore * 0.2 + repScore * 0.2
  );

  const route =
    estimatedConfidence >= 0.85
      ? "HYBRID_FAST_TRACK"
      : estimatedConfidence >= 0.5
        ? "NORMAL"
        : "AUTO_REJECT";

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow={`group · ${group.name}`}
        title="Request a withdrawal."
        description="The Requester Agent pre-validates your request before opening the vote. Your reputation and history are queried directly from Portaldot."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-fg">Withdrawal details</h3>
            </div>
            <div className="space-y-6 p-6">
              <label className="flex flex-col gap-2 text-xs uppercase tracking-wider text-fg-dim">
                Amount (POT)
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                />
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-fg-dim">
                  Category
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["scheduled", "emergency", "early"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={
                        category === c
                          ? "rounded-2xl border border-violet/40 bg-violet/15 px-3 py-3 text-sm font-medium text-fg"
                          : "rounded-2xl border border-border bg-bg/40 px-3 py-3 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                      }
                    >
                      {c[0].toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-2 text-xs uppercase tracking-wider text-fg-dim">
                Reason (committed onchain as hash)
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  placeholder="Describe the context. The Requester Agent uses this to gauge plausibility — longer, specific reasons score higher."
                  className={inputClass}
                />
                <span className="text-[10px] normal-case text-fg-dim">
                  {reason.length} chars · only the hash + summary are stored onchain
                </span>
              </label>

              <div className="rounded-2xl border border-amber/20 bg-amber/[0.05] p-4 text-xs text-amber">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Vague or absent reasons score below 50% and trigger AUTO_REJECT. Lying
                    permanently lowers reputation across every Auralis group.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-border pt-5">
                <Button
                  href={`/app/groups/${group.id}/requests/r_038`}
                  withArrow
                >
                  Submit to chain
                </Button>
              </div>
            </div>
          </GlowCard>
        </div>

        <div className="anim-card">
          <GlowCard glow="emerald" interactive={false} className="h-full">
            <div className="flex h-full flex-col gap-5 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="size-4 text-emerald-soft" />
                  <h3 className="text-sm font-semibold text-fg">
                    Live confidence preview
                  </h3>
                </div>
                <Badge tone="emerald">simulated</Badge>
              </div>

              <div className="rounded-2xl border border-border bg-bg/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-fg-dim">
                    Estimated confidence
                  </p>
                  <p className="font-mono text-lg text-emerald-soft">
                    {estimatedConfidence.toFixed(2)}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet via-cyan to-emerald transition-[width] duration-500"
                    style={{ width: `${estimatedConfidence * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
                  <Sparkles className="size-3.5 text-violet-soft" />
                  <span>
                    Route ·{" "}
                    <span className="font-mono text-fg">{route}</span>
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-3 text-sm text-fg-muted">
                <li className="flex items-center justify-between">
                  <span>Reputation</span>
                  <span className="font-mono text-fg">{me.reputation}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Deposit consistency</span>
                  <span className="font-mono text-fg">{me.depositConsistency}%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Cross-group history</span>
                  <span className="font-mono text-fg">{me.groupsActive} groups</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Vote weight</span>
                  <span className="font-mono text-fg">{me.voteWeight}×</span>
                </li>
              </ul>

              <p className="mt-auto rounded-2xl border border-border bg-bg/40 p-4 text-xs leading-relaxed text-fg-dim">
                Estimate is local-only — the on-chain Requester Agent recomputes confidence
                from authoritative sources before opening the vote.
              </p>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
