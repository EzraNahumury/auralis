"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { fetchBalance } from "@/lib/chain/actions";

interface BalanceMap {
  [address: string]: { freePot: number; loadedAt: number };
}

interface ChainCtx {
  balances: BalanceMap;
  loadBalance: (address: string) => Promise<number | null>;
  loadBalances: (addresses: string[]) => Promise<void>;
  refreshBalance: (address: string) => Promise<void>;
}

const defaultCtx: ChainCtx = {
  balances: {},
  loadBalance: async () => null,
  loadBalances: async () => {},
  refreshBalance: async () => {},
};

const ChainContext = createContext<ChainCtx>(defaultCtx);

export function useChain() {
  return useContext(ChainContext);
}

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [balances, setBalances] = useState<BalanceMap>({});

  const loadBalance = useCallback(async (address: string) => {
    try {
      const r = await fetchBalance(address);
      setBalances((prev) => ({
        ...prev,
        [address]: { freePot: r.freePot, loadedAt: Date.now() },
      }));
      return r.freePot;
    } catch {
      return null;
    }
  }, []);

  const loadBalances = useCallback(
    async (addresses: string[]) => {
      const unique = Array.from(new Set(addresses));
      await Promise.all(unique.map((a) => loadBalance(a)));
    },
    [loadBalance]
  );

  const refreshBalance = useCallback(
    async (address: string) => {
      await loadBalance(address);
    },
    [loadBalance]
  );

  const value = useMemo<ChainCtx>(
    () => ({ balances, loadBalance, loadBalances, refreshBalance }),
    [balances, loadBalance, loadBalances, refreshBalance]
  );

  return (
    <ChainContext.Provider value={value}>{children}</ChainContext.Provider>
  );
}
