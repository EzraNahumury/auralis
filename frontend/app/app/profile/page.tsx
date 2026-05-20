"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useChain } from "@/components/providers/chain-provider";
import { shortHash } from "@/lib/chain/proof";
import { AnimatedNumber } from "@/components/app/animated-number";
import { AVATARS } from "@/lib/avatars";

const badges = [
  { name: "Group founder", note: "Founded RT 03 in May 2026." },
  { name: "On-time payer", note: "Paid all 3 deposits this round." },
  { name: "Dispute-free", note: "No challenges raised on you." },
];

export default function Profile() {
  const ref = useRef<HTMLDivElement>(null);
  const { proof } = useChain();
  const address = proof?.participants.alice ?? "5GrwvaEF…";

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
    <div ref={ref} className="flex flex-col gap-14">
      <header className="fade-in flex items-center gap-5">
        <span
          className="grid size-16 place-items-center rounded-full text-[36px] shadow-[0_8px_28px_rgba(74,59,205,0.35)]"
          style={{ background: AVATARS.Alice.bg }}
          aria-label="Alice"
        >
          {AVATARS.Alice.emoji}
        </span>
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-fg sm:text-[32px]">
            Alice
          </h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            Founder of Arisan Tetangga RT 03
          </p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(address)}
            className="mt-2 text-[11px] text-fg-dim transition-colors hover:text-fg"
            title="Copy address"
            style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
          >
            {shortHash(address, 6, 4)}
          </button>
        </div>
      </header>

      <section className="fade-in">
        <div className="grid gap-y-8 gap-x-12 sm:grid-cols-3">
          <div>
            <p className="text-[12px] text-fg-muted">Trust score</p>
            <p className="mt-1.5 text-[44px] font-medium leading-none tabular-nums text-fg">
              <AnimatedNumber value={887} duration={1600} />
            </p>
            <p className="mt-2 text-[12px] text-fg-dim">
              Out of 1,000. Platinum tier.
            </p>
          </div>
          <div>
            <p className="text-[12px] text-fg-muted">Your vote counts as</p>
            <p className="mt-1.5 text-[44px] font-medium leading-none tabular-nums text-fg">
              <AnimatedNumber value={1.39} duration={1600} format="decimal" />
              <span className="text-[18px] text-fg-muted">×</span>
            </p>
            <p className="mt-2 text-[12px] text-fg-dim">
              Higher than the base because of your badges.
            </p>
          </div>
          <div>
            <p className="text-[12px] text-fg-muted">Groups active</p>
            <p className="mt-1.5 text-[44px] font-medium leading-none tabular-nums text-fg">
              <AnimatedNumber value={1} duration={900} />
            </p>
            <p className="mt-2 text-[12px] text-fg-dim">
              <Link
                href="/app/groups/g_rt03"
                className="underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
              >
                Arisan Tetangga RT 03
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="fade-in">
        <h2 className="mb-5 text-[18px] font-semibold tracking-tight text-fg">
          Badges
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          {badges.map((b) => (
            <li
              key={b.name}
              className="group flex items-baseline gap-5 px-2 py-4 transition-all duration-300 hover:translate-x-0.5 hover:bg-white/[0.02]"
            >
              <span
                className="size-1.5 shrink-0 rounded-full bg-fg-muted transition-all duration-300 group-hover:bg-fg group-hover:shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                aria-hidden
              />
              <div className="flex-1">
                <p className="text-[14px] text-fg">{b.name}</p>
                <p className="mt-0.5 text-[12px] text-fg-muted">{b.note}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-fg-dim">
          Badges are tied to your address. They follow you to other Auralis
          groups.
        </p>
      </section>
    </div>
  );
}
