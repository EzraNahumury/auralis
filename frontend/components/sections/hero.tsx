"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { hero } from "@/lib/content";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { GradientMesh } from "../ui/gradient-mesh";
import { HeroPreview } from "./hero-preview";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(
        ".hero-eyebrow",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7 }
      )
        .fromTo(
          ".hero-line",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.9 },
          "-=0.4"
        )
        .fromTo(
          ".hero-sub",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          ".hero-stat",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.07, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          ".hero-preview",
          { opacity: 0, y: 40, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1 },
          "-=0.6"
        );

      gsap.to(".hero-preview", {
        y: -10,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".hero-blob", {
        x: 30,
        y: -20,
        duration: 8,
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
      className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      <GradientMesh className="hero-blob" />
      <div
        aria-hidden
        className="absolute inset-0 bg-dot-grid opacity-[0.3]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 70%, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="hero-eyebrow inline-block">
              <Badge tone="violet">{hero.badge}</Badge>
            </div>

            <h1 className="display mt-6 text-[clamp(2.6rem,6vw,4.6rem)] font-semibold text-fg">
              {hero.title.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <span className="hero-line block">{line}</span>
                </span>
              ))}
            </h1>

            <p className="hero-sub mt-7 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
              {hero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
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

            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {hero.stats.map((s) => (
                <div key={s.label} className="hero-stat flex flex-col gap-1">
                  <dt className="text-2xl font-semibold tracking-tight text-fg">
                    {s.value}
                  </dt>
                  <dd className="text-[11px] uppercase tracking-wider text-fg-dim">
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
