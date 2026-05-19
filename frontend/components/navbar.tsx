"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { nav } from "@/lib/content";
import { Button } from "./ui/button";
import { cn } from "@/lib/cn";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(
    () => {
      gsap.from(".nav-item", {
        y: -14,
        opacity: 0,
        stagger: 0.06,
        delay: 0.1,
        duration: 0.7,
        ease: "expo.out",
      });
    },
    { scope: wrapperRef }
  );

  useGSAP(
    () => {
      if (!mobilePanelRef.current) return;
      if (open) {
        gsap.fromTo(
          mobilePanelRef.current,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }
        );
        gsap.fromTo(
          mobilePanelRef.current.querySelectorAll(".m-link"),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.35, ease: "power3.out" }
        );
      }
    },
    { dependencies: [open] }
  );

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-x-0 top-5 z-50 flex justify-center px-4"
    >
      <div
        className={cn(
          "w-full max-w-[1300px] rounded-full transition-all duration-500",
          scrolled
            ? "border border-border-strong bg-surface/80 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.6)]"
            : "border border-transparent bg-transparent backdrop-blur-0"
        )}
      >
        <div className="flex items-center justify-between gap-6 px-3 py-2 sm:px-4">
          <a
            href="#top"
            className="nav-item flex items-center gap-2.5 pl-2 text-sm font-semibold tracking-tight"
          >
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-full ring-conic"
            >
              <span className="size-5 rounded-full bg-bg" />
            </span>
            <span>{nav.brand}</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="nav-item rounded-full px-3.5 py-1.5 text-[13px] uppercase tracking-[0.1em] text-fg-muted transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <span className="nav-item inline-block">
              <Button href={nav.cta.href} variant="primary" withArrow>
                {nav.cta.label}
              </Button>
            </span>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-full border border-border-strong bg-white/[0.04] text-fg md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>

        {open && (
          <div
            ref={mobilePanelRef}
            className="border-t border-border px-4 pb-4 pt-2 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {nav.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="m-link rounded-2xl px-4 py-3 text-sm uppercase tracking-wider text-fg-muted transition-colors hover:bg-white/[0.04] hover:text-fg"
                >
                  {l.label}
                </a>
              ))}
              <div className="m-link mt-2 flex justify-center">
                <Button href={nav.cta.href} variant="primary" withArrow>
                  {nav.cta.label}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
