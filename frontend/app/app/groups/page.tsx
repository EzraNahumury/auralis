"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";

export default function Groups() {
  const ref = useRef<HTMLDivElement>(null);

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
    { scope: ref }
  );

  return (
    <div ref={ref} className="flex flex-col gap-12">
      <header className="fade-in">
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          Your groups
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          You&rsquo;re part of one Arisan group right now. Tap it to open the
          round, or start a new one.
        </p>
      </header>

      <section className="fade-in flex flex-col gap-3">
        <Link
          href="/app/groups/g_rt03"
          className="group rounded-2xl border border-border bg-[#141414] px-6 py-6 transition-colors hover:border-fg-dim"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[12px] text-fg-muted">Active</p>
              <p className="mt-1 text-[20px] font-semibold tracking-tight text-fg">
                Arisan Tetangga RT 03
              </p>
              <p className="mt-1 text-[13px] text-fg-muted">
                3 members · Dave receives this round
              </p>
            </div>
            <div className="text-right">
              <p className="text-[26px] font-medium tabular-nums text-fg">
                300 <span className="text-[14px] text-fg-muted">POT</span>
              </p>
              <p className="text-[12px] text-fg-dim">100 POT × 3</p>
            </div>
          </div>
        </Link>

        <Link
          href="/app/groups/new"
          className="rounded-2xl border border-dashed border-border px-6 py-6 text-[14px] text-fg-muted transition-colors hover:border-fg-dim hover:text-fg"
        >
          Start a new group
        </Link>
      </section>
    </div>
  );
}
