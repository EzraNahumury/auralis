import { cn } from "@/lib/cn";
import { GlowCard } from "../ui/glow-card";

type Props = {
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; positive?: boolean };
  glow?: "violet" | "emerald" | "cyan";
  icon?: React.ReactNode;
};

export function StatCard({ label, value, hint, delta, glow = "violet", icon }: Props) {
  return (
    <GlowCard glow={glow} interactive>
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-fg-dim">{label}</p>
          {icon}
        </div>
        <p className="display text-3xl font-semibold text-fg">{value}</p>
        <div className="flex items-center gap-3 text-xs">
          {delta && (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 font-mono",
                delta.positive
                  ? "border-emerald/30 bg-emerald/[0.07] text-emerald-soft"
                  : "border-rose/30 bg-rose/[0.07] text-rose"
              )}
            >
              {delta.value}
            </span>
          )}
          {hint && <span className="text-fg-dim">{hint}</span>}
        </div>
      </div>
    </GlowCard>
  );
}
