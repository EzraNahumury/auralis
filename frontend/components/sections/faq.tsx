"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Plus, Minus } from "lucide-react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { faq } from "@/lib/content";

export function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useGSAP(
    () => {
      registerGsap();
      if (!sectionRef.current || !pinRef.current) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinRef.current!,
            start: "top top",
            end: "+=120%",
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        });

        // Card grows to fullscreen
        tl.to(
          ".faq-window",
          {
            width: "100vw",
            height: "100vh",
            borderRadius: 0,
            ease: "power2.inOut",
            duration: 0.6,
          },
          0
        );

        // Mini fades early
        tl.to(
          ".faq-mini",
          { opacity: 0, scale: 0.85, ease: "power2.in", duration: 0.25 },
          0
        );

        // Expanded wrapper fades in WHILE card is finishing grow
        tl.fromTo(
          ".faq-expanded",
          { opacity: 0 },
          { opacity: 1, duration: 0.2 },
          0.4
        );

        // Headline reveals near the end of grow
        tl.fromTo(
          ".faq-headline-word",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, stagger: 0.06, ease: "expo.out", duration: 0.3 },
          0.5
        );

        // Accordion items stagger in right after card is grown
        tl.fromTo(
          ".faq-item",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, stagger: 0.05, ease: "expo.out", duration: 0.35 },
          0.7
        );

        // Footer reveals at very end
        tl.fromTo(
          ".faq-footer",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, ease: "expo.out", duration: 0.25 },
          0.95
        );

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      // Mobile: no pin, just show content with simple fades
      mm.add("(max-width: 1023px)", () => {
        gsap.set(".faq-window", { width: "100%", height: "auto" });
        gsap.set(".faq-mini", { display: "none" });
        gsap.set(".faq-expanded", { opacity: 1, position: "static" });

        gsap.fromTo(
          ".faq-headline-word",
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: { trigger: sectionRef.current!, start: "top 75%" },
          }
        );
        gsap.fromTo(
          ".faq-item",
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.06,
            duration: 0.6,
            ease: "expo.out",
            scrollTrigger: { trigger: ".faq-list", start: "top 85%" },
          }
        );
      });

      return () => {
        mm.revert();
        ScrollTrigger.refresh();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section id="faq" ref={sectionRef} className="relative bg-white">
      <div
        ref={pinRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-bg lg:flex"
      >
        {/* Dark cover behind window (hidden as window grows) */}
        <div className="absolute inset-0 bg-bg" aria-hidden />

        {/* The growing white window contains BOTH mini and expanded states */}
        <div className="faq-window relative z-10 flex h-[360px] w-[330px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)]">
          {/* Mini state — visible at start */}
          <div className="faq-mini absolute inset-0 p-8">
            <h3
              className="text-[2.2rem] font-medium leading-none text-[#0a0a0a]"
              style={{
                fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
              }}
            >
              FAQ
            </h3>
            <div
              aria-hidden
              className="absolute bottom-5 right-5 grid size-12 place-items-center rounded-full text-white shadow-[0_-4px_8px_rgba(255,255,255,0.25)_inset]"
              style={{ background: "var(--gradient-brand)" }}
            >
              <ArrowUpRight className="size-5" />
            </div>
          </div>

          {/* Expanded state — reveals as window grows */}
          <div className="faq-expanded absolute inset-0 flex flex-col overflow-hidden opacity-0">
            <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col overflow-hidden px-7 pt-20 sm:px-12 sm:pt-24 lg:px-20 lg:pt-28">
              <h2
                className="text-[clamp(1.5rem,3.4vw,3.6rem)] font-medium leading-[1.1] tracking-[-0.01em] text-[#0a0a0a]"
                style={{
                  fontFamily:
                    "var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system",
                }}
              >
                <span className="inline-flex flex-nowrap items-baseline gap-x-3 sm:gap-x-5 lg:gap-x-7 whitespace-nowrap">
                  <span className="faq-headline-word inline-block">Frequently</span>
                  <span className="faq-headline-word inline-block h-[2px] w-8 self-end translate-y-[-0.45em] bg-[#0a0a0a]/40 sm:w-14 lg:w-20" />
                  <span className="faq-headline-word inline-block">Asked</span>
                  <span className="faq-headline-word inline-block h-[2px] w-8 self-end translate-y-[-0.45em] bg-[#0a0a0a]/40 sm:w-14 lg:w-20" />
                  <span className="faq-headline-word inline-block">Questions</span>
                </span>
              </h2>

              <div className="mx-auto mt-10 flex w-full max-w-[1120px] flex-col lg:mt-12">
                <div className="faq-list space-y-3 pr-1 sm:space-y-3.5">
                  {faq.items.map((item, i) => {
                    const isOpen = openIdx === i;
                    return (
                      <div
                        key={item.q}
                        className={`faq-item transition-colors ${
                          isOpen
                            ? "rounded-[36px] bg-[#0a0a0a]/[0.05]"
                            : "rounded-full bg-[#0a0a0a]/[0.04] hover:bg-[#0a0a0a]/[0.06]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenIdx(isOpen ? null : i)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-5 rounded-full px-7 py-4 text-left sm:px-9 sm:py-5"
                        >
                          <span
                            className="text-base font-medium leading-snug text-[#0a0a0a] sm:text-lg lg:text-xl"
                            style={{
                              fontFamily:
                                "var(--font-tech), ui-sans-serif, system-ui",
                            }}
                          >
                            {i + 1}. {item.q}
                          </span>
                          <span
                            aria-hidden
                            className="grid size-11 shrink-0 place-items-center rounded-full text-white shadow-[0_-4px_8px_rgba(255,255,255,0.25)_inset] sm:size-12"
                            style={{ background: "var(--gradient-brand)" }}
                          >
                            {isOpen ? (
                              <Minus className="size-4" />
                            ) : (
                              <Plus className="size-4" />
                            )}
                          </span>
                        </button>
                        {isOpen && (
                          <div
                            className="px-7 pb-5 pt-1 text-sm leading-relaxed text-[#0a0a0a]/70 sm:px-9 sm:pb-6 sm:text-[15px] lg:text-base"
                            style={{
                              fontFamily:
                                "var(--font-tech), ui-sans-serif, system-ui",
                            }}
                          >
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Footer — spans the WIDER outer container (not constrained to accordion's max-w) */}
              <div className="faq-footer mt-8 flex flex-col items-start justify-between gap-5 pb-6 sm:flex-row sm:items-center lg:mt-10 lg:pb-8">
                <div
                  className="flex max-w-xl items-start gap-3 text-[15px] leading-snug text-[#0a0a0a]/55 sm:text-base lg:text-[17px]"
                  style={{
                    fontFamily:
                      "var(--font-tech), ui-sans-serif, system-ui",
                  }}
                >
                  <Plus className="mt-1 size-5 shrink-0" />
                  <span>{faq.hint}</span>
                </div>
                <a
                  href={faq.community.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex shrink-0 items-center gap-4 text-[#0a0a0a]"
                >
                  <span
                    aria-hidden
                    className="grid size-[68px] place-items-center rounded-[20px] bg-[#3b5bff] text-white transition-transform group-hover:-translate-y-0.5"
                  >
                    <span className="inline-flex gap-2">
                      <span className="size-2 rounded-full bg-white" />
                      <span className="size-2 rounded-full bg-white" />
                      <span className="size-2 rounded-full bg-white" />
                    </span>
                  </span>
                  <span
                    className="text-[15px] font-semibold leading-tight sm:text-base lg:text-[17px]"
                    style={{
                      fontFamily:
                        "var(--font-tech), ui-sans-serif, system-ui",
                    }}
                  >
                    Any Questions? Ask
                    <br />
                    The Community.
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
