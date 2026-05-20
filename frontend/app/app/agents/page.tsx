"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { cn } from "@/lib/cn";

const policies = [
  {
    id: "conservative",
    name: "Careful",
    description:
      "Approve only when the request looks clean across the board. Slower decisions, fewer mistakes.",
  },
  {
    id: "balanced",
    name: "Balanced",
    description:
      "The default. Approves when reputation, payment history and reason line up.",
  },
  {
    id: "emergency",
    name: "Emergencies only",
    description:
      "Approves only verified emergencies — hospital, accident, school fee deadline.",
  },
];

export default function Agents() {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState("balanced");

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".fade-in"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="flex flex-col gap-14">
      <header className="fade-in">
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          How should your agent vote?
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          Every member has a small AI helper that reviews every payout
          request. It looks at deposit history, reputation, and the reason
          given — then votes for you. You can change how strict it is here.
        </p>
      </header>

      <section className="fade-in flex flex-col gap-3">
        {policies.map((p) => {
          const active = p.id === selected;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={cn(
                "flex items-start gap-5 rounded-2xl border bg-[#141414] px-6 py-5 text-left transition-colors",
                active
                  ? "border-fg-muted"
                  : "border-border hover:border-fg-dim"
              )}
            >
              <span
                className={cn(
                  "mt-1 grid size-4 place-items-center rounded-full border",
                  active ? "border-fg" : "border-fg-dim"
                )}
              >
                {active && <span className="size-2 rounded-full bg-fg" />}
              </span>
              <div>
                <p className="text-[15px] font-medium text-fg">{p.name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
                  {p.description}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      <section className="fade-in text-[13px] leading-relaxed text-fg-muted">
        <p>
          The agent only votes on your behalf — the final decision still
          belongs to the group. Two of three signatures are needed before any
          pot moves. So even a careless agent can&rsquo;t hurt the group on
          its own.
        </p>
      </section>
    </div>
  );
}
