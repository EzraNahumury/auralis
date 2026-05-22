"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { findGroup, onGroupsChanged } from "@/lib/groups/store";
import type { GroupDef } from "@/lib/groups/types";
import {
  findRequest,
  onRequestsChanged,
  recordVote,
  updateRequest,
  type WithdrawRequest,
  type MemberVote,
} from "@/lib/store/requests";
import { appendTx, listRequestTxs, newTxId, onTxsChanged, type TxLogEntry } from "@/lib/store/txs";
import { useSession } from "@/components/providers/session-provider";
import { useChain } from "@/components/providers/chain-provider";
import {
  submitPropose,
  submitApprove,
  submitExecute,
} from "@/lib/chain/actions";
import { knownAddress } from "@/lib/session/derive";
import { AIVerdict } from "@/components/app/ai-verdict";
import { AVATARS, type MemberName } from "@/lib/avatars";
import { PROFILES } from "@/lib/profiles";
import { shortHash } from "@/lib/chain/format";

export default function RequestDetail({
  params,
}: {
  params: Promise<{ id: string; reqId: string }>;
}) {
  const { id, reqId } = use(params);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useSession();
  const { loadBalance } = useChain();

  const [group, setGroup] = useState<GroupDef | null>(null);
  const [request, setRequest] = useState<WithdrawRequest | null>(null);
  const [txs, setTxs] = useState<TxLogEntry[]>([]);
  const [pendingMember, setPendingMember] = useState<MemberName | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setGroup(findGroup(id));
    setRequest(findRequest(reqId));
    setTxs(listRequestTxs(reqId));
    const offG = onGroupsChanged(() => setGroup(findGroup(id)));
    const offR = onRequestsChanged(() => setRequest(findRequest(reqId)));
    const offT = onTxsChanged(() => setTxs(listRequestTxs(reqId)));
    return () => {
      offG();
      offR();
      offT();
    };
  }, [id, reqId]);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".fade-in"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.8, ease: "expo.out" }
      );
    },
    { scope: ref, dependencies: [request?.id] }
  );

  const onChainApproves = useMemo(
    () =>
      (request?.votes ?? []).filter(
        (v) => v.vote === "APPROVE" && !!v.txHash
      ),
    [request]
  );
  const onChainCount = onChainApproves.length;

  const rejects = useMemo(
    () => (request?.votes ?? []).filter((v) => v.vote === "REJECT"),
    [request]
  );

  if (!group || !request) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href={group ? `/app/groups/${group.id}` : "/app/groups"}
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Back
        </Link>
        <p className="text-[14px] text-fg-muted">Request not found.</p>
      </div>
    );
  }

  const requesterAvatar = AVATARS[request.requester];
  const isMember = !!user && group.members.includes(user);
  const userVote = user
    ? request.votes.find((v) => v.member === user)
    : undefined;
  const userVotedOnChain = !!(userVote && userVote.txHash);
  const wouldReachThreshold = onChainCount + 1 === group.threshold;

  const handleApproveOnChain = async (member: MemberName) => {
    if (!group || !request) return;
    setPendingMember(member);
    setActionError(null);
    try {
      // Action routing based on existing on-chain approves.
      if (onChainCount === 0) {
        // First on-chain action — propose.
        const r = await submitPropose({
          groupId: group.id,
          requestId: request.id,
          signerMember: member,
          members: group.members,
          threshold: group.threshold,
          recipientMember: request.recipient,
          amountPot: request.amountPot,
        });
        updateRequest(request.id, {
          callHash: r.callHash,
          timepointHeight: r.timepointHeight,
          timepointIndex: r.timepointIndex,
          proposalTxHash: r.txHash || undefined,
          proposalBlockNumber: r.blockNumber || undefined,
          status: group.threshold === 1 ? "executing" : "voting",
        });
        recordVote(request.id, {
          member,
          vote: "APPROVE",
          reasoning:
            "Proposed the request on chain — first multisig signature.",
          confidence: 1,
          aiSuggested: false,
          txHash: r.txHash || undefined,
          blockNumber: r.blockNumber || undefined,
          createdAt: Date.now(),
        });
        if (r.txHash) {
          appendTx({
            id: newTxId(),
            groupId: group.id,
            requestId: request.id,
            kind: "withdraw_propose",
            signer: member,
            amountPot: request.amountPot,
            txHash: r.txHash,
            blockHash: r.blockHash,
            blockNumber: r.blockNumber,
            createdAt: Date.now(),
          });
        }
      } else if (wouldReachThreshold) {
        // This approval pushes us to threshold → execute via asMulti with call data.
        const fresh = findRequest(request.id);
        if (
          !fresh ||
          !fresh.callHash ||
          fresh.timepointHeight === undefined ||
          fresh.timepointIndex === undefined
        ) {
          throw new Error("missing proposal timepoint");
        }
        updateRequest(request.id, { status: "executing" });
        const r = await submitExecute({
          groupId: group.id,
          requestId: request.id,
          signerMember: member,
          members: group.members,
          threshold: group.threshold,
          recipientMember: request.recipient,
          amountPot: request.amountPot,
          timepointHeight: fresh.timepointHeight,
          timepointIndex: fresh.timepointIndex,
        });
        updateRequest(request.id, {
          status: "completed",
          executionTxHash: r.txHash,
          executionBlockNumber: r.blockNumber,
          completedAt: Date.now(),
        });
        recordVote(request.id, {
          member,
          vote: "APPROVE",
          reasoning:
            "Final approval — threshold met, payout executed atomically.",
          confidence: 1,
          aiSuggested: false,
          txHash: r.txHash,
          blockNumber: r.blockNumber,
          createdAt: Date.now(),
        });
        appendTx({
          id: newTxId(),
          groupId: group.id,
          requestId: request.id,
          kind: "withdraw_execute",
          signer: member,
          amountPot: request.amountPot,
          txHash: r.txHash,
          blockHash: r.blockHash,
          blockNumber: r.blockNumber,
          createdAt: Date.now(),
        });
        await loadBalance(group.multisigAddress);
      } else {
        // Middle approval — keep recording approvals.
        const fresh = findRequest(request.id);
        if (
          !fresh ||
          !fresh.callHash ||
          fresh.timepointHeight === undefined ||
          fresh.timepointIndex === undefined
        ) {
          throw new Error("missing proposal timepoint");
        }
        const r = await submitApprove({
          groupId: group.id,
          requestId: request.id,
          signerMember: member,
          members: group.members,
          threshold: group.threshold,
          callHash: fresh.callHash,
          timepointHeight: fresh.timepointHeight,
          timepointIndex: fresh.timepointIndex,
        });
        recordVote(request.id, {
          member,
          vote: "APPROVE",
          reasoning: "Approved on chain.",
          confidence: 1,
          aiSuggested: false,
          txHash: r.txHash,
          blockNumber: r.blockNumber,
          createdAt: Date.now(),
        });
        appendTx({
          id: newTxId(),
          groupId: group.id,
          requestId: request.id,
          kind: "withdraw_approve",
          signer: member,
          amountPot: request.amountPot,
          txHash: r.txHash,
          blockHash: r.blockHash,
          blockNumber: r.blockNumber,
          createdAt: Date.now(),
        });
      }
      // Refresh signer's own balance after every action; also recipient's
      // balance + the pot if we just executed the payout.
      const addrsToRefresh = new Set<string>([knownAddress(member)]);
      addrsToRefresh.add(group.multisigAddress);
      if (request.recipient !== member) {
        addrsToRefresh.add(knownAddress(request.recipient));
      }
      await Promise.all(
        Array.from(addrsToRefresh).map((a) => loadBalance(a))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
      updateRequest(request.id, { aiError: msg });
    } finally {
      setPendingMember(null);
    }
  };

  const handleReject = (member: MemberName) => {
    if (!request) return;
    recordVote(request.id, {
      member,
      vote: "REJECT",
      reasoning: "Cast reject on this request.",
      confidence: 1,
      aiSuggested: false,
      createdAt: Date.now(),
    });
    // Check if request should be marked rejected.
    const fresh = findRequest(request.id);
    if (!fresh) return;
    const possibleApproves = group.members.length - fresh.votes.filter(
      (v) => v.vote === "REJECT"
    ).length;
    if (possibleApproves < group.threshold) {
      updateRequest(request.id, { status: "rejected" });
    }
  };

  const isCompleted = request.status === "completed";
  const isRejected = request.status === "rejected";
  const statusBadge = (() => {
    if (request.status === "completed")
      return { cls: "border-emerald/30 bg-emerald/[0.05] text-emerald-soft", dot: "bg-emerald", label: "Paid" };
    if (request.status === "rejected")
      return { cls: "border-rose/40 bg-rose/[0.05] text-rose", dot: "bg-rose", label: "Rejected" };
    if (request.status === "executing")
      return { cls: "border-amber/30 bg-amber/[0.05] text-amber", dot: "bg-amber", label: "Executing" };
    if (request.status === "voting")
      return { cls: "border-amber/30 bg-amber/[0.05] text-amber", dot: "bg-amber", label: "Voting" };
    if (request.status === "ai_pending")
      return { cls: "border-violet/30 bg-violet/[0.05] text-violet-soft", dot: "bg-violet", label: "AI reviewing" };
    return { cls: "border-rose/40 bg-rose/[0.05] text-rose", dot: "bg-rose", label: "Failed" };
  })();

  return (
    <div ref={ref} className="flex flex-col gap-14">
      <header className="fade-in">
        <Link
          href={`/app/groups/${group.id}`}
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← {group.name}
        </Link>
        <div className="mt-5 flex items-start gap-4">
          <span
            className="grid size-12 place-items-center rounded-full text-[26px] shadow-[0_6px_24px_rgba(0,0,0,0.45)]"
            style={{ background: requesterAvatar.bg }}
            aria-label={request.requester}
          >
            {requesterAvatar.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-fg sm:text-[34px]">
              {request.requester} wants {request.amountPot} POT
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
              &ldquo;{request.reason}&rdquo;
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${statusBadge.cls}`}
              >
                <span className={`size-1.5 rounded-full ${statusBadge.dot}`} />
                {statusBadge.label}
              </span>
              <span className="text-[11px] text-fg-dim">
                {onChainCount} of {group.threshold} approvals on chain
              </span>
              {rejects.length > 0 && (
                <span className="text-[11px] text-rose">
                  {rejects.length} rejected
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="fade-in">
        <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-fg-dim">
          Phase 1 — AI pre-validation
        </p>
        <AIVerdict
          verdict={request.aiVerdict}
          loading={request.status === "ai_pending"}
          error={request.aiError}
        />
      </section>

      <section className="fade-in">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-fg-dim">
              Phase 2 — Member votes
            </p>
            <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-fg">
              {group.threshold}-of-{group.members.length} approvals needed.
            </h2>
          </div>
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {group.members.map((m) => {
            const avatar = AVATARS[m];
            const vote = request.votes.find((v) => v.member === m);
            const profile = PROFILES[m];
            const isCurrent = user === m;
            const isRequester = m === request.requester;
            const isPending = pendingMember === m;

            const showApproveBtn =
              isCurrent &&
              !userVotedOnChain &&
              !isCompleted &&
              !isRejected;

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
                      className={`grid size-10 place-items-center rounded-full text-[20px] shadow-[0_4px_18px_rgba(0,0,0,0.35)] ${
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
                        {isRequester && (
                          <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-amber">
                            requester
                          </span>
                        )}
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
                    {vote ? (
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
                          />
                          {vote.vote}
                        </span>
                        <p className="mt-1 text-[10px] text-fg-dim">
                          {vote.txHash
                            ? `chain · ${shortHash(vote.txHash, 6, 4)}`
                            : vote.aiSuggested
                              ? "AI suggestion"
                              : "Recorded"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-fg-dim">
                        Waiting…
                      </span>
                    )}
                    {showApproveBtn && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApproveOnChain(m)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald/[0.12] px-4 py-1.5 text-[11px] font-medium text-emerald-soft transition-colors hover:bg-emerald/[0.18] disabled:opacity-50"
                        >
                          {isPending
                            ? "Signing…"
                            : onChainCount === 0
                              ? "Propose on chain"
                              : wouldReachThreshold
                                ? "Approve & execute"
                                : "Approve on chain"}
                        </button>
                        {!isRequester && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleReject(m)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose/[0.06] px-4 py-1.5 text-[11px] font-medium text-rose transition-colors hover:bg-rose/[0.12] disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {vote && (
                  <p className="ml-13 max-w-2xl text-[13px] leading-relaxed text-fg-muted sm:ml-13">
                    &ldquo;{vote.reasoning}&rdquo;
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {actionError && (
          <p className="mt-3 text-[12px] text-rose">{actionError}</p>
        )}

        {!isMember && (
          <p className="mt-3 text-[12px] text-fg-dim">
            You can&rsquo;t vote on this — only group members
            ({group.members.join(", ")}) can.
          </p>
        )}
      </section>

      {txs.length > 0 && (
        <section className="fade-in">
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-fg-dim">
            Phase 3 — On-chain history
          </p>
          <ul className="divide-y divide-border border-y border-border">
            {txs.map((t) => {
              const av = AVATARS[t.signer];
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 px-2 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-8 place-items-center rounded-full text-[16px]"
                      style={{ background: av.bg }}
                    >
                      {av.emoji}
                    </span>
                    <div>
                      <p className="text-[13px] text-fg">
                        {t.signer}{" "}
                        <span className="text-fg-muted">
                          {kindLabel(t.kind)}
                        </span>
                      </p>
                      <p className="text-[11px] text-fg-dim">
                        block #{t.blockNumber}
                      </p>
                    </div>
                  </div>
                  <code
                    className="text-[11px] text-fg-muted"
                    style={{
                      fontFamily:
                        "var(--font-geist-mono), ui-monospace, monospace",
                    }}
                  >
                    {shortHash(t.txHash, 8, 6)}
                  </code>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {isCompleted && request.executionTxHash && (
        <section className="fade-in rounded-2xl border border-emerald/30 bg-emerald/[0.04] px-5 py-4">
          <p className="text-[13px] text-emerald-soft">
            ✓ {request.amountPot} POT released to {request.recipient}. Final
            tx{" "}
            <code
              style={{
                fontFamily:
                  "var(--font-geist-mono), ui-monospace, monospace",
              }}
            >
              {shortHash(request.executionTxHash, 10, 8)}
            </code>{" "}
            in block #{request.executionBlockNumber}.
          </p>
        </section>
      )}
    </div>
  );
}

function kindLabel(k: string): string {
  if (k === "withdraw_propose") return "proposed the withdrawal";
  if (k === "withdraw_approve") return "approved on chain";
  if (k === "withdraw_execute") return "executed the payout";
  if (k === "deposit") return "deposited";
  return k;
}
