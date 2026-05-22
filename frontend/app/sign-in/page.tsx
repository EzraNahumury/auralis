"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { AVATARS, type MemberName } from "@/lib/avatars";
import { useSession } from "@/components/providers/session-provider";
import { knownAddress } from "@/lib/session/derive";
import { shortAddress } from "@/lib/chain/format";

interface AccountChoice {
  name: MemberName;
  role: string;
  reputation: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
}

const ACCOUNTS: AccountChoice[] = [
  { name: "Alice", role: "Founder · proposer", reputation: 887, tier: "Platinum" },
  { name: "Bob", role: "Member · approver", reputation: 645, tier: "Gold" },
  { name: "Charlie", role: "Member", reputation: 521, tier: "Gold" },
  { name: "Dave", role: "Round 1 recipient", reputation: 412, tier: "Silver" },
];

export default function SignInPage() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signIn, ready } = useSession();
  const [pending, setPending] = useState<MemberName | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, bounce to /app.
  useEffect(() => {
    if (ready && user) router.replace("/app");
  }, [ready, user, router]);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".si-anim"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.8, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  const onPick = async (name: MemberName) => {
    if (pending) return;
    setError(null);
    setPending(name);
    try {
      await signIn(name);
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      {/* ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 -top-1/4 size-[640px] rounded-full opacity-60 blur-3xl ambient-orbit"
        style={{
          background:
            "radial-gradient(circle, rgba(145,129,245,0.16) 0%, rgba(145,129,245,0) 60%)",
        }}
      />

      <div ref={ref} className="relative mx-auto flex min-h-screen max-w-[920px] flex-col px-8 py-16 lg:px-12">
        <header className="si-anim flex items-center justify-between">
          <Link href="/" className="block">
            <p className="text-[16px] font-semibold tracking-tight text-fg">
              Auralis
            </p>
            <p className="mt-0.5 text-[12px] text-fg-dim">Arisan, on chain.</p>
          </Link>
          <Link
            href="/"
            className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            ← Back to site
          </Link>
        </header>

        <main className="mt-24 flex flex-col gap-12">
          <div className="si-anim max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-violet-soft">
              Sign in
            </p>
            <h1 className="mt-3 text-[40px] font-semibold leading-tight tracking-tight text-fg sm:text-[48px]">
              Who are you joining as today?
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fg-muted">
              For this demo round, four pre-funded Portaldot dev keys
              participate in <span className="text-fg">Arisan Tetangga RT 03</span>.
              Picking one signs you in with the matching sr25519 keypair —
              everything you sign from here actually lands on chain.
            </p>
          </div>

          <ul className="si-anim grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ACCOUNTS.map((acc) => {
              const avatar = AVATARS[acc.name];
              const address = knownAddress(acc.name);
              const isPending = pending === acc.name;
              const disabled = !!pending;
              return (
                <li key={acc.name}>
                  <button
                    type="button"
                    onClick={() => onPick(acc.name)}
                    disabled={disabled}
                    className={`group flex w-full items-center gap-4 rounded-2xl border border-border bg-[#141414] p-5 text-left transition-all duration-300 ${
                      disabled
                        ? "opacity-60"
                        : "hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <span
                      className="grid size-14 place-items-center rounded-full text-[28px] shadow-[0_6px_24px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-[1.04]"
                      style={{ background: avatar.bg }}
                      aria-label={acc.name}
                    >
                      {avatar.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold tracking-tight text-fg">
                        {acc.name}
                      </p>
                      <p className="text-[12px] text-fg-muted">{acc.role}</p>
                      <code
                        className="mt-1.5 block break-all text-[11px] text-fg-dim"
                        style={{
                          fontFamily:
                            "var(--font-geist-mono), ui-monospace, monospace",
                        }}
                      >
                        {shortAddress(address)}
                      </code>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[18px] font-semibold tabular-nums text-fg">
                        {acc.reputation}
                      </p>
                      <p className="text-[11px] text-fg-dim">{acc.tier}</p>
                      {isPending && (
                        <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-amber">
                          <span className="relative inline-flex size-1.5">
                            <span className="absolute inset-0 animate-ping rounded-full bg-amber/50" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-amber" />
                          </span>
                          deriving…
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {error && (
            <p className="si-anim text-[12px] text-rose">{error}</p>
          )}

          <p className="si-anim mt-6 max-w-xl text-[12px] leading-relaxed text-fg-dim">
            Dev keys (//Alice, //Bob, //Charlie, //Dave) are deterministic
            and well-known on Portaldot&rsquo;s dev chain. Nothing private
            lives in this picker. Each pick derives the keypair with
            <code
              className="mx-1 text-fg-muted"
              style={{
                fontFamily:
                  "var(--font-geist-mono), ui-monospace, monospace",
              }}
            >
              @polkadot/keyring
            </code>
            and stores only the public address in your browser.
          </p>
        </main>
      </div>
    </div>
  );
}
