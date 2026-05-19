"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Users, Wallet, Calendar, ArrowUpRight } from "lucide-react";
import { gsap, registerGsap } from "@/lib/gsap";
import { groups } from "@/lib/mock";
import { PageHeader } from "@/components/app/page-header";
import { GlowCard } from "@/components/ui/glow-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function GroupsPage() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".group-card"),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="Groups"
        title="Every Arisan you're part of."
        description="Each group is an independent ink! contract on Portaldot. Reputation moves with you across all of them."
        actions={
          <Button href="/app/groups/new" withArrow>
            New group
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <div key={g.id} className="group-card">
            <Link href={`/app/groups/${g.id}`} className="block h-full">
              <GlowCard glow="violet" className="h-full">
                <div className="flex h-full flex-col gap-5 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                      <Badge tone={g.status === "active" ? "emerald" : "neutral"}>
                        {g.status}
                      </Badge>
                      <h3 className="text-lg font-semibold tracking-tight text-fg">
                        {g.name}
                      </h3>
                      <p className="text-xs text-fg-muted">{g.description}</p>
                    </div>
                    <ArrowUpRight className="size-4 text-fg-dim transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-bg/40 px-3 py-2">
                      <Users className="size-3.5 text-fg-dim" />
                      <span className="text-fg-muted">{g.membersCount} members</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-bg/40 px-3 py-2">
                      <Wallet className="size-3.5 text-fg-dim" />
                      <span className="font-mono text-fg-muted">
                        {g.treasuryBalance} POT
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-bg/40 px-3 py-2">
                      <Calendar className="size-3.5 text-fg-dim" />
                      <span className="text-fg-muted">
                        Round {g.currentRound}/{g.totalRounds}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-bg/40 px-3 py-2">
                      <span className="text-fg-dim">Iuran</span>
                      <span className="font-mono text-fg-muted">
                        {g.contributionAmount} POT
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-fg-dim">
                    <span>Next round · {g.nextRoundAt}</span>
                    <span className="font-mono">{g.id}</span>
                  </div>
                </div>
              </GlowCard>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
