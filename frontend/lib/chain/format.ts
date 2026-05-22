export function formatBalance(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}k`;
  if (amount >= 1) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return amount.toFixed(4);
}

export function shortHash(h: string | undefined, head = 8, tail = 6): string {
  if (!h) return "—";
  if (h.length <= head + tail + 1) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function shortAddress(addr: string | undefined): string {
  return shortHash(addr, 6, 4);
}

export function formatPot(planck: bigint, decimals = 12, symbol = "POT"): string {
  const factor = 10n ** BigInt(decimals);
  const whole = planck / factor;
  const frac = planck % factor;
  if (frac === 0n) return `${whole.toLocaleString()} ${symbol}`;
  const fracStr = frac
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")
    .slice(0, 4);
  return `${whole.toLocaleString()}.${fracStr} ${symbol}`;
}

export function toPlanck(whole: number, decimals = 12): bigint {
  // Multiply via string to keep precision for non-integer "whole" values.
  const [int, frac = ""] = String(whole).split(".");
  const paddedFrac = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(int + paddedFrac);
}

export function relTime(unixMs: number): string {
  const diff = Date.now() - unixMs;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
