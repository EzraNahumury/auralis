"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { hero } from "@/lib/content";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { HeroPreview } from "./hero-preview";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const tl = gsap.timeline({
        defaults: { ease: "expo.out", duration: 1 },
      });

      tl.fromTo(
        ".hero-eyebrow",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7 }
      )
        .fromTo(
          ".hero-line",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 1.1 },
          "-=0.3"
        )
        .fromTo(
          ".hero-sub",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.6"
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          ".hero-stat",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, stagger: 0.06, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          ".hero-preview",
          { opacity: 0, y: 50, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1.2 },
          "-=0.7"
        );

      gsap.to(".hero-preview", {
        y: -10,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".hero-orb-a", {
        x: 40,
        y: -30,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".hero-orb-b", {
        x: -50,
        y: 20,
        duration: 11,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: ref }
  );

  return (
    <section
      id="top"
      ref={ref}
      className="relative isolate overflow-hidden pt-32 pb-24 sm:pt-44 sm:pb-32"
    >
      {/* Decorative orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="hero-orb-a absolute -top-40 left-1/4 size-[640px] rounded-full bg-violet/20 blur-[160px]" />
        <div className="hero-orb-b absolute top-32 right-1/4 size-[520px] rounded-full bg-indigo/15 blur-[160px]" />
      </div>

      <div
        aria-hidden
        className="absolute inset-0 bg-dot-grid opacity-[0.25]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 15%, black 80%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 15%, black 80%, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[1300px] px-6 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="hero-eyebrow inline-block">
              <Badge tone="violet">{hero.badge}</Badge>
            </div>

            <h1 className="display mt-7 text-fg">
              <span className="block overflow-hidden">
                <span className="hero-line block text-[clamp(2.8rem,8vw,7.5rem)] font-semibold">
                  Gotong royong,
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line serif-display block text-[clamp(2.6rem,7.5vw,7rem)] text-gradient">
                  now governed by
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line block text-[clamp(2.8rem,8vw,7.5rem)] font-semibold">
                  AI on Portaldot.
                </span>
              </span>
            </h1>

            <p className="hero-sub mt-8 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
              {hero.subtitle}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <span className="hero-cta inline-block">
                <Button href={hero.ctaPrimary.href} withArrow>
                  {hero.ctaPrimary.label}
                </Button>
              </span>
              <span className="hero-cta inline-block">
                <Button href={hero.ctaSecondary.href} variant="secondary">
                  {hero.ctaSecondary.label}
                </Button>
              </span>
            </div>

            <dl className="mt-14 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 border-t border-border pt-8 sm:grid-cols-4">
              {hero.stats.map((s) => (
                <div key={s.label} className="hero-stat flex flex-col gap-1.5">
                  <dt className="display text-2xl font-semibold tracking-tight text-fg">
                    {s.value}
                  </dt>
                  <dd className="text-[10px] uppercase tracking-[0.14em] text-fg-dim">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hero-preview relative">
            <HeroPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
