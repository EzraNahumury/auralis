"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { CircleCheck, Sparkles } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { PageHeader } from "@/components/app/page-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const inputClass =
  "w-full rounded-2xl border border-border bg-bg/40 px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-violet/50 focus:bg-bg/60";
const labelClass =
  "flex flex-col gap-2 text-xs uppercase tracking-wider text-fg-dim";

export default function NewGroupPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("100");
  const [period, setPeriod] = useState("30");
  const [members, setMembers] = useState("5");

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

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="New group"
        title="Spin up a fresh Arisan in three steps."
        description="Deploys a fresh ArisanGroup ink! contract on Portaldot. POT pays the deployment gas."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="anim-card">
          <GlowCard glow="violet" interactive={false}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStep(n as 1 | 2 | 3)}
                    className={
                      step === n
                        ? "grid size-8 place-items-center rounded-full border border-violet/40 bg-violet/15 text-sm font-medium text-violet-soft"
                        : "grid size-8 place-items-center rounded-full border border-border bg-bg/40 text-sm text-fg-dim"
                    }
                  >
                    {n}
                  </button>
                ))}
                <span className="text-sm text-fg-muted">
                  {step === 1 && "Basics"}
                  {step === 2 && "Cadence"}
                  {step === 3 && "Review & deploy"}
                </span>
              </div>
              <span className="font-mono text-[11px] text-fg-dim">
                contracts/arisan_group
              </span>
            </div>

            <div className="space-y-6 p-6">
              {step === 1 && (
                <>
                  <label className={labelClass}>
                    Group name
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Arisan Tetangga RT 03"
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Description
                    <textarea
                      rows={3}
                      placeholder="Monthly neighborhood pot · Kebayoran Baru"
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Member capacity
                    <input
                      type="number"
                      value={members}
                      onChange={(e) => setMembers(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </>
              )}

              {step === 2 && (
                <>
                  <label className={labelClass}>
                    Contribution per round (POT)
                    <input
                      type="number"
                      value={contribution}
                      onChange={(e) => setContribution(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    Round period (days)
                    <input
                      type="number"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <div className="rounded-2xl border border-border bg-bg/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-fg-dim">
                      Auto rules
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-fg-muted">
                      <li className="flex items-center gap-2">
                        <CircleCheck className="size-4 text-emerald-soft" />
                        Time-bound voting · 24h
                      </li>
                      <li className="flex items-center gap-2">
                        <CircleCheck className="size-4 text-emerald-soft" />
                        Hybrid AI approval at ≥ 85% confidence
                      </li>
                      <li className="flex items-center gap-2">
                        <CircleCheck className="size-4 text-emerald-soft" />
                        Reputation-weighted votes
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-bg/40 p-5">
                    <p className="text-xs uppercase tracking-wider text-fg-dim">
                      Summary
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-fg-dim">Name</dt>
                        <dd className="text-fg">{name || "Untitled group"}</dd>
                      </div>
                      <div>
                        <dt className="text-fg-dim">Members</dt>
                        <dd className="text-fg">{members}</dd>
                      </div>
                      <div>
                        <dt className="text-fg-dim">Contribution</dt>
                        <dd className="font-mono text-fg">{contribution} POT</dd>
                      </div>
                      <div>
                        <dt className="text-fg-dim">Round period</dt>
                        <dd className="text-fg">{period} days</dd>
                      </div>
                      <div>
                        <dt className="text-fg-dim">Pot per round</dt>
                        <dd className="font-mono text-fg">
                          {Number(contribution) * Number(members) || 0} POT
                        </dd>
                      </div>
                      <div>
                        <dt className="text-fg-dim">Network</dt>
                        <dd className="text-fg">Portaldot</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-amber/20 bg-amber/[0.05] p-4 text-xs text-amber">
                    <Sparkles className="size-4" />
                    <span>
                      MVP demo — deployment is mocked. Production deploy spends real POT.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                  disabled={step === 1}
                  className="text-sm text-fg-muted transition-colors hover:text-fg disabled:opacity-30"
                >
                  ← Back
                </button>
                {step < 3 ? (
                  <Button
                    href="#"
                    withArrow
                    className="cursor-pointer"
                    variant="primary"
                  >
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setStep((s) => ((s + 1) as 1 | 2 | 3));
                      }}
                    >
                      Next step
                    </span>
                  </Button>
                ) : (
                  <Button href="/app/groups" variant="primary" withArrow>
                    Deploy on Portaldot
                  </Button>
                )}
              </div>
            </div>
          </GlowCard>
        </div>

        <div className="anim-card">
          <GlowCard glow="emerald" interactive={false} className="h-full">
            <div className="flex h-full flex-col gap-5 p-7">
              <div className="flex items-center gap-2">
                <Badge tone="emerald">Preview</Badge>
              </div>
              <h3 className="text-lg font-semibold text-fg">
                {name || "Arisan Tetangga RT 03"}
              </h3>
              <p className="text-sm text-fg-muted">
                {members} members · {contribution} POT every {period} days
              </p>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border bg-bg/40 p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                    Pot per round
                  </dt>
                  <dd className="mt-1 font-mono text-fg">
                    {Number(contribution) * Number(members) || 0} POT
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-bg/40 p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                    Total raised
                  </dt>
                  <dd className="mt-1 font-mono text-fg">
                    {Number(contribution) * Number(members) * Number(members) || 0}{" "}
                    POT
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-bg/40 p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                    Duration
                  </dt>
                  <dd className="mt-1 text-fg">
                    {Number(period) * Number(members)} days
                  </dd>
                </div>
                <div className="rounded-xl border border-border bg-bg/40 p-3">
                  <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                    AI quorum
                  </dt>
                  <dd className="mt-1 text-fg">60%</dd>
                </div>
              </dl>

              <div className="mt-auto rounded-2xl border border-border bg-bg/40 p-4 text-xs text-fg-dim">
                <p>Gas cost estimate</p>
                <p className="mt-1 font-mono text-fg">~ 0.42 POT</p>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
