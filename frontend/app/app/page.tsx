"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useSession } from "@/components/providers/session-provider";
import { loadAllGroups, onGroupsChanged } from "@/lib/groups/store";
import { listRequests, onRequestsChanged } from "@/lib/store/requests";
import { listDeposits, depositIdFor } from "@/lib/store/deposits";
import type { GroupDef } from "@/lib/groups/types";
import type { WithdrawRequest } from "@/lib/store/requests";
import { AVATARS } from "@/lib/avatars";
import { PROFILES } from "@/lib/profiles";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface PendingAction {
  kind: "deposit" | "vote";
  groupId: string;
  groupName: string;
  requestId?: string;
  amount?: number;
  label: string;
}

export default function Home() {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useSession();
  const [groups, setGroups] = useState<GroupDef[]>([]);
  const [allRequests, setAllRequests] = useState<WithdrawRequest[]>([]);

  useEffect(() => {
    const refresh = () => {
      const g = loadAllGroups();
      setGroups(g);
      setAllRequests(g.flatMap((x) => listRequests(x.id)));
    };
    refresh();
    const off1 = onGroupsChanged(refresh);
    const off2 = onRequestsChanged(refresh);
    return () => {
      off1();
      off2();
    };
  }, []);

  const myGroups = useMemo(
    () => (user ? groups.filter((g) => g.members.includes(user)) : []),
    [groups, user]
  );

  const actions = useMemo<PendingAction[]>(() => {
    if (!user) return [];
    const out: PendingAction[] = [];
    for (const g of myGroups) {
      const myDep = listDeposits(g.id).find(
        (d) => d.id === depositIdFor(g.id, user, g.currentRound)
      );
      if (!myDep || myDep.status === "failed") {
        out.push({
          kind: "deposit",
          groupId: g.id,
          groupName: g.name,
          amount: g.contributionPot,
          label: `Deposit ${g.contributionPot} POT to ${g.name}`,
        });
      }
      const requests = listRequests(g.id);
      for (const r of requests) {
        if (
          r.status === "voting" &&
          r.requester !== user &&
          !r.votes.some((v) => v.member === user)
        ) {
          out.push({
            kind: "vote",
            groupId: g.id,
            groupName: g.name,
            requestId: r.id,
            amount: r.amountPot,
            label: `Vote on ${r.requester}’s ${r.amountPot} POT request`,
          });
        }
      }
    }
    return out;
  }, [myGroups, user, allRequests]);

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
    { scope: ref, dependencies: [myGroups.length, actions.length] }
  );

  const profile = user ? PROFILES[user] : null;
  const avatar = user ? AVATARS[user] : null;

  return (
    <div ref={ref} className="flex flex-col gap-14">
      <header className="fade-in">
        <p className="text-[14px] text-fg-muted">
          {greeting()}, {user ?? "friend"}.
        </p>
        <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          {myGroups.length === 0
            ? "No groups yet."
            : myGroups.length === 1
              ? "One Arisan group — here’s where it stands."
              : `You’re in ${myGroups.length} Arisan groups.`}
        </h1>
        {profile && avatar && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
            Signed in as <span className="text-fg">{user}</span> ·{" "}
            {profile.role.toLowerCase()}.
          </p>
        )}
      </header>

      {actions.length > 0 && (
        <section className="fade-in">
          <h2 className="mb-4 text-[18px] font-semibold tracking-tight text-fg">
            Needs you
          </h2>
          <ul className="flex flex-col gap-2">
            {actions.map((a, i) => (
              <li key={i}>
                <Link
                  href={
                    a.kind === "vote"
                      ? `/app/groups/${a.groupId}/requests/${a.requestId}`
                      : `/app/groups/${a.groupId}`
                  }
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-amber/30 bg-amber/[0.04] px-5 py-4 transition-colors hover:bg-amber/[0.06]"
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-amber">
                      {a.kind === "deposit" ? "Deposit due" : "Vote needed"}
                    </p>
                    <p className="mt-1 text-[14px] text-fg">{a.label}</p>
                    <p className="text-[11px] text-fg-muted">{a.groupName}</p>
                  </div>
                  <span className="text-[14px] text-fg-dim transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="fade-in">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-fg">
            Your groups
          </h2>
          <Link
            href="/app/groups"
            className="text-[13px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            All groups
          </Link>
        </div>

        {myGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <p className="text-[14px] text-fg-muted">
              You&rsquo;re not in any Arisan groups yet.
            </p>
            <Link
              href="/app/groups/new"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-bg transition-transform hover:-translate-y-0.5"
            >
              Start your first group
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {myGroups.map((g) => {
              const pot = g.contributionPot * g.members.length;
              const openRequests = listRequests(g.id).filter(
                (r) =>
                  r.status === "voting" ||
                  r.status === "ai_pending" ||
                  r.status === "executing"
              );
              return (
                <li key={g.id}>
                  <Link
                    href={`/app/groups/${g.id}`}
                    className="group flex items-center justify-between gap-5 rounded-2xl border border-border bg-[#141414] px-6 py-5 transition-colors hover:border-fg-dim"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold tracking-tight text-fg">
                        {g.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-fg-muted">
                        {g.members.length} members · {g.threshold}-of-
                        {g.members.length} multisig · round {g.currentRound}/
                        {g.totalRounds}
                      </p>
                      <div className="mt-2.5 flex -space-x-2">
                        {g.members.map((m) => {
                          const a = AVATARS[m];
                          return (
                            <span
                              key={m}
                              className="grid size-6 place-items-center rounded-full text-[12px] ring-2 ring-[#141414]"
                              style={{ background: a.bg }}
                              title={m}
                              aria-label={m}
                            >
                              {a.emoji}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-medium tabular-nums text-fg">
                        {pot}
                        <span className="ml-1 text-[12px] text-fg-muted">
                          POT pot
                        </span>
                      </p>
                      {openRequests.length > 0 && (
                        <p className="mt-1 text-[11px] text-amber">
                          {openRequests.length} open request
                          {openRequests.length > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
