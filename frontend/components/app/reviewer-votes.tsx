"use client";

import { useChain } from "@/components/providers/chain-provider";
import { AVATARS } from "@/lib/avatars";

export function ReviewerVotes() {
  const { reviewerVotes, aiPhase } = useChain();
  const approves = reviewerVotes.filter((v) => v.vote === "APPROVE").length;
  const total = reviewerVotes.length;
  const pending = aiPhase === "reviewers";

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold tracking-tight text-fg">
          Reviewer Agents
        </h2>
        <p className="text-[12px] text-fg-muted">
          {pending ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-violet/50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-violet" />
              </span>
              <span>Polling each member&rsquo;s agent…</span>
            </span>
          ) : (
            <>
              <span className="text-emerald-soft">{approves}</span>
              <span className="mx-1 text-fg-dim">/</span>
              <span className="text-fg">{total}</span>
              <span className="ml-1.5">approved</span>
            </>
          )}
        </p>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {reviewerVotes.map((vote) => {
          const avatar = AVATARS[vote.member];
          const isPending = vote.vote === "PENDING";
          return (
            <li
              key={vote.member}
              className="group flex flex-col gap-3 px-2 py-5 transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-full text-[18px] shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.05]"
                    style={{ background: avatar.bg }}
                    aria-label={vote.member}
                  >
                    {avatar.emoji}
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-fg">
                      {vote.member}
                    </p>
                    <p className="text-[11px] text-fg-muted">
                      {vote.policy} · {vote.weight.toFixed(2)}× weight
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                      vote.vote === "APPROVE"
                        ? "border-emerald/30 bg-emerald/[0.05] text-emerald-soft"
                        : vote.vote === "REJECT"
                          ? "border-rose/40 bg-rose/[0.05] text-rose"
                          : "border-violet/30 bg-violet/[0.05] text-violet-soft"
                    }`}
                  >
                    {isPending ? (
                      <>
                        <span className="relative inline-flex size-1.5">
                          <span className="absolute inset-0 animate-ping rounded-full bg-violet/50" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-violet" />
                        </span>
                        Thinking
                      </>
                    ) : (
                      <>
                        <span
                          className={`size-1.5 rounded-full ${
                            vote.vote === "APPROVE" ? "bg-emerald" : "bg-rose"
                          }`}
                          aria-hidden
                        />
                        {vote.vote}
                      </>
                    )}
                  </span>
                  {!isPending && (
                    <p className="mt-1 text-[11px] text-fg-dim">
                      confidence {vote.confidence.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <p
                className={`ml-12 max-w-2xl text-[13px] leading-relaxed ${
                  isPending ? "text-fg-dim italic" : "text-fg-muted"
                }`}
              >
                {isPending ? vote.reasoning : `“${vote.reasoning}”`}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
