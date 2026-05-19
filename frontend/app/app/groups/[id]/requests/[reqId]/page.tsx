"use client";

import { use, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { notFound } from "next/navigation";
import {
  BrainCircuit,
  CircleCheck,
  CircleX,
  Clock,
  FileLock,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Flag,
} from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { getGroup, getRequest } from "@/lib/mock";
import { PageHeader } from "@/components/app/page-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export default function RequestPage({
  params,
}: {
  params: Promise<{ id: string; reqId: string }>;
}) {
  const { id, reqId } = use(params);
  const group = getGroup(id);
  const req = getRequest(reqId);
  const ref = useRef<HTMLDivElement>(null);
  const [myVote, setMyVote] = useState<"approve" | "reject" | null>(null);

  useGSAP(
    () => {
      registerGsap();
      gsap.fromTo(
        ".anim-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  if (!group || !req) notFound();

  const approveWeight = req.votes
    .filter((v) => v.verdict === "APPROVE")
    .reduce((s, v) => s + v.weight, 0);
  const rejectWeight = req.votes
    .filter((v) => v.verdict === "REJECT")
    .reduce((s, v) => s + v.weight, 0);
  const pending = req.votes.filter((v) => v.verdict === "PENDING").length;
  const totalWeight = req.votes.reduce((s, v) => s + v.weight, 0) || 1;
  const approvePct = (approveWeight / totalWeight) * 100;
  const rejectPct = (rejectWeight / totalWeight) * 100;

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow={`request · #${req.id.slice(2)} · ${group.name}`}
        title={`${req.requester} requested ${req.amount} POT`}
        description={req.reason}
        actions={
          <>
            <Button href={`/app/groups/${group.id}`} variant="secondary">
              ← Back to group
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="flex flex-col gap-2 p-5">
              <span className="text-[10px] uppercase tracking-wider text-fg-dim">
                Status
              </span>
              <div>
                <Badge
                  tone={
                    req.status === "fast-track"
                      ? "emerald"
                      : req.status === "executed"
                        ? "emerald"
                        : req.status === "auto-rejected"
                          ? "neutral"
                          : "violet"
                  }
                >
                  {req.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-fg-muted">
                Route · {req.prevalidation.route}
              </p>
            </div>
          </GlowCard>
        </div>
        <div className="anim-card">
          <GlowCard glow="emerald" interactive={false}>
            <div className="flex flex-col gap-2 p-5">
              <span className="text-[10px] uppercase tracking-wider text-fg-dim">
                AI confidence
              </span>
              <p className="font-mono text-2xl text-emerald-soft">
                {req.prevalidation.confidence.toFixed(2)}
              </p>
              <p className="text-xs text-fg-muted">
                Verdict · {req.prevalidation.verdict}
              </p>
            </div>
          </GlowCard>
        </div>
        <div className="anim-card">
          <GlowCard glow="cyan" interactive={false}>
            <div className="flex flex-col gap-2 p-5">
              <span className="text-[10px] uppercase tracking-wider text-fg-dim">
                Tally (weighted)
              </span>
              <p className="font-mono text-xl text-fg">
                {approveWeight.toFixed(2)}{" "}
                <span className="text-fg-muted">/ {totalWeight.toFixed(2)}</span>
              </p>
              <p className="text-xs text-fg-muted">
                {pending} pending votes
              </p>
            </div>
          </GlowCard>
        </div>
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="flex flex-col gap-2 p-5">
              <span className="text-[10px] uppercase tracking-wider text-fg-dim">
                Deadline
              </span>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-fg-muted" />
                <p className="font-mono text-base text-fg">11h 42m</p>
              </div>
              <p className="text-xs text-fg-muted">
                {new Date(req.deadline).toLocaleString()}
              </p>
            </div>
          </GlowCard>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Tier 1 */}
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false} className="h-full">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="size-4 text-violet-soft" />
                <h3 className="text-sm font-semibold text-fg">
                  Tier 1 · Requester Agent verdict
                </h3>
              </div>
              <Badge tone={req.prevalidation.verdict === "PASS" ? "emerald" : "neutral"}>
                {req.prevalidation.verdict}
              </Badge>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-border bg-bg/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-fg-dim">
                    Confidence
                  </p>
                  <p className="font-mono text-sm text-emerald-soft">
                    {req.prevalidation.confidence.toFixed(2)}
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet via-cyan to-emerald"
                    style={{ width: `${req.prevalidation.confidence * 100}%` }}
                  />
                </div>
              </div>

              <ul className="space-y-3 text-sm">
                {req.prevalidation.checks.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center justify-between gap-4 border-t border-border pt-3 first:border-0 first:pt-0"
                  >
                    <div className="flex items-center gap-2 text-fg-muted">
                      {c.ok ? (
                        <CircleCheck className="size-4 text-emerald-soft" />
                      ) : (
                        <CircleX className="size-4 text-rose" />
                      )}
                      <span>{c.label}</span>
                    </div>
                    <div className="flex items-baseline gap-3 text-right">
                      <span className="text-xs text-fg-dim">{c.weight}</span>
                      <span className="text-fg">{c.value}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between rounded-2xl border border-violet/20 bg-violet/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-violet-soft" />
                  <span className="text-sm text-fg-muted">Routing decision</span>
                </div>
                <span className="font-mono text-xs text-violet-soft">
                  {req.prevalidation.route}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border bg-bg/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileLock className="size-4 text-fg-muted" />
                  <span className="text-sm text-fg-muted">Reasoning CID</span>
                </div>
                <span className="font-mono text-[11px] text-fg-dim">
                  {req.prevalidation.reasoningCid}
                </span>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Tier 2 */}
        <div className="anim-card">
          <GlowCard glow="emerald" interactive={false} className="h-full">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="size-4 text-emerald-soft" />
                <h3 className="text-sm font-semibold text-fg">
                  Tier 2 · Reviewer Agents
                </h3>
              </div>
              <span className="text-[11px] text-fg-dim">
                {req.votes.length} reviewers
              </span>
            </div>

            <div className="space-y-4 p-6">
              {/* Tally bar */}
              <div className="rounded-2xl border border-border bg-bg/40 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-emerald-soft">
                    Approve · {approvePct.toFixed(0)}%
                  </span>
                  <span className="text-rose">
                    Reject · {rejectPct.toFixed(0)}%
                  </span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full bg-gradient-to-r from-emerald to-emerald-soft"
                    style={{ width: `${approvePct}%` }}
                  />
                  <div
                    className="h-full bg-rose"
                    style={{ width: `${rejectPct}%` }}
                  />
                </div>
              </div>

              {/* Reviewer cards */}
              <ul className="space-y-3">
                {req.votes.map((v) => (
                  <li
                    key={v.reviewer}
                    className={cn(
                      "rounded-2xl border bg-bg/40 p-4 transition-colors",
                      v.verdict === "APPROVE" && "border-emerald/20",
                      v.verdict === "REJECT" && "border-rose/30",
                      v.verdict === "PENDING" && "border-dashed border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-violet/30 to-emerald/20 text-xs font-medium text-fg">
                          {v.reviewer[0]}
                        </span>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-fg">
                            {v.reviewer}
                          </p>
                          <p className="text-[11px] text-fg-dim">
                            weight {v.weight}× · confidence{" "}
                            {v.confidence.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider",
                          v.verdict === "APPROVE" &&
                            "border-emerald/30 bg-emerald/10 text-emerald-soft",
                          v.verdict === "REJECT" &&
                            "border-rose/30 bg-rose/10 text-rose",
                          v.verdict === "PENDING" &&
                            "border-amber/30 bg-amber/10 text-amber"
                        )}
                      >
                        {v.verdict}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                      {v.reasoning}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Your vote */}
              {req.status === "fast-track" || req.status === "voting" ? (
                <div className="space-y-3 rounded-2xl border border-violet/30 bg-violet/[0.06] p-5">
                  <p className="text-sm font-medium text-fg">Your vote</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMyVote("approve")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
                        myVote === "approve"
                          ? "border-emerald/40 bg-emerald/15 text-emerald-soft"
                          : "border-border bg-bg/40 text-fg-muted hover:border-border-strong hover:text-fg"
                      )}
                    >
                      <ThumbsUp className="size-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setMyVote("reject")}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
                        myVote === "reject"
                          ? "border-rose/40 bg-rose/15 text-rose"
                          : "border-border bg-bg/40 text-fg-muted hover:border-border-strong hover:text-fg"
                      )}
                    >
                      <ThumbsDown className="size-4" />
                      Reject
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-bg/40 px-3 py-2.5 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                    >
                      <Flag className="size-4" />
                      Challenge
                    </button>
                  </div>
                  <p className="text-[11px] text-fg-dim">
                    Your vote uses weight {1.18}× · committed to VotingEngine on submit.
                  </p>
                </div>
              ) : null}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
