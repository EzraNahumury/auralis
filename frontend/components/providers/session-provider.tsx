"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { MemberName } from "@/lib/avatars";
import { deriveDevAddress, knownAddress } from "@/lib/session/derive";

const STORAGE_KEY = "auralis:session:v1";

interface SessionPayload {
  user: MemberName;
  address: string;
  signedInAt: number;
}

interface SessionCtx {
  user: MemberName | null;
  address: string | null;
  ready: boolean;
  signIn: (name: MemberName) => Promise<void>;
  signOut: () => void;
}

const defaultCtx: SessionCtx = {
  user: null,
  address: null,
  ready: false,
  signIn: async () => {},
  signOut: () => {},
};

const SessionContext = createContext<SessionCtx>(defaultCtx);

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<SessionPayload | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (raw) {
        const parsed = JSON.parse(raw) as SessionPayload;
        if (parsed.user && parsed.address) setPayload(parsed);
      }
    } catch {
      // ignore malformed payload
    }
    setReady(true);
  }, []);

  const signIn = useCallback(async (name: MemberName) => {
    // We derive the address with verification so the user actually sees
    // the keypair work — even though we cache the known dev addresses.
    const address = await deriveDevAddress(name, { verify: true });
    const next: SessionPayload = {
      user: name,
      address,
      signedInAt: Date.now(),
    };
    setPayload(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — session is in-memory only.
    }
  }, []);

  const signOut = useCallback(() => {
    setPayload(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    router.replace("/sign-in");
  }, [router]);

  const value = useMemo<SessionCtx>(
    () => ({
      user: payload?.user ?? null,
      address: payload?.address ?? null,
      ready,
      signIn,
      signOut,
    }),
    [payload, ready, signIn, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/**
 * Drop-in component that redirects to /sign-in if no session is present.
 * Place near the top of the /app route layout.
 */
export function RequireSession({ children }: { children: React.ReactNode }) {
  const { user, ready } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user && !pathname.startsWith("/sign-in")) {
      router.replace("/sign-in");
    }
  }, [ready, user, router, pathname]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <p className="text-[12px] text-fg-dim">Loading session…</p>
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}

// Quick non-hook helper used by API consumers (e.g. building Requester input)
// — but most components should use useSession() directly.
export function readKnownAddress(name: MemberName): string {
  return knownAddress(name);
}
