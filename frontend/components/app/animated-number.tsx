"use client";

import { useCountUp } from "@/lib/use-count-up";

export function AnimatedNumber({
  value,
  duration = 1400,
  format = "integer",
  className,
}: {
  value: number;
  duration?: number;
  format?: "integer" | "decimal";
  className?: string;
}) {
  const v = useCountUp(value, duration);
  const display =
    format === "decimal" ? v.toFixed(2) : Math.round(v).toLocaleString();
  return <span className={className}>{display}</span>;
}
