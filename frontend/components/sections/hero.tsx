"use client";

import { useRef } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { hero } from "@/lib/content";
import { cn } from "@/lib/cn";
import { Entropy } from "../ui/entropy";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const tl = gsap.timeline({
        defaults: { ease: "expo.out", duration: 1 },
      });

      tl.fromTo(
        ".hero-word",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.9 }
      )
        .fromTo(
          ".hero-desc",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.5"
        )
        .fromTo(
          ".hero-cta-row",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.45"
        )
        .fromTo(
          ".hero-field",
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 1.4, ease: "expo.out" },
          "-=0.8"
        );
    },
    { scope: ref }
  );

  return (
    <section
      id="top"
      ref={ref}
      className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24 lg:min-h-[880px] lg:pt-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-dot-grid opacity-[0.18]"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 78%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 78%, transparent)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-12 px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_540px] lg:items-center lg:gap-12 lg:px-10 xl:gap-20">
        {/* Left — headline + description + CTA */}
        <div className="relative z-10 max-w-[640px] lg:order-1 lg:max-w-[600px]">
          <h1
            className="text-[clamp(1.5rem,2.9vw,2.6rem)] font-normal leading-[1.15] tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-tech), ui-sans-serif, system-ui" }}
          >
            {hero.headline.map((line, li) => (
              <span key={li} className="block overflow-hidden">
                <span className="inline-block">
                  {line.map((word, wi) => (
                    <span
                      key={wi}
                      className={cn(
                        "hero-word inline-block",
                        word.tone === "muted" ? "text-fg-dim" : "text-fg",
                        wi < line.length - 1 && "mr-[0.32em]"
                      )}
                    >
                      {word.text}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </h1>

          <div className="hero-desc mt-10 flex max-w-md items-start gap-3">
            <span
              aria-hidden
              className="mt-[6px] grid size-5 place-items-center rounded-full border border-border-strong text-fg-dim"
            >
              <Plus className="size-3" />
            </span>
            <p className="text-sm leading-relaxed text-fg-muted sm:text-[15px]">
              {hero.description}
            </p>
          </div>

          <div className="hero-cta-row mt-9">
            <Link
              href={hero.openApp.href}
              className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-bg shadow-[0_-4px_7px_rgba(225,225,225,0.32)_inset] transition-colors hover:bg-[#fafafa]"
            >
              <span>{hero.openApp.label}</span>
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-full"
                style={{ background: "var(--gradient-brand)" }}
              >
                <ArrowUpRight className="size-3.5 text-white transition-transform duration-300 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
              </span>
            </Link>
          </div>
        </div>

        {/* Right — Entropy particle field */}
        <div className="hero-field relative mx-auto flex w-full max-w-[420px] origin-center scale-[0.82] items-center justify-center sm:max-w-[480px] sm:scale-100 lg:order-2 lg:mx-0 lg:max-w-none lg:justify-end">
          <Entropy size={540} className="rounded-[2rem] !bg-transparent" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[3rem]"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 40%, rgba(145,129,245,0.10), transparent 70%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
