"use client";

import { useChain } from "@/components/providers/chain-provider";

export function LiveProgress() {
  const { steps } = useChain();
  return (
    <div className="flex items-center gap-2.5">
      {steps.map((s) => {
        const dotClass =
          s.status === "confirmed"
            ? "size-2.5 rounded-full bg-emerald shadow-[0_0_14px_rgba(108,242,204,0.55)]"
            : s.status === "inflight"
              ? "size-2.5 rounded-full bg-amber breathe"
              : s.status === "failed"
                ? "size-2.5 rounded-full bg-rose"
                : "size-2.5 rounded-full bg-white/[0.08]";
        return (
          <div key={s.step} className="flex items-center gap-2.5">
            <span className={dotClass} aria-hidden />
            {s.step < 5 && (
              <span
                className={`block h-px w-6 ${
                  s.status === "confirmed"
                    ? "bg-emerald/40"
                    : "bg-white/[0.08]"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
