"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { ctaSection } from "@/lib/content";
import { Button } from "../ui/button";

export function CTA() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll<HTMLElement>('[data-anim="fade-up"]'),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.9,
          scrollTrigger: { trigger: ref.current, start: "top 80%" },
        }
      );

      gsap.to(".cta-orb-a", {
        x: 40,
        y: -20,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".cta-orb-b", {
        x: -30,
        y: 25,
        duration: 11,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: ref }
  );

  return (
    <section id="cta" ref={ref} className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-border-strong bg-surface/70 px-8 py-16 text-center backdrop-blur-xl sm:px-16 sm:py-20">
          <div
            aria-hidden
            className="cta-orb-a pointer-events-none absolute -left-24 top-10 size-[440px] rounded-full bg-violet/25 blur-[120px]"
          />
          <div
            aria-hidden
            className="cta-orb-b pointer-events-none absolute -right-24 bottom-0 size-[440px] rounded-full bg-emerald/20 blur-[120px]"
          />
          <div aria-hidden className="absolute inset-0 bg-dot-grid opacity-[0.15]" />

          <div className="relative">
            <h2
              data-anim="fade-up"
              className="display mx-auto max-w-3xl text-3xl font-semibold text-fg sm:text-5xl"
            >
              {ctaSection.title}
            </h2>
            <p
              data-anim="fade-up"
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg"
            >
              {ctaSection.body}
            </p>
            <div
              data-anim="fade-up"
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <Button href={ctaSection.primary.href} withArrow external>
                {ctaSection.primary.label}
              </Button>
              <Button href={ctaSection.secondary.href} variant="secondary" external>
                {ctaSection.secondary.label}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
