"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { AVATARS, type MemberName } from "@/lib/avatars";
import { ALL_MEMBERS, defaultThreshold } from "@/lib/groups/types";
import { newGroupId, saveGroup } from "@/lib/groups/store";
import { knownAddress } from "@/lib/session/derive";
import { deriveMultisigAddress } from "@/lib/chain/multisig";
import { shortAddress } from "@/lib/chain/format";
import { useSession } from "@/components/providers/session-provider";

export default function NewGroup() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useSession();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contribution, setContribution] = useState<number>(100);
  const [totalRounds, setTotalRounds] = useState<number>(4);
  const [roundDays, setRoundDays] = useState<number>(30);
  const [selected, setSelected] = useState<MemberName[]>(
    user ? [user, ...ALL_MEMBERS.filter((m) => m !== user).slice(0, 2)] : ["Alice", "Bob", "Charlie"]
  );
  const [threshold, setThreshold] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewAddress, setPreviewAddress] = useState<string | null>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".fade-in"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: "expo.out" }
      );
    },
    { scope: ref }
  );

  useEffect(() => {
    if (selected.length < 2) return;
    setThreshold((t) => {
      const fresh = defaultThreshold(selected.length);
      if (t < 2) return 2;
      if (t > selected.length) return selected.length;
      return t === 0 ? fresh : t;
    });
  }, [selected.length]);

  useEffect(() => {
    let cancelled = false;
    if (selected.length < 2) {
      setPreviewAddress(null);
      return;
    }
    const addrs = selected.map((m) => knownAddress(m));
    deriveMultisigAddress(addrs, threshold, 42)
      .then((r) => {
        if (!cancelled) setPreviewAddress(r.multisigAddress);
      })
      .catch(() => {
        if (!cancelled) setPreviewAddress(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, threshold]);

  const totalPot = useMemo(
    () => contribution * selected.length,
    [contribution, selected.length]
  );

  const canSubmit =
    !!user &&
    name.trim().length > 1 &&
    selected.length >= 2 &&
    threshold >= 2 &&
    threshold <= selected.length &&
    contribution > 0 &&
    totalRounds >= 1 &&
    !!previewAddress &&
    !submitting;

  const toggleMember = (m: MemberName) => {
    // Founder is always part of the group.
    if (user && m === user) return;
    setSelected((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !previewAddress || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = newGroupId();
      saveGroup({
        id,
        name: name.trim(),
        description:
          description.trim() ||
          `${selected.length}-member Arisan, ${threshold}-of-${selected.length} multisig.`,
        contributionPot: contribution,
        totalRounds,
        currentRound: 1,
        members: selected,
        threshold,
        multisigAddress: previewAddress,
        founder: user,
        roundDays,
        status: "collecting",
        createdAt: Date.now(),
      });
      router.replace(`/app/groups/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div ref={ref} className="flex flex-col gap-10">
      <header className="fade-in">
        <Link
          href="/app/groups"
          className="text-[12px] text-fg-dim underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
        >
          ← Groups
        </Link>
        <h1 className="mt-5 text-[34px] font-semibold leading-tight tracking-tight text-fg sm:text-[40px]">
          Start a new group
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-muted">
          Invite a few people, agree on what each person contributes per
          round, and how many approvals it takes to release the pot. The
          multisig address is derived from your choices.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-10">
        <section className="fade-in flex flex-col gap-3">
          <label
            htmlFor="name"
            className="text-[12px] uppercase tracking-[0.14em] text-fg-dim"
          >
            Group name
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={64}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arisan Kantor Lt 5"
            className="rounded-xl border border-border bg-[#141414] px-4 py-3 text-[16px] text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-fg-dim"
          />
        </section>

        <section className="fade-in flex flex-col gap-3">
          <label
            htmlFor="description"
            className="text-[12px] uppercase tracking-[0.14em] text-fg-dim"
          >
            Description{" "}
            <span className="ml-1 text-fg-dim normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <textarea
            id="description"
            maxLength={240}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this Arisan for? Office, neighborhood, family…"
            className="resize-none rounded-xl border border-border bg-[#141414] px-4 py-3 text-[14px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-fg-dim"
          />
        </section>

        <section className="fade-in grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <label
              htmlFor="contribution"
              className="text-[12px] uppercase tracking-[0.14em] text-fg-dim"
            >
              Each member pays
            </label>
            <div className="relative">
              <input
                id="contribution"
                type="number"
                min={1}
                max={10000}
                required
                value={contribution}
                onChange={(e) => setContribution(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-border bg-[#141414] px-4 py-3 pr-14 text-[16px] tabular-nums text-fg outline-none transition-colors focus:border-fg-dim"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-fg-muted">
                POT
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label
              htmlFor="rounds"
              className="text-[12px] uppercase tracking-[0.14em] text-fg-dim"
            >
              Number of rounds
            </label>
            <input
              id="rounds"
              type="number"
              min={1}
              max={24}
              required
              value={totalRounds}
              onChange={(e) => setTotalRounds(Number(e.target.value || 0))}
              className="rounded-xl border border-border bg-[#141414] px-4 py-3 text-[16px] tabular-nums text-fg outline-none transition-colors focus:border-fg-dim"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label
              htmlFor="cadence"
              className="text-[12px] uppercase tracking-[0.14em] text-fg-dim"
            >
              One round every
            </label>
            <div className="relative">
              <input
                id="cadence"
                type="number"
                min={1}
                max={365}
                required
                value={roundDays}
                onChange={(e) => setRoundDays(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-border bg-[#141414] px-4 py-3 pr-16 text-[16px] tabular-nums text-fg outline-none transition-colors focus:border-fg-dim"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-fg-muted">
                days
              </span>
            </div>
          </div>
        </section>

        <section className="fade-in flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <label className="text-[12px] uppercase tracking-[0.14em] text-fg-dim">
              Members
            </label>
            <p className="text-[12px] text-fg-muted">
              {selected.length} picked · pot {totalPot} POT per round
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALL_MEMBERS.map((m) => {
              const avatar = AVATARS[m];
              const on = selected.includes(m);
              const isYou = m === user;
              return (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => toggleMember(m)}
                    disabled={isYou}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      isYou
                        ? "border-violet/60 bg-violet/[0.08] cursor-default"
                        : on
                          ? "border-violet/60 bg-violet/[0.06]"
                          : "border-border bg-[#141414] hover:border-fg-dim"
                    }`}
                  >
                    <span
                      className="grid size-9 place-items-center rounded-full text-[18px]"
                      style={{ background: avatar.bg }}
                      aria-hidden
                    >
                      {avatar.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
                        {m}
                        {isYou && (
                          <span className="rounded-full bg-violet/15 px-1.5 py-0 text-[9px] uppercase tracking-[0.1em] text-violet-soft">
                            you
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-fg-dim">
                        {isYou
                          ? "Founder"
                          : on
                            ? "Invited"
                            : "Tap to invite"}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected.length < 2 && (
            <p className="text-[12px] text-amber">
              Invite at least 1 more member.
            </p>
          )}
        </section>

        <section className="fade-in flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="threshold"
              className="text-[12px] uppercase tracking-[0.14em] text-fg-dim"
            >
              Approvals needed to release the pot
            </label>
            <p className="text-[12px] text-fg-muted">
              <span className="text-fg">{threshold}</span> of{" "}
              <span className="text-fg">{selected.length}</span>
            </p>
          </div>
          <input
            id="threshold"
            type="range"
            min={Math.min(2, selected.length)}
            max={Math.max(2, selected.length)}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            disabled={selected.length < 2}
            className="accent-violet"
          />
        </section>

        <section className="fade-in rounded-2xl border border-border bg-[#141414] p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-fg-dim">
            Derived multisig address
          </p>
          <code
            className="mt-2 block break-all text-[13px] text-fg"
            style={{
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            }}
          >
            {previewAddress
              ? `${shortAddress(previewAddress)} · ${previewAddress}`
              : "—"}
          </code>
          <p className="mt-3 text-[12px] text-fg-muted">
            Computed in your browser from{" "}
            <span className="text-fg">{selected.length}</span> signatories,
            threshold <span className="text-fg">{threshold}</span>. All
            members will deposit and receive payouts here on Portaldot.
          </p>
        </section>

        {error && <p className="fade-in text-[13px] text-rose">{error}</p>}

        <div className="fade-in flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[14px] font-medium text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? "Creating…" : "Create group"}
          </button>
          <Link
            href="/app/groups"
            className="text-[12px] text-fg-muted underline decoration-fg-dim underline-offset-4 transition-colors hover:text-fg"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
