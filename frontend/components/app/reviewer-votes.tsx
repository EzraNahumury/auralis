"use client";

import type { MemberVote } from "@/lib/store/requests";
import type { MemberName } from "@/lib/avatars";
import { AVATARS } from "@/lib/avatars";
import { PROFILES } from "@/lib/profiles";

interface Props {
  reviewers: MemberName[];
  votes: MemberVote[];
  loading?: boolean;
  threshold: number;
  emptyHint?: string;
  currentUser?: MemberName | null;
  onVote?: (member: MemberName, vote: "APPROVE" | "REJECT") => void;
  pendingMember?: MemberName | null;
}

export function ReviewerVotes({
  reviewers,
  votes,
  loading,
  threshold,
  emptyHint,
  currentUser,
  onVote,
  pendingMember,
}: Props) {
  const approves = votes.filter((v) => v.vote === "APPROVE").length;
  const rejects = votes.filter((v) => v.vote === "REJECT").length;

  if (reviewers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-[#141414] px-5 py-6">
        <p className="text-[13px] text-fg-muted">
          {emptyHint ?? "No reviewers yet."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold tracking-tight text-fg">
          Member votes
        </h2>
        <p className="text-[12px] text-fg-muted">
          {loading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-violet/50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-violet" />
              </span>
              <span>AI agents drafting suggestions…</span>
            </span>
          ) : (
            <>
              <span className="text-emerald-soft">{approves}</span>
              <span className="mx-1 text-fg-dim">approve</span>
              <span className="mx-2 text-fg-dim">·</span>
              <span className="text-rose">{rejects}</span>
              <span className="mx-1 text-fg-dim">reject</span>
              <span className="mx-2 text-fg-dim">·</span>
              <span className="text-fg-muted">threshold {threshold}</span>
            </>
          )}
        </p>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {reviewers.map((m) => {
          const avatar = AVATARS[m];
          const vote = votes.find((v) => v.member === m);
          const profile = PROFILES[m];
          const isCurrent = currentUser === m;
          const isPending = pendingMember === m;

          return (
            <li
              key={m}
              className={`group flex flex-col gap-3 px-2 py-5 transition-colors hover:bg-white/[0.02] ${
                isCurrent ? "bg-violet/[0.03]" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-9 place-items-center rounded-full text-[18px] shadow-[0_4px_18px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.05] ${
                      isCurrent
                        ? "shadow-[0_0_0_2px_rgba(145,129,245,0.45),0_4px_18px_rgba(0,0,0,0.35)]"
                        : ""
                    }`}
                    style={{ background: avatar.bg }}
                    aria-label={m}
                  >
                    {avatar.emoji}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-[14px] font-medium text-fg">
                      {m}
                      {isCurrent && (
                        <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-violet-soft">
                          you
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-fg-muted">
                      {profile.policy} · {profile.voteWeight.toFixed(2)}× weight
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  {!vote && loading && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-violet-soft">
                      <span className="relative inline-flex size-1.5">
                        <span className="absolute inset-0 animate-ping rounded-full bg-violet/50" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-violet" />
                      </span>
                      Thinking
                    </span>
                  )}
                  {vote && (
                    <div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                          vote.vote === "APPROVE"
                            ? "border-emerald/30 bg-emerald/[0.05] text-emerald-soft"
                            : "border-rose/40 bg-rose/[0.05] text-rose"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            vote.vote === "APPROVE" ? "bg-emerald" : "bg-rose"
                          }`}
                          aria-hidden
                        />
                        {vote.vote}
                      </span>
                      <p className="mt-1 text-[10px] text-fg-dim">
                        {vote.aiSuggested ? "AI suggestion" : "Cast on chain"}
                      </p>
                    </div>
                  )}
                  {isCurrent && onVote && !vote && (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onVote(m, "APPROVE")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald/[0.08] px-3 py-1.5 text-[11px] font-medium text-emerald-soft transition-colors hover:bg-emerald/[0.14] disabled:opacity-50"
                      >
                        {isPending ? "Signing…" : "Approve on chain"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onVote(m, "REJECT")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose/[0.06] px-3 py-1.5 text-[11px] font-medium text-rose transition-colors hover:bg-rose/[0.12] disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {vote && (
                <p className="ml-12 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
                  &ldquo;{vote.reasoning}&rdquo;
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
