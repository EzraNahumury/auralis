"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useChain } from "@/components/providers/chain-provider";
import { shortHash } from "@/lib/chain/proof";
import { AVATARS, type MemberName } from "@/lib/avatars";

export default function RequestPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { steps, proof } = useChain();

  const step4 = steps.find((s) => s.step === 4);
  const step5 = steps.find((s) => s.step === 5);
  const proposed = step4?.status === "confirmed";
  const released = step5?.status === "confirmed";
  const failed = step4?.status === "failed" || step5?.status === "failed";

  const phaseLine = failed
    ? "Something went wrong."
    : released
      ? "Pot delivered to Dave."
      : proposed
        ? "Waiting for the second approval."
        : "Waiting for the first proposal.";

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

  return (
    <div ref={ref} className="flex flex-col gap-14">
      <header className="fade-in">
        <Link
          href="/app/groups/g_rt03"
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Group
        </Link>
        <h1 className="mt-5 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          Payout to Dave
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          {phaseLine} Once two of the three members have signed, the pot moves
          automatically.
        </p>
      </header>

      <section className="fade-in grid gap-y-6 gap-x-10 sm:grid-cols-3">
        <div>
          <p className="text-[12px] text-fg-muted">Amount</p>
          <p className="mt-1.5 text-[24px] font-medium tabular-nums text-fg">
            300 <span className="text-[14px] text-fg-muted">POT</span>
          </p>
        </div>
        <div>
          <p className="text-[12px] text-fg-muted">From</p>
          <p className="mt-1.5 text-[16px] text-fg">Group multisig</p>
          {proof && (
            <code
              className="mt-1 block break-all text-[11px] text-fg-dim"
              style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
            >
              {shortHash(proof.participants.multisig, 8, 6)}
            </code>
          )}
        </div>
        <div>
          <p className="text-[12px] text-fg-muted">To</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="grid size-8 place-items-center rounded-full text-[16px]"
              style={{ background: AVATARS.Dave.bg }}
              aria-label="Dave"
            >
              {AVATARS.Dave.emoji}
            </span>
            <p className="text-[16px] text-fg">Dave</p>
          </div>
        </div>
      </section>

      <section className="fade-in">
        <h2 className="mb-5 text-[18px] font-semibold tracking-tight text-fg">
          Approvals
        </h2>

        <ol className="space-y-3">
          <ApprovalRow
            person="Alice"
            label="Proposed the payout"
            txHash={step4?.txHash}
            blockNumber={step4?.blockNumber}
            status={step4?.status}
          />
          <ApprovalRow
            person="Bob"
            label="Approved. The pot was released."
            txHash={step5?.txHash}
            blockNumber={step5?.blockNumber}
            status={step5?.status}
          />
          <ApprovalRow
            person="Charlie"
            label={
              released
                ? "Did not need to approve. Quorum was already met."
                : "Optional. The pot moves on the second signature."
            }
            status="pending"
            grayed
          />
        </ol>
      </section>
    </div>
  );
}

function ApprovalRow({
  person,
  label,
  txHash,
  blockNumber,
  status,
  grayed,
}: {
  person: MemberName;
  label: string;
  txHash?: string;
  blockNumber?: number;
  status?: string;
  grayed?: boolean;
}) {
  const explorer = txHash && txHash.startsWith("0x")
    ? `https://drip-node-production.up.railway.app/?#/explorer/query/${txHash}`
    : null;

  const avatar = AVATARS[person];

  const phase =
    status === "confirmed"
      ? "Signed"
      : status === "inflight"
        ? "Signing…"
        : status === "failed"
          ? "Failed"
          : "Not yet";

  const phaseColor =
    status === "confirmed"
      ? "text-emerald-soft"
      : status === "inflight"
        ? "text-amber"
        : status === "failed"
          ? "text-rose"
          : "text-fg-dim";

  return (
    <li
      className={`group flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-[#141414] px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] ${
        grayed ? "opacity-60" : ""
      }`}
    >
      <span
        className="grid size-10 place-items-center rounded-full text-[20px] shadow-[0_4px_18px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-[1.05]"
        style={{ background: avatar.bg }}
        aria-label={person}
      >
        {avatar.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-fg">{person}</p>
        <p className="text-[12px] text-fg-muted">{label}</p>
      </div>
      <div className="flex items-center gap-3 text-[12px]">
        {txHash && (
          <a
            href={explorer ?? "#"}
            target={explorer ? "_blank" : undefined}
            rel={explorer ? "noreferrer" : undefined}
            className="tabular-nums text-fg-muted underline decoration-fg-dim underline-offset-4 hover:text-fg"
            style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
          >
            {shortHash(txHash, 6, 4)}
          </a>
        )}
        {blockNumber ? (
          <span
            className="tabular-nums text-fg-dim"
            style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
          >
            #{blockNumber}
          </span>
        ) : null}
        <span className={phaseColor}>{phase}</span>
      </div>
    </li>
  );
}
