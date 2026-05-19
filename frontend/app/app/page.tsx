"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  Wallet,
  TrendingUp,
  Vote,
  Award,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { activity, groups, me, requests } from "@/lib/mock";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { GlowCard } from "@/components/ui/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const pendingRequests = requests.filter((r) =>
    ["fast-track", "voting"].includes(r.status)
  );

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

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow={`Welcome back, ${me.name}`}
        title="Your protocol activity at a glance."
        description="Track every group, every withdrawal, every reputation movement — all settled on Portaldot."
        actions={
          <>
            <Button href="/app/groups/new" withArrow>
              Create new group
            </Button>
            <Button href="/app/groups" variant="secondary">
              View all groups
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="anim-card">
          <StatCard
            label="Treasury balance"
            value="1,500 POT"
            hint="across 3 active groups"
            delta={{ value: "+12% MoM", positive: true }}
            glow="violet"
            icon={<Wallet className="size-4 text-violet-soft" />}
          />
        </div>
        <div className="anim-card">
          <StatCard
            label="My reputation"
            value="812"
            hint="Platinum tier · 1.18× vote weight"
            delta={{ value: "+24 last week", positive: true }}
            glow="emerald"
            icon={<TrendingUp className="size-4 text-emerald-soft" />}
          />
        </div>
        <div className="anim-card">
          <StatCard
            label="Active requests"
            value={String(pendingRequests.length)}
            hint="awaiting your review"
            glow="cyan"
            icon={<Vote className="size-4 text-cyan" />}
          />
        </div>
        <div className="anim-card">
          <StatCard
            label="Badges earned"
            value={String(me.badges.length)}
            hint="soulbound · portable"
            glow="violet"
            icon={<Award className="size-4 text-violet-soft" />}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Active requests + Groups */}
        <div className="flex flex-col gap-6">
          <section className="anim-card">
            <GlowCard glow="violet" interactive={false}>
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-violet-soft" />
                  <h3 className="text-sm font-semibold text-fg">Pending decisions</h3>
                </div>
                <Link
                  href="/app/groups"
                  className="text-xs text-fg-muted transition-colors hover:text-fg"
                >
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {pendingRequests.map((r) => {
                  const group = groups.find((g) => g.id === r.groupId);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/app/groups/${r.groupId}/requests/${r.id}`}
                        className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-fg">
                            <span>#{r.id.slice(2)}</span>
                            <span className="text-fg-dim">·</span>
                            <span>{r.requester}</span>
                            <span className="text-fg-dim">·</span>
                            <span className="font-mono">{r.amount} POT</span>
                          </div>
                          <p className="line-clamp-1 text-xs text-fg-muted">
                            {group?.name} · {r.reason}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="hidden text-[10px] uppercase tracking-wider text-fg-dim sm:inline">
                            confidence
                          </span>
                          <span className="font-mono text-xs text-emerald-soft">
                            {r.prevalidation.confidence.toFixed(2)}
                          </span>
                          <Badge
                            tone={r.status === "fast-track" ? "emerald" : "violet"}
                          >
                            {r.status}
                          </Badge>
                          <ArrowUpRight className="size-4 text-fg-dim transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {pendingRequests.length === 0 && (
                  <li className="px-6 py-8 text-center text-sm text-fg-muted">
                    No active requests. The protocol is quiet.
                  </li>
                )}
              </ul>
            </GlowCard>
          </section>

          <section className="anim-card">
            <GlowCard glow="emerald" interactive={false}>
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-sm font-semibold text-fg">Your groups</h3>
                <Link
                  href="/app/groups"
                  className="text-xs text-fg-muted transition-colors hover:text-fg"
                >
                  Manage
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {groups.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={`/app/groups/${g.id}`}
                      className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-fg">{g.name}</p>
                        <p className="text-xs text-fg-muted">{g.description}</p>
                      </div>
                      <div className="flex items-center gap-5 text-right">
                        <div className="hidden flex-col sm:flex">
                          <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                            Round
                          </p>
                          <p className="font-mono text-xs text-fg">
                            {g.currentRound}/{g.totalRounds}
                          </p>
                        </div>
                        <div className="hidden flex-col sm:flex">
                          <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                            Treasury
                          </p>
                          <p className="font-mono text-xs text-fg">
                            {g.treasuryBalance} POT
                          </p>
                        </div>
                        <ArrowUpRight className="size-4 text-fg-dim transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </GlowCard>
          </section>
        </div>

        {/* Activity feed */}
        <section className="anim-card">
          <GlowCard glow="cyan" interactive={false} className="h-full">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-fg">Recent activity</h3>
              <span className="text-[11px] uppercase tracking-wider text-fg-dim">
                Onchain
              </span>
            </div>
            <ol className="relative px-6 py-2">
              {activity.map((a, i) => (
                <li key={a.id} className="relative flex gap-4 py-4">
                  <div className="flex flex-col items-center">
                    <span className="size-2 rounded-full bg-violet shadow-[0_0_0_4px_var(--color-bg)]" />
                    {i < activity.length - 1 && (
                      <span className="mt-2 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-fg">
                      <span className="font-medium">{a.actor}</span>{" "}
                      <span className="text-fg-muted">{a.summary}</span>
                    </p>
                    <Link
                      href={a.href}
                      className="mt-1 inline-block text-[11px] text-fg-dim transition-colors hover:text-fg"
                    >
                      {a.timestamp} →
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </GlowCard>
        </section>
      </div>
    </div>
  );
}
