"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import {
  deleteGroup,
  loadAllGroups,
  onGroupsChanged,
} from "@/lib/groups/store";
import type { GroupDef } from "@/lib/groups/types";
import { AVATARS } from "@/lib/avatars";
import { useSession } from "@/components/providers/session-provider";
import { Trash2, Plus } from "lucide-react";

export default function Groups() {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useSession();
  const [groups, setGroups] = useState<GroupDef[]>([]);

  useEffect(() => {
    setGroups(loadAllGroups());
    return onGroupsChanged(() => setGroups(loadAllGroups()));
  }, []);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".fade-in"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref, dependencies: [groups.length] }
  );

  const onDelete = (g: GroupDef) => {
    const ok = window.confirm(`Remove "${g.name}" from your local list?`);
    if (!ok) return;
    deleteGroup(g.id);
  };

  return (
    <div ref={ref} className="flex flex-col gap-12">
      <header className="fade-in">
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          Your groups
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          {groups.length === 0
            ? "You haven't joined or created any Arisan groups yet."
            : groups.length === 1
              ? "One Arisan group so far."
              : `${groups.length} Arisan groups so far.`}
        </p>
      </header>

      <section className="fade-in flex flex-col gap-3">
        {groups.map((g) => {
          const pot = g.contributionPot * g.members.length;
          const isYourGroup = user && g.members.includes(user);
          return (
            <div
              key={g.id}
              className="group relative flex items-stretch overflow-hidden rounded-2xl border border-border bg-[#141414] transition-colors hover:border-fg-dim"
            >
              <Link
                href={`/app/groups/${g.id}`}
                className="flex-1 px-6 py-6"
                aria-label={`Open ${g.name}`}
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isYourGroup && (
                        <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-violet-soft">
                          You&rsquo;re in
                        </span>
                      )}
                      <p className="text-[12px] text-fg-muted">
                        Round {g.currentRound} of {g.totalRounds} ·{" "}
                        {g.threshold}-of-{g.members.length} multisig
                      </p>
                    </div>
                    <p className="mt-1.5 truncate text-[20px] font-semibold tracking-tight text-fg">
                      {g.name}
                    </p>
                    <p className="mt-1 truncate text-[13px] text-fg-muted">
                      Founded by {g.founder}
                    </p>
                    <div className="mt-3 flex -space-x-2">
                      {g.members.map((m) => {
                        const a = AVATARS[m];
                        return (
                          <span
                            key={m}
                            className="grid size-7 place-items-center rounded-full text-[14px] ring-2 ring-[#141414]"
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
                    <p className="text-[26px] font-medium tabular-nums text-fg">
                      {pot}{" "}
                      <span className="text-[14px] text-fg-muted">POT</span>
                    </p>
                    <p className="text-[12px] text-fg-dim">
                      {g.contributionPot} POT × {g.members.length}
                    </p>
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => onDelete(g)}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-fg-dim opacity-0 transition-all group-hover:opacity-100 hover:bg-rose/10 hover:text-rose"
                title="Delete this group"
                aria-label="Delete group"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}

        <Link
          href="/app/groups/new"
          className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-6 text-[14px] text-fg-muted transition-all hover:-translate-y-0.5 hover:border-fg-dim hover:text-fg"
        >
          <Plus className="size-4 transition-transform group-hover:rotate-90" />
          Start a new group
        </Link>
      </section>
    </div>
  );
}
