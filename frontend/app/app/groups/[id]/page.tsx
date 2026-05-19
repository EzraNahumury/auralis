"use client";

import Link from "next/link";
import { use, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { notFound } from "next/navigation";
import {
  Users,
  Wallet,
  Calendar,
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import {
  deposits,
  getGroup,
  members as allMembers,
  requestsForGroup,
} from "@/lib/mock";
import { PageHeader } from "@/components/app/page-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const group = getGroup(id);
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".anim-card"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  if (!group) notFound();

  const reqs = requestsForGroup(group.id);
  const memberSubset = allMembers.slice(0, group.membersCount);
  const rounds = Array.from({ length: group.totalRounds }, (_, i) => i + 1);

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow={`group · ${group.id}`}
        title={group.name}
        description={group.description}
        actions={
          <>
            <Button href={`/app/groups/${group.id}/withdraw`} withArrow>
              Request withdrawal
            </Button>
            <Button href="/app/groups" variant="secondary">
              All groups
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-fg-dim">
                <Wallet className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wider">
                  Treasury
                </span>
              </div>
              <p className="font-mono text-2xl text-fg">
                {group.treasuryBalance} <span className="text-fg-muted">POT</span>
              </p>
            </div>
          </GlowCard>
        </div>
        <div className="anim-card">
          <GlowCard glow="emerald" interactive={false}>
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-fg-dim">
                <Calendar className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wider">
                  Round
                </span>
              </div>
              <p className="font-mono text-2xl text-fg">
                {group.currentRound}
                <span className="text-fg-muted">/{group.totalRounds}</span>
              </p>
            </div>
          </GlowCard>
        </div>
        <div className="anim-card">
          <GlowCard glow="cyan" interactive={false}>
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-fg-dim">
                <Users className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wider">
                  Members
                </span>
              </div>
              <p className="font-mono text-2xl text-fg">{group.membersCount}</p>
            </div>
          </GlowCard>
        </div>
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2 text-fg-dim">
                <span className="text-[10px] uppercase tracking-wider">
                  Next round
                </span>
              </div>
              <p className="text-base text-fg">{group.nextRoundAt}</p>
            </div>
          </GlowCard>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Requests + Members */}
        <div className="flex flex-col gap-6">
          <div className="anim-card">
            <GlowCard glow="violet" interactive={false}>
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold text-fg">
                  Withdrawal requests
                </h3>
                <Button
                  href={`/app/groups/${group.id}/withdraw`}
                  variant="secondary"
                >
                  New request
                </Button>
              </div>
              <ul className="divide-y divide-border">
                {reqs.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/app/groups/${group.id}/requests/${r.id}`}
                      className="group flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-mono text-fg-dim">#{r.id.slice(2)}</span>
                          <span className="font-medium text-fg">{r.requester}</span>
                          <span className="text-fg-dim">·</span>
                          <span className="font-mono text-fg">{r.amount} POT</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-emerald-soft">
                            {r.prevalidation.confidence.toFixed(2)}
                          </span>
                          <Badge
                            tone={
                              r.status === "executed" || r.status === "approved"
                                ? "emerald"
                                : r.status === "auto-rejected" || r.status === "rejected"
                                  ? "neutral"
                                  : "violet"
                            }
                          >
                            {r.status}
                          </Badge>
                          <ArrowUpRight className="size-4 text-fg-dim transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                        </div>
                      </div>
                      <p className="line-clamp-1 text-xs text-fg-muted">{r.reason}</p>
                    </Link>
                  </li>
                ))}
                {reqs.length === 0 && (
                  <li className="px-6 py-8 text-center text-sm text-fg-muted">
                    No requests yet.
                  </li>
                )}
              </ul>
            </GlowCard>
          </div>

          <div className="anim-card">
            <GlowCard glow="emerald" interactive={false}>
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold text-fg">Members</h3>
                <span className="text-[11px] text-fg-dim">
                  Sorted by reputation
                </span>
              </div>
              <ul className="divide-y divide-border">
                {memberSubset.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet/30 to-emerald/20 text-sm font-medium text-fg">
                        {m.name[0]}
                      </span>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-fg">{m.name}</p>
                        <p className="font-mono text-[11px] text-fg-dim">
                          {m.address.slice(0, 6)}…{m.address.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden flex-col sm:flex">
                        <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                          Reputation
                        </p>
                        <p className="font-mono text-xs text-fg">{m.reputation}</p>
                      </div>
                      <div className="hidden flex-col sm:flex">
                        <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                          Vote weight
                        </p>
                        <p className="font-mono text-xs text-fg">{m.voteWeight}×</p>
                      </div>
                      <Badge
                        tone={m.tier === "Platinum" || m.tier === "Gold" ? "emerald" : "neutral"}
                      >
                        {m.tier}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </div>

        {/* Schedule + Deposits */}
        <div className="flex flex-col gap-6">
          <div className="anim-card">
            <GlowCard glow="cyan" interactive={false}>
              <div className="border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold text-fg">Round schedule</h3>
              </div>
              <ol className="grid grid-cols-5 gap-2 p-6">
                {rounds.map((n) => {
                  const state =
                    n < group.currentRound
                      ? "done"
                      : n === group.currentRound
                        ? "active"
                        : "future";
                  return (
                    <li
                      key={n}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center",
                        state === "done" && "border-emerald/30 bg-emerald/[0.06]",
                        state === "active" && "border-violet/40 bg-violet/[0.08]",
                        state === "future" && "border-border bg-bg/40"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider",
                          state === "done" && "text-emerald-soft",
                          state === "active" && "text-violet-soft",
                          state === "future" && "text-fg-dim"
                        )}
                      >
                        R{n}
                      </span>
                      {state === "done" && (
                        <CircleCheck className="size-4 text-emerald-soft" />
                      )}
                      {state === "active" && (
                        <span className="size-2 rounded-full bg-violet" />
                      )}
                      {state === "future" && (
                        <span className="size-2 rounded-full bg-fg-dim/50" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </GlowCard>
          </div>

          <div className="anim-card">
            <GlowCard glow="violet" interactive={false}>
              <div className="border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold text-fg">Recent deposits</h3>
              </div>
              <ul className="divide-y divide-border">
                {deposits.slice(-8).reverse().map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {d.status === "paid" ? (
                        <CircleCheck className="size-4 text-emerald-soft" />
                      ) : (
                        <CircleAlert className="size-4 text-amber" />
                      )}
                      <span className="text-fg">{d.member}</span>
                      <span className="text-fg-dim">R{d.round}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-fg-muted">
                        {d.amount} POT
                      </span>
                      <span className="text-xs text-fg-dim">{d.timestamp}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </GlowCard>
          </div>
        </div>
      </div>
    </div>
  );
}
