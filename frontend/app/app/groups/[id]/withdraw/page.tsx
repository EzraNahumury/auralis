"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useChain } from "@/components/providers/chain-provider";
import { AVATARS } from "@/lib/avatars";

const inputBase =
  "w-full rounded-xl border border-border bg-transparent px-4 py-3 text-[14px] text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-fg-muted";

export default function SendPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { mode, setMode, runLive, running, liveError } = useChain();
  const [amount, setAmount] = useState("300");
  const [note, setNote] = useState("Round 1 recipient — Dave.");

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".fade-in"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "live") setMode("live");
    runLive();
  };

  return (
    <div ref={ref} className="flex flex-col gap-12">
      <header className="fade-in">
        <Link
          href="/app/groups/g_rt03"
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Group
        </Link>
        <h1 className="mt-5 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          Send the pot to Dave
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          You&rsquo;re proposing the payout for Round 1. Bob still needs to
          approve before the pot moves — that&rsquo;s how the 2 of 3 rule keeps
          things honest.
        </p>
      </header>

      <form onSubmit={submit} className="fade-in flex flex-col gap-7">
        <div>
          <label className="block text-[13px] text-fg-muted">Recipient</label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-[#141414] px-4 py-3.5">
            <span
              className="grid size-10 place-items-center rounded-full text-[20px]"
              style={{ background: AVATARS.Dave.bg }}
              aria-label="Dave"
            >
              {AVATARS.Dave.emoji}
            </span>
            <div className="flex-1">
              <p className="text-[14px] text-fg">Dave</p>
              <p className="text-[12px] text-fg-dim">Round 1 recipient</p>
            </div>
            <span className="text-[11px] text-fg-dim">Locked for this demo</span>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-[13px] text-fg-muted">
            Amount
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputBase + " tabular-nums text-[18px]"}
            />
            <span className="shrink-0 text-[14px] text-fg-muted">POT</span>
          </div>
          <p className="mt-1.5 text-[12px] text-fg-dim">
            Pot collected this round: 300 POT
          </p>
        </div>

        <div>
          <label htmlFor="note" className="block text-[13px] text-fg-muted">
            Reason
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={inputBase + " mt-2 resize-none"}
          />
          <p className="mt-1.5 text-[12px] text-fg-dim">
            A short reason goes with the proposal so reviewers know what
            they&rsquo;re approving.
          </p>
        </div>

        {liveError && (
          <p className="text-[13px] text-rose">
            {liveError}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={running}
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[14px] font-medium text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {running ? "Broadcasting…" : "Propose payout"}
          </button>
          <Link
            href="/app/groups/g_rt03"
            className="text-[12px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            Cancel
          </Link>
        </div>
      </form>

      <section className="fade-in text-[13px] leading-relaxed text-fg-muted">
        <p>
          When you press <span className="text-fg">Propose payout</span>, the
          app sends five transactions in order: three deposits (Alice, Bob,
          Charlie), then your proposal, then Bob&rsquo;s approval. Bob&rsquo;s
          approval is what releases the pot.
        </p>
      </section>
    </div>
  );
}
