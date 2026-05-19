"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Award, Copy } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { me, deposits, activity } from "@/lib/mock";
import { PageHeader } from "@/components/app/page-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      gsap.fromTo(
        ".anim-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.7, ease: "expo.out" }
      );

      gsap.fromTo(
        ".rep-bar",
        { width: 0 },
        { width: `${(me.reputation / 1000) * 100}%`, duration: 1.4, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="My profile"
        title={`${me.name} · ${me.tier} tier`}
        description="Reputation is portable across every Auralis group on Portaldot. Soulbound badges and onchain history follow you."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="flex flex-col gap-6 p-7">
              <div className="flex items-center gap-4">
                <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-violet/40 to-emerald/30 text-2xl font-medium text-fg ring-2 ring-violet/30">
                  {me.name[0]}
                </span>
                <div className="flex-1">
                  <p className="text-xl font-semibold text-fg">{me.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-fg-muted">
                      {me.address.slice(0, 12)}…{me.address.slice(-6)}
                    </span>
                    <button
                      type="button"
                      aria-label="Copy address"
                      className="text-fg-dim transition-colors hover:text-fg"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-fg-dim">
                    Joined Auralis · {me.joinedAt}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-bg/40 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-fg-dim">
                    Reputation
                  </p>
                  <p className="font-mono text-3xl text-fg">{me.reputation}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div className="rep-bar h-full rounded-full bg-gradient-to-r from-violet via-cyan to-emerald" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-fg-dim">
                  <span>0</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-bg/40 p-3 text-center">
                  <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                    Vote weight
                  </dt>
                  <dd className="mt-1 font-mono text-lg text-fg">
                    {me.voteWeight}×
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-bg/40 p-3 text-center">
                  <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                    Consistency
                  </dt>
                  <dd className="mt-1 font-mono text-lg text-fg">
                    {me.depositConsistency}%
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-bg/40 p-3 text-center">
                  <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                    Active groups
                  </dt>
                  <dd className="mt-1 font-mono text-lg text-fg">
                    {me.groupsActive}
                  </dd>
                </div>
              </dl>
            </div>
          </GlowCard>
        </div>

        <div className="anim-card">
          <GlowCard glow="emerald" interactive={false} className="h-full">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-emerald-soft" />
                <h3 className="text-sm font-semibold text-fg">Soulbound badges</h3>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {me.badges.map((b) => (
                <li
                  key={b}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="grid size-9 place-items-center rounded-full ring-conic">
                      <span className="size-6 rounded-full bg-bg" />
                    </span>
                    <p className="text-sm font-medium text-fg">{b}</p>
                  </div>
                  <Badge tone="emerald">Soulbound</Badge>
                </li>
              ))}
              <li className="flex items-center justify-between gap-4 border-t border-dashed border-border px-6 py-4 text-fg-muted">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full border border-dashed border-border text-fg-dim">
                    +
                  </span>
                  <p className="text-sm">Next badge · Dispute-Free (3 months in)</p>
                </div>
                <span className="text-xs text-fg-dim">3 / 6 months</span>
              </li>
            </ul>
          </GlowCard>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-fg">Recent activity</h3>
            </div>
            <ul className="divide-y divide-border">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <p className="text-sm text-fg">
                      <span className="font-medium">{a.actor}</span>{" "}
                      <span className="text-fg-muted">{a.summary}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-fg-dim">{a.timestamp}</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlowCard>
        </div>

        <div className="anim-card">
          <GlowCard glow="cyan" interactive={false}>
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-sm font-semibold text-fg">Deposit history</h3>
            </div>
            <ul className="divide-y divide-border">
              {deposits
                .filter((d) => d.member === me.name)
                .map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-emerald" />
                      <span className="text-fg">Round {d.round}</span>
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
  );
}
