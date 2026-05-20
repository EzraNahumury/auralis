"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useChain } from "@/components/providers/chain-provider";
import { MemberRow } from "@/components/app/member-row";
import { HeroCard } from "@/components/app/hero-card";
import { Timeline } from "@/components/app/timeline";

export default function Home() {
  const ref = useRef<HTMLDivElement>(null);
  const { steps } = useChain();

  const confirmed = steps.filter((s) => s.status === "confirmed").length;
  const done = confirmed === 5;

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".fade-in"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.09, duration: 0.8, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="flex flex-col gap-16">
      <header className="fade-in">
        <p className="text-[14px] text-fg-muted">Good morning, Alice.</p>
        <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          {done
            ? "Round 1 has been paid."
            : confirmed > 0
              ? `Round 1, ${confirmed} of 5 steps done.`
              : "You have a round ready."}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          Arisan Tetangga RT 03 collects 100&nbsp;POT from each of three
          members, then releases the pot to whoever&rsquo;s turn it is.
          You&rsquo;re the group&rsquo;s founder, so you propose the payout.
        </p>
      </header>

      <section className="fade-in">
        <HeroCard />
      </section>

      <section className="fade-in">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-fg">
            Members
          </h2>
          <Link
            href="/app/groups/g_rt03"
            className="text-[13px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            Open group
          </Link>
        </div>
        <MemberRow />
      </section>

      <section className="fade-in">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-fg">
            What this round looks like on chain
          </h2>
          <a
            href="/tx-proof.json"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            Download proof
          </a>
        </div>
        <Timeline />
      </section>
    </div>
  );
}
