"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Plus } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { HalftoneField } from "../visuals/halftone-field";
import { StackMarquee } from "./stack-marquee";

type Card = {
  title: string;
  href: string;
  external?: boolean;
  image: string;
  alt: string;
};

const CARDS: Card[] = [
  {
    title: "Open Source",
    href: "https://github.com/EzraNahumury/auralis",
    external: true,
    image: "/a1.png",
    alt: "Auralis Core open source",
  },
  {
    title: "Onchain Auditable",
    href: "https://portaldot-dev.readthedocs.io/",
    external: true,
    image: "/a2.png",
    alt: "Portaldot mainnet POT-settled",
  },
];

export function SecurityIntegrations() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;

      gsap.fromTo(
        ".si-title-line",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 78%" },
        }
      );

      gsap.fromTo(
        ".si-body",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.25,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 78%" },
        }
      );

      gsap.fromTo(
        ".si-card",
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.15,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".si-cards", start: "top 80%" },
        }
      );

      gsap.fromTo(
        ".si-partners-label",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: { trigger: ".si-partners-label", start: "top 92%" },
        }
      );
    },
    { scope: ref }
  );

  return (
    <section
      id="security"
      ref={ref}
      className="relative isolate overflow-hidden pb-24 pt-28 sm:pt-36"
    >
      {/* Animated halftone bg covers the whole upper section */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px]">
        <HalftoneField />
        {/* Top mask */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-24"
          style={{
            background: "linear-gradient(to bottom, var(--color-bg), transparent)",
          }}
        />
        {/* Bottom mask */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32"
          style={{
            background: "linear-gradient(to top, var(--color-bg), transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-16">
          <h2
            className="text-[clamp(2.4rem,5.4vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.02em] text-fg"
            style={{
              fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
            }}
          >
            <span className="si-title-line block overflow-hidden">
              <span className="inline-block">Security &</span>
            </span>
            <span className="si-title-line block overflow-hidden">
              <span className="inline-block">Integrations</span>
            </span>
          </h2>

          <div className="si-body flex max-w-md items-start gap-3 self-end">
            <span
              aria-hidden
              className="mt-[6px] grid size-5 place-items-center rounded-full border border-border-strong text-fg-dim"
            >
              <Plus className="size-3" />
            </span>
            <p
              className="text-sm leading-relaxed text-fg-muted sm:text-[15px]"
              style={{ fontFamily: "var(--font-tech), ui-sans-serif, system-ui" }}
            >
              We prioritize the safety of community funds through onchain
              enforcement. Auralis core contracts are open source, every AI
              verdict and reviewer vote is auditable, and a third-party audit
              is planned ahead of Portaldot mainnet release.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="si-cards mt-24 flex flex-wrap items-center justify-center gap-5 sm:gap-6">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="si-card group relative flex h-[270px] w-[238px] flex-col rounded-[20px] bg-white text-bg shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] transition-transform duration-500 hover:-translate-y-1.5"
            >
              <div className="px-5 pt-5">
                <h3
                  className="text-[15px] font-semibold tracking-tight text-bg"
                  style={{
                    fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
                  }}
                >
                  {c.title}
                </h3>
              </div>

              {/* Logo plate */}
              <div className="relative mx-5 mt-3 flex flex-1 items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-[#f5f6fa] to-[#e6e9f1]">
                <Image
                  src={c.image}
                  alt={c.alt}
                  fill
                  sizes="200px"
                  className="object-contain p-5"
                />
              </div>

              <div className="flex items-center justify-between px-5 pb-4 pt-4">
                <span
                  className="text-[14px] font-medium text-bg"
                  style={{
                    fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
                  }}
                >
                  See Report
                </span>
                <span
                  aria-hidden
                  className="relative grid size-9 place-items-center overflow-hidden rounded-full text-white"
                >
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--gradient-brand)" }}
                  />
                  <span
                    className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(0deg, rgba(255,255,255,0.35), rgba(255,255,255,0.35)), var(--gradient-brand)",
                    }}
                  />
                  <ArrowUpRight className="relative size-3.5 transition-transform duration-300 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Partners */}
      <div className="relative mt-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <p
            className="si-partners-label text-[clamp(1.4rem,2.6vw,2rem)] font-medium tracking-[-0.01em] text-fg"
            style={{
              fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
            }}
          >
            Partners
          </p>
        </div>
        <div className="mt-7">
          <StackMarquee variant="bare" />
        </div>
      </div>
    </section>
  );
}
