"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useChain } from "@/components/providers/chain-provider";
import { AVATARS } from "@/lib/avatars";
import { formatBalance, shortAddress } from "@/lib/chain/format";
import { LogOut, Copy, RefreshCw } from "lucide-react";

const POLL_INTERVAL_MS = 20_000;

export function Topbar() {
  const { user, address, signOut } = useSession();
  const { balances, loadBalance } = useChain();
  const avatar = user ? AVATARS[user] : null;
  const balance = address ? balances[address]?.freePot : undefined;
  const loadedAt = address ? balances[address]?.loadedAt : undefined;

  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [flash, setFlash] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevBalance = useRef<number | null>(null);

  // Initial + interval poll of own balance.
  useEffect(() => {
    if (!address) return;
    loadBalance(address);
    const t = setInterval(() => loadBalance(address), POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [address, loadBalance]);

  // Briefly flash when balance changes to draw attention to it.
  useEffect(() => {
    if (balance === undefined) return;
    if (prevBalance.current !== null && prevBalance.current !== balance) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1400);
      return () => clearTimeout(t);
    }
    prevBalance.current = balance;
  }, [balance]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const copyAddress = () => {
    if (address) navigator.clipboard?.writeText(address);
  };

  const refresh = async () => {
    if (!address || refreshing) return;
    setRefreshing(true);
    try {
      await loadBalance(address);
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const balanceChanged = balance !== undefined && balance !== prevBalance.current;
  const delta =
    prevBalance.current !== null && balance !== undefined
      ? balance - prevBalance.current
      : 0;

  return (
    <header className="border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-8 lg:px-12">
        <div className="flex items-center gap-2 text-[12px] text-fg-dim">
          <span className="relative inline-flex size-2">
            <span
              className="absolute inset-0 animate-ping rounded-full bg-emerald/40"
              aria-hidden
            />
            <span
              className="relative size-2 rounded-full bg-emerald"
              aria-hidden
            />
          </span>
          <span>Live</span>
          <span className="text-fg-dim/60">·</span>
          <span>Portaldot dev</span>
        </div>

        {user && avatar && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center gap-2.5 rounded-full border bg-surface/60 py-1 pl-1 pr-3 transition-all duration-300 hover:border-fg-dim hover:bg-surface/80 ${
                flash
                  ? "border-emerald/60 shadow-[0_0_0_2px_rgba(75,213,170,0.18)]"
                  : "border-border"
              }`}
            >
              <span
                className="grid size-7 place-items-center rounded-full text-[15px] shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                style={{ background: avatar.bg }}
                aria-label={user}
              >
                {avatar.emoji}
              </span>
              <span className="text-[13px] text-fg">{user}</span>
              <span className="text-fg-dim/60">·</span>
              <span
                className={`tabular-nums text-[12px] transition-colors ${
                  flash ? "text-emerald-soft" : "text-fg-muted"
                }`}
                style={{
                  fontFamily:
                    "var(--font-geist-mono), ui-monospace, monospace",
                }}
                title={
                  balance !== undefined
                    ? `${balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} POT`
                    : "loading…"
                }
              >
                {formatBalance(balance)}
                <span className="ml-0.5 text-fg-dim">POT</span>
              </span>
              <span className="text-[10px] text-fg-dim">▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[300px] rounded-2xl border border-border bg-[#0f0f0f] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)] soft-rise">
                <div className="border-b border-border p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-10 place-items-center rounded-full text-[20px]"
                      style={{ background: avatar.bg }}
                    >
                      {avatar.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-fg">
                        {user}
                      </p>
                      <p className="text-[11px] text-fg-muted">
                        Signed in via //{user.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-bg/40 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-fg-dim">
                        Balance
                      </p>
                      <button
                        type="button"
                        onClick={refresh}
                        disabled={refreshing}
                        className="grid size-5 place-items-center rounded text-fg-dim transition-colors hover:text-fg disabled:opacity-50"
                        title="Refresh balance"
                        aria-label="Refresh balance"
                      >
                        <RefreshCw
                          className={`size-3 ${refreshing ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>
                    <p
                      className={`mt-1 tabular-nums text-[20px] font-medium transition-colors ${
                        flash ? "text-emerald-soft" : "text-fg"
                      }`}
                    >
                      {balance !== undefined ? (
                        <>
                          {balance.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}
                        </>
                      ) : (
                        <span className="text-fg-dim">loading…</span>
                      )}
                      <span className="ml-1 text-[12px] text-fg-muted">
                        POT
                      </span>
                    </p>
                    {balanceChanged && Math.abs(delta) > 0.0001 && (
                      <p
                        className={`mt-0.5 text-[11px] tabular-nums ${
                          delta > 0 ? "text-emerald-soft" : "text-rose"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}{" "}
                        POT
                      </p>
                    )}
                    {loadedAt && (
                      <p className="mt-2 text-[10px] text-fg-dim">
                        updated{" "}
                        {Math.floor((Date.now() - loadedAt) / 1000)}s ago
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={copyAddress}
                    className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-bg/40 px-3 py-2 text-left text-[11px] text-fg-muted transition-colors hover:border-fg-dim hover:text-fg"
                    title="Copy address"
                  >
                    <code
                      className="truncate"
                      style={{
                        fontFamily:
                          "var(--font-geist-mono), ui-monospace, monospace",
                      }}
                    >
                      {address ? shortAddress(address) : "—"}
                    </code>
                    <Copy className="size-3 shrink-0 text-fg-dim" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-b-2xl px-4 py-3 text-left text-[13px] text-fg-muted transition-colors hover:bg-white/[0.03] hover:text-fg"
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
