"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { whatYouCanDo } from "@/lib/content";
import { DepositChart } from "../visuals/deposit-chart";
import { ReputationGauge } from "../visuals/reputation-gauge";
import { BadgeStack } from "../visuals/badge-stack";

const VISUALS = [DepositChart, ReputationGauge, BadgeStack] as const;

export function WhatYouCanDo() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;

      gsap.fromTo(
        ".wycd-title-word",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.85,
          ease: "expo.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 75%",
          },
        }
      );

      gsap.fromTo(
        ".wycd-card",
        { opacity: 0, y: 60, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.12,
          duration: 0.95,
          ease: "expo.out",
          scrollTrigger: {
            trigger: ".wycd-grid",
            start: "top 82%",
          },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".wycd-card");
      cards.forEach((card) => {
        gsap.to(card, {
          y: -10,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger && ref.current?.contains(st.trigger as Element)) {
            st.kill();
          }
        });
      };
    },
    { scope: ref }
  );

  return (
    <section
      id="capabilities"
      ref={ref}
      className="relative isolate overflow-hidden py-28 sm:py-36"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <h2
          className="text-center text-[clamp(2rem,5.4vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-fg"
          style={{
            fontFamily:
              "var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system",
          }}
        >
          {whatYouCanDo.title.split(" ").map((w, i) => (
            <span
              key={i}
              className="wycd-title-word mr-[0.24em] inline-block"
            >
              {w}
            </span>
          ))}
        </h2>

        <div className="wycd-grid mt-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {whatYouCanDo.cards.map((c, i) => {
            const Visual = VISUALS[i];
            return (
              <article
                key={c.name}
                className="wycd-card group relative flex flex-col overflow-hidden rounded-[2rem] border border-border-strong bg-surface/45 p-6 backdrop-blur-md transition-colors hover:border-border-strong/80 hover:bg-surface/55 sm:p-7 will-change-transform"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] border border-border bg-bg/70">
                  {Visual ? <Visual /> : null}
                </div>

                <div className="mt-7 flex-1">
                  <h3
                    className="text-lg font-semibold tracking-tight text-fg sm:text-xl"
                    style={{
                      fontFamily:
                        "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
                    }}
                  >
                    {c.name}
                  </h3>
                  <p
                    className="mt-3 text-sm leading-relaxed text-fg-muted sm:text-[15px]"
                    style={{
                      fontFamily:
                        "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
                    }}
                  >
                    {c.body}
                  </p>
                </div>

              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
