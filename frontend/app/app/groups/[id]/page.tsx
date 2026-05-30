"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { findGroup, onGroupsChanged } from "@/lib/groups/store";
import type { GroupDef } from "@/lib/groups/types";
import {
  listDeposits,
  onDepositsChanged,
  saveDeposit,
  updateDeposit,
  depositIdFor,
  type Deposit,
} from "@/lib/store/deposits";
import {
  listRequests,
  onRequestsChanged,
  type WithdrawRequest,
} from "@/lib/store/requests";
import { appendTx, newTxId } from "@/lib/store/txs";
import { useSession } from "@/components/providers/session-provider";
import { useChain } from "@/components/providers/chain-provider";
import { knownAddress } from "@/lib/session/derive";
import { submitDeposit } from "@/lib/chain/actions";
import { AnimatedNumber } from "@/components/app/animated-number";
import { AVATARS, type MemberName } from "@/lib/avatars";
import { shortAddress } from "@/lib/chain/format";
import { ArrowRight, Plus } from "lucide-react";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useSession();
  const { balances, loadBalance } = useChain();

  const [group, setGroup] = useState<GroupDef | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [depositingMember, setDepositingMember] = useState<MemberName | null>(
    null
  );
  const [depositError, setDepositError] = useState<string | null>(null);

  useEffect(() => {
    setGroup(findGroup(id));
    setLoaded(true);
    setDeposits(listDeposits(id));
    setRequests(listRequests(id));
    const offG = onGroupsChanged(() => setGroup(findGroup(id)));
    const offD = onDepositsChanged(() => setDeposits(listDeposits(id)));
    const offR = onRequestsChanged(() => setRequests(listRequests(id)));
    return () => {
      offG();
      offD();
      offR();
    };
  }, [id]);

  useEffect(() => {
    if (group?.multisigAddress) {
      loadBalance(group.multisigAddress);
    }
  }, [group?.multisigAddress, loadBalance]);

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
    { scope: ref, dependencies: [group?.id] }
  );

  const currentRoundDeposits = useMemo(() => {
    if (!group) return new Map<MemberName, Deposit>();
    const map = new Map<MemberName, Deposit>();
    for (const m of group.members) {
      const d = deposits.find(
        (x) => x.id === depositIdFor(group.id, m, group.currentRound)
      );
      if (d) map.set(m, d);
    }
    return map;
  }, [deposits, group]);

  const confirmedCount = useMemo(
    () =>
      Array.from(currentRoundDeposits.values()).filter(
        (d) => d.status === "confirmed"
      ).length,
    [currentRoundDeposits]
  );

  const openRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === "ai_pending" ||
          r.status === "voting" ||
          r.status === "executing"
      ),
    [requests]
  );
  const settledRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === "completed" ||
          r.status === "approved" ||
          r.status === "rejected" ||
          r.status === "failed"
      ),
    [requests]
  );

  const totalClaimed = useMemo(
    () =>
      requests
        .filter((r) => r.status === "completed" && !!r.claimedAt)
        .reduce((sum, r) => sum + r.amountPot, 0),
    [requests]
  );

  if (loaded && !group) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/app/groups"
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Groups
        </Link>
        <h1 className="text-[28px] font-semibold tracking-tight text-fg">
          Group not found.
        </h1>
        <p className="text-[14px] text-fg-muted">
          The group <code className="text-fg">{id}</code> isn&rsquo;t in your
          local registry.
        </p>
        <div>
          <Link
            href="/app/groups"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-bg"
          >
            Back to groups
          </Link>
        </div>
      </div>
    );
  }
  if (!group) return null;

  const isMember = !!user && group.members.includes(user);
  const expectedPot = group.contributionPot * group.members.length;

  // Compute pot balance from this group's local records rather than the
  // on-chain multisig balance. Multiple groups can share the same multisig
  // address (same members + threshold), so the chain balance is unreliable.
  const totalDeposited = deposits
    .filter((d) => d.status === "confirmed")
    .reduce((sum, d) => sum + d.amountPot, 0);
  const displayBalance = Math.max(0, totalDeposited - totalClaimed);

  const onDeposit = async (member: MemberName) => {
    if (!group) return;
    setDepositingMember(member);
    setDepositError(null);
    const dId = depositIdFor(group.id, member, group.currentRound);
    saveDeposit({
      id: dId,
      groupId: group.id,
      member,
      amountPot: group.contributionPot,
      status: "submitting",
      createdAt: Date.now(),
    });
    try {
      const r = await submitDeposit({
        groupId: group.id,
        member,
        multisigAddress: group.multisigAddress,
        amountPot: group.contributionPot,
      });
      updateDeposit(dId, {
        status: "confirmed",
        txHash: r.txHash,
        blockHash: r.blockHash,
        blockNumber: r.blockNumber,
        confirmedAt: Date.now(),
      });
      appendTx({
        id: newTxId(),
        groupId: group.id,
        kind: "deposit",
        signer: member,
        amountPot: group.contributionPot,
        txHash: r.txHash,
        blockHash: r.blockHash,
        blockNumber: r.blockNumber,
        createdAt: Date.now(),
      });
      // Refresh both pot AND the depositor's own balance.
      await Promise.all([
        loadBalance(group.multisigAddress),
        loadBalance(knownAddress(member)),
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateDeposit(dId, { status: "failed", error: msg });
      setDepositError(msg);
    } finally {
      setDepositingMember(null);
    }
  };

  return (
    <div ref={ref} className="flex flex-col gap-14">
      <header className="fade-in">
        <Link
          href="/app/groups"
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Groups
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isMember && (
            <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-violet-soft">
              You&rsquo;re in
            </span>
          )}
          <span className="text-[12px] text-fg-muted">
            Round {group.currentRound} of {group.totalRounds}
          </span>
        </div>
        <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          {group.name}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          {group.description}
        </p>
        <p className="mt-2 text-[12px] text-fg-dim">
          Founded by {group.founder} ·{" "}
          <code
            className="text-fg-muted"
            style={{
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            }}
          >
            multisig {shortAddress(group.multisigAddress)}
          </code>
        </p>
      </header>

      <section className="fade-in">
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-3">
          <div>
            <p className="text-[12px] text-fg-muted">Pot balance (live)</p>
            <p className="mt-1.5 text-[36px] font-medium leading-none tabular-nums text-fg sm:text-[42px]">
              <AnimatedNumber value={displayBalance} duration={900} />
              <span className="ml-1.5 text-[16px] text-fg-muted">POT</span>
            </p>
            <p className="text-[11px] text-fg-dim">
              {expectedPot} POT expected this round
            </p>
          </div>
          <div>
            <p className="text-[12px] text-fg-muted">Deposits this round</p>
            <p className="mt-1.5 text-[36px] font-medium leading-none tabular-nums text-fg sm:text-[42px]">
              <AnimatedNumber value={confirmedCount} duration={700} />
              <span className="text-[18px] text-fg-muted">
                {" / "}
                {group.members.length}
              </span>
            </p>
            <p className="text-[11px] text-fg-dim">members deposited</p>
          </div>
          <div>
            <p className="text-[12px] text-fg-muted">Approvals needed</p>
            <p className="mt-1.5 text-[36px] font-medium leading-none tabular-nums text-fg sm:text-[42px]">
              {group.threshold}
              <span className="text-[18px] text-fg-muted">
                {" of "}
                {group.members.length}
              </span>
            </p>
            <p className="text-[11px] text-fg-dim">multisig threshold</p>
          </div>
        </div>
      </section>

      <section className="fade-in">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-fg">
            Members &amp; deposits — round {group.currentRound}
          </h2>
          <p className="text-[12px] text-fg-muted">
            {group.contributionPot} POT per member
          </p>
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {group.members.map((m) => {
            const avatar = AVATARS[m];
            const dep = currentRoundDeposits.get(m);
            const isCurrent = m === user;
            const status = dep?.status ?? "pending";
            const isPending = depositingMember === m;
            const canDeposit =
              isCurrent && (status === "pending" || status === "failed");

            return (
              <li
                key={m}
                className={`group flex items-center justify-between gap-4 px-2 py-5 transition-colors hover:bg-white/[0.02] ${
                  isCurrent ? "bg-violet/[0.03]" : ""
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`grid size-10 place-items-center rounded-full text-[20px] transition-transform duration-300 group-hover:scale-[1.05] ${
                      isCurrent
                        ? "shadow-[0_0_0_2px_rgba(145,129,245,0.45),0_4px_18px_rgba(0,0,0,0.35)]"
                        : "shadow-[0_4px_18px_rgba(0,0,0,0.35)]"
                    }`}
                    style={{ background: avatar.bg }}
                    aria-label={m}
                  >
                    {avatar.emoji}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-[14px] font-medium text-fg">
                      {m}
                      {m === group.founder && (
                        <span className="text-[10px] text-fg-dim">
                          (founder)
                        </span>
                      )}
                      {isCurrent && (
                        <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-violet-soft">
                          you
                        </span>
                      )}
                    </p>
                    {status === "confirmed" && dep ? (
                      <p className="text-[11px] text-emerald-soft">
                        Paid {dep.amountPot} POT · block #{dep.blockNumber}
                      </p>
                    ) : status === "submitting" || isPending ? (
                      <p className="text-[11px] text-amber">
                        Submitting to chain…
                      </p>
                    ) : status === "failed" ? (
                      <p className="text-[11px] text-rose">
                        Failed — {dep?.error ?? "unknown error"}
                      </p>
                    ) : (
                      <p className="text-[11px] text-fg-dim">
                        Hasn&rsquo;t deposited yet
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  {status === "confirmed" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-emerald-soft">
                      <span className="size-1.5 rounded-full bg-emerald" />
                      Confirmed
                    </span>
                  )}
                  {(status === "submitting" || isPending) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-amber">
                      <span className="relative inline-flex size-1.5">
                        <span className="absolute inset-0 animate-ping rounded-full bg-amber/50" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-amber" />
                      </span>
                      Signing
                    </span>
                  )}
                  {canDeposit && (
                    <button
                      type="button"
                      onClick={() => onDeposit(m)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12px] font-medium text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {isPending
                        ? "Signing…"
                        : `Deposit ${group.contributionPot} POT`}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {depositError && (
          <p className="mt-3 text-[12px] text-rose">{depositError}</p>
        )}
      </section>

      <section className="fade-in">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-fg">
            Withdrawal requests
          </h2>
          {isMember && (
            <Link
              href={`/app/groups/${group.id}/withdraw`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12px] font-medium text-bg transition-transform hover:-translate-y-0.5"
            >
              <Plus className="size-3.5" />
              Request withdrawal
            </Link>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-8 text-center">
            <p className="text-[13px] text-fg-muted">
              No withdrawal requests yet. Anyone in the group can request a
              payout when they need it.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {openRequests.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-amber">
                  Open
                </p>
                <ul className="flex flex-col gap-2">
                  {openRequests.map((r) => (
                    <RequestRow key={r.id} request={r} groupId={group.id} />
                  ))}
                </ul>
              </div>
            )}
            {settledRequests.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-fg-dim">
                  Settled
                </p>
                <ul className="flex flex-col gap-2">
                  {settledRequests.map((r) => (
                    <RequestRow key={r.id} request={r} groupId={group.id} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function RequestRow({
  request,
  groupId,
}: {
  request: WithdrawRequest;
  groupId: string;
}) {
  const avatar = AVATARS[request.requester];
  const tone = statusTone(request.status);
  return (
    <li>
      <Link
        href={`/app/groups/${groupId}/requests/${request.id}`}
        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-[#141414] px-5 py-4 transition-colors hover:border-fg-dim"
      >
        <div className="flex items-center gap-3">
          <span
            className="grid size-9 place-items-center rounded-full text-[18px]"
            style={{ background: avatar.bg }}
            aria-label={request.requester}
          >
            {avatar.emoji}
          </span>
          <div>
            <p className="text-[14px] font-medium text-fg">
              {request.requester}{" "}
              <span className="text-fg-muted">requests</span>{" "}
              {request.amountPot} POT
            </p>
            <p className="line-clamp-1 max-w-md text-[12px] text-fg-muted">
              {request.reason}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${tone.cls}`}
          >
            <span className={`size-1.5 rounded-full ${tone.dot}`} />
            {tone.label}
          </span>
          <ArrowRight className="size-3.5 text-fg-dim" />
        </div>
      </Link>
    </li>
  );
}

function statusTone(s: WithdrawRequest["status"]) {
  switch (s) {
    case "ai_pending":
      return {
        label: "AI reviewing",
        cls: "border-violet/30 bg-violet/[0.05] text-violet-soft",
        dot: "bg-violet",
      };
    case "voting":
      return {
        label: "Voting",
        cls: "border-amber/30 bg-amber/[0.05] text-amber",
        dot: "bg-amber",
      };
    case "approved":
      return {
        label: "Approved",
        cls: "border-emerald/30 bg-emerald/[0.05] text-emerald-soft",
        dot: "bg-emerald",
      };
    case "executing":
      return {
        label: "Executing",
        cls: "border-amber/30 bg-amber/[0.05] text-amber",
        dot: "bg-amber",
      };
    case "completed":
      return {
        label: "Paid",
        cls: "border-emerald/30 bg-emerald/[0.05] text-emerald-soft",
        dot: "bg-emerald",
      };
    case "rejected":
      return {
        label: "Rejected",
        cls: "border-rose/40 bg-rose/[0.05] text-rose",
        dot: "bg-rose",
      };
    case "failed":
      return {
        label: "Failed",
        cls: "border-rose/40 bg-rose/[0.05] text-rose",
        dot: "bg-rose",
      };
    default:
      return {
        label: "Draft",
        cls: "border-border bg-white/[0.02] text-fg-dim",
        dot: "bg-fg-dim",
      };
  }
}
