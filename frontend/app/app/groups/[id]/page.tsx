"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useChain } from "@/components/providers/chain-provider";
import { MemberRow } from "@/components/app/member-row";
import { Timeline } from "@/components/app/timeline";
import { AIVerdict } from "@/components/app/ai-verdict";
import { ReviewerVotes } from "@/components/app/reviewer-votes";
import { LiveLog } from "@/components/app/live-log";
import { shortHash } from "@/lib/chain/proof";

export default function GroupPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { steps, mode, setMode, runLive, running, proof, liveError } = useChain();
  const live = mode === "live";
  const done = steps.every((s) => s.status === "confirmed");

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".fade-in"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.8, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="flex flex-col gap-16">
      <header className="fade-in">
        <Link
          href="/app"
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Home
        </Link>
        <h1 className="mt-5 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          Arisan Tetangga RT 03
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          Small neighborhood Arisan, three contributors. Each round the pot
          rotates to a different member. The AI agents review the request
          first; the chain then enforces the verdict.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!live) setMode("live");
              runLive();
            }}
            disabled={running}
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {running ? "Running on chain…" : done ? "Run again" : "Run the round on chain"}
          </button>
          <button
            type="button"
            onClick={() => setMode(live ? "recorded" : "live")}
            className="text-[12px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            {live ? "Show recorded run" : "Use recorded run"}
          </button>
          {liveError && (
            <p className="basis-full text-[12px] text-rose">{liveError}</p>
          )}
        </div>
      </header>

      <section className="fade-in">
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-3">
          <div>
            <p className="text-[12px] text-fg-muted">Pot this round</p>
            <p className="mt-1.5 text-[28px] font-medium tabular-nums text-fg">
              300 <span className="text-[15px] text-fg-muted">POT</span>
            </p>
          </div>
          <div>
            <p className="text-[12px] text-fg-muted">Members</p>
            <p className="mt-1.5 text-[28px] font-medium tabular-nums text-fg">3</p>
            <p className="text-[11px] text-fg-dim">+ Dave receiving</p>
          </div>
          <div>
            <p className="text-[12px] text-fg-muted">Approvals needed</p>
            <p className="mt-1.5 text-[28px] font-medium tabular-nums text-fg">2 of 3</p>
            <p className="text-[11px] text-fg-dim">multisig threshold</p>
          </div>
        </div>
      </section>

      <section className="fade-in">
        <h2 className="mb-5 text-[18px] font-semibold tracking-tight text-fg">
          Members
        </h2>
        <MemberRow />
      </section>

      <section className="fade-in flex flex-col gap-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-fg-dim">
            Phase 1 — Pre-validation
          </p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-fg">
            The AI reviews the request first.
          </h2>
        </div>
        <AIVerdict />
      </section>

      <section className="fade-in flex flex-col gap-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-fg-dim">
            Phase 2 — Member votes
          </p>
          <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-fg">
            Each member&rsquo;s agent casts a weighted ballot.
          </h2>
        </div>
        <ReviewerVotes />
      </section>

      <section className="fade-in flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-fg-dim">
              Phase 3 — On chain
            </p>
            <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-fg">
              The companion script signs five transactions on Portaldot.
            </h2>
          </div>
          <a
            href="/tx-proof.json"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            Download proof
          </a>
        </div>
        <Timeline />
        <LiveLog />

        {proof && (
          <p className="text-[12px] text-fg-dim">
            Multisig{" "}
            <code
              className="tabular-nums text-fg-muted"
              style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
            >
              {shortHash(proof.participants.multisig, 8, 6)}
            </code>{" "}
            on {proof.network.chainName}.
          </p>
        )}
      </section>
    </div>
  );
}
