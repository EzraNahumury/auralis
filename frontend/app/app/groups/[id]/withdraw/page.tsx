"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useSession } from "@/components/providers/session-provider";
import { useChain } from "@/components/providers/chain-provider";
import { findGroup } from "@/lib/groups/store";
import type { GroupDef } from "@/lib/groups/types";
import { listDeposits } from "@/lib/store/deposits";
import {
  newRequestId,
  saveRequest,
  reviewerToVote,
  recordVote,
  updateRequest,
} from "@/lib/store/requests";
import {
  requestAIPrevalidation,
  requestAIVotes,
} from "@/lib/ai/client";
import {
  buildRequesterInput,
  buildReviewerBatch,
} from "@/lib/ai/context-builders";

type Category = "scheduled" | "emergency" | "other";

const CATEGORY_LABELS: Record<Category, { title: string; hint: string }> = {
  scheduled: {
    title: "Scheduled round",
    hint: "It&rsquo;s my turn this round.",
  },
  emergency: {
    title: "Emergency",
    hint: "Medical, accident, or urgent need.",
  },
  other: {
    title: "Other",
    hint: "Early payout, savings, project, etc.",
  },
};

export default function WithdrawPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useSession();
  const { balances, loadBalance } = useChain();

  const [group, setGroup] = useState<GroupDef | null>(null);
  const [amount, setAmount] = useState<number>(50);
  const [reason, setReason] = useState<string>("");
  const [category, setCategory] = useState<Category>("scheduled");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGroup(findGroup(id));
  }, [id]);

  useEffect(() => {
    if (group?.multisigAddress) loadBalance(group.multisigAddress);
  }, [group?.multisigAddress, loadBalance]);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".fade-in"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref, dependencies: [group?.id] }
  );

  if (!group) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/app/groups"
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Groups
        </Link>
        <p className="text-[14px] text-fg-muted">Loading group…</p>
      </div>
    );
  }

  if (!user || !group.members.includes(user)) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href={`/app/groups/${group.id}`}
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← {group.name}
        </Link>
        <h1 className="text-[24px] font-semibold tracking-tight text-fg">
          Only members can request a withdrawal.
        </h1>
        <p className="text-[13px] text-fg-muted">
          Sign in as one of: {group.members.join(", ")}.
        </p>
      </div>
    );
  }

  const potBalance = balances[group.multisigAddress]?.freePot;
  const canSubmit =
    amount > 0 &&
    reason.trim().length > 4 &&
    !submitting &&
    (potBalance === undefined || amount <= potBalance);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const requestId = newRequestId();
    saveRequest({
      id: requestId,
      groupId: group.id,
      requester: user,
      recipient: user,
      amountPot: amount,
      reason: reason.trim(),
      category,
      status: "ai_pending",
      aiVerdict: null,
      votes: [],
      createdAt: Date.now(),
    });

    // Build request input from REAL group state.
    const deposits = listDeposits(group.id);

    try {
      const stub = {
        id: requestId,
        groupId: group.id,
        requester: user,
        recipient: user,
        amountPot: amount,
        reason: reason.trim(),
        category,
        status: "ai_pending" as const,
        aiVerdict: null,
        votes: [],
        createdAt: Date.now(),
      };
      const verdict = await requestAIPrevalidation(
        buildRequesterInput(group, stub, deposits)
      );
      updateRequest(requestId, {
        aiVerdict: verdict,
        status:
          verdict.routing === "AUTO_REJECT"
            ? "rejected"
            : "voting",
      });

      if (verdict.routing !== "AUTO_REJECT") {
        // Fire reviewer agents in parallel.
        const batch = buildReviewerBatch(group, stub, verdict);
        const results = await requestAIVotes(batch);
        for (const res of results) {
          if (res.ok && res.vote) {
            recordVote(requestId, reviewerToVote(res.member, res.vote));
          }
        }
      }

      router.replace(`/app/groups/${group.id}/requests/${requestId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      updateRequest(requestId, { aiError: msg });
      setSubmitting(false);
    }
  };

  return (
    <div ref={ref} className="flex flex-col gap-10">
      <header className="fade-in">
        <Link
          href={`/app/groups/${group.id}`}
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← {group.name}
        </Link>
        <h1 className="mt-5 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          Request a withdrawal
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          The other members will see your reason and vote. The AI agents help
          them decide. If the threshold is met, the pot transfers to you on
          chain automatically.
        </p>
        <p className="mt-2 text-[12px] text-fg-dim">
          Current pot balance:{" "}
          {potBalance !== undefined ? (
            <span className="text-fg">{potBalance} POT</span>
          ) : (
            "loading…"
          )}
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <section className="fade-in flex flex-col gap-3">
          <label
            htmlFor="amount"
            className="text-[12px] uppercase tracking-[0.14em] text-fg-dim"
          >
            How much?
          </label>
          <div className="relative">
            <input
              id="amount"
              type="number"
              min={1}
              max={potBalance ? Math.floor(potBalance) : 10000}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value || 0))}
              className="w-full rounded-xl border border-border bg-[#141414] px-4 py-3 pr-14 text-[20px] tabular-nums text-fg outline-none transition-colors focus:border-fg-dim"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-fg-muted">
              POT
            </span>
          </div>
          {potBalance !== undefined && amount > potBalance && (
            <p className="text-[12px] text-rose">
              Pot only holds {potBalance} POT right now.
            </p>
          )}
        </section>

        <section className="fade-in flex flex-col gap-3">
          <label className="text-[12px] uppercase tracking-[0.14em] text-fg-dim">
            What for?
          </label>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => {
              const on = category === c;
              const info = CATEGORY_LABELS[c];
              return (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-all ${
                      on
                        ? "border-violet/60 bg-violet/[0.06]"
                        : "border-border bg-[#141414] hover:border-fg-dim"
                    }`}
                  >
                    <span className="text-[13px] font-medium text-fg">
                      {info.title}
                    </span>
                    <span
                      className="text-[11px] text-fg-muted"
                      dangerouslySetInnerHTML={{ __html: info.hint }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="fade-in flex flex-col gap-3">
          <label
            htmlFor="reason"
            className="text-[12px] uppercase tracking-[0.14em] text-fg-dim"
          >
            Tell the others why
          </label>
          <textarea
            id="reason"
            rows={4}
            maxLength={500}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="The more context you give, the easier it is for the others to approve. The AI agents read this too."
            className="resize-none rounded-xl border border-border bg-[#141414] px-4 py-3 text-[14px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-fg-dim"
          />
          <p className="text-[11px] text-fg-dim">
            {reason.length}/500 characters
          </p>
        </section>

        {error && (
          <p className="fade-in text-[13px] text-rose">{error}</p>
        )}

        <div className="fade-in flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[14px] font-medium text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? "Sending to AI…" : "Submit request"}
          </button>
          <Link
            href={`/app/groups/${group.id}`}
            className="text-[12px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            Cancel
          </Link>
        </div>

        <p className="fade-in text-[12px] text-fg-dim">
          Submitting runs the Requester Agent (Ollama) over your request, then
          each other member&rsquo;s Reviewer Agent drafts a vote suggestion.
          You and they still have to approve on chain.
        </p>
      </form>
    </div>
  );
}
