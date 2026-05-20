"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  BalanceSnapshot,
  ChainProps,
  ProofBundle,
  ProofTx,
  StepState,
} from "@/lib/chain/types";
import {
  emptySteps,
  loadRecordedProof,
  proofToSteps,
} from "@/lib/chain/proof";

type Mode = "recorded" | "live";

interface ChainCtx {
  mode: Mode;
  setMode: (m: Mode) => void;
  proof: ProofBundle | null;
  steps: StepState[];
  running: boolean;
  liveError: string | null;
  balances: BalanceSnapshot | null;
  props: ChainProps | null;
  endpoint: string;
  setEndpoint: (e: string) => void;
  runLive: () => Promise<void>;
  resetSteps: () => void;
}

const defaultCtx: ChainCtx = {
  mode: "recorded",
  setMode: () => {},
  proof: null,
  steps: [],
  running: false,
  liveError: null,
  balances: null,
  props: null,
  endpoint: "wss://drip-node-production.up.railway.app",
  setEndpoint: () => {},
  runLive: async () => {},
  resetSteps: () => {},
};

const ChainContext = createContext<ChainCtx>(defaultCtx);

export function useChain() {
  return useContext(ChainContext);
}

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("recorded");
  const [proof, setProof] = useState<ProofBundle | null>(null);
  const [steps, setSteps] = useState<StepState[]>(emptySteps());
  const [running, setRunning] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [balances, setBalances] = useState<BalanceSnapshot | null>(null);
  const [props, setProps] = useState<ChainProps | null>(null);
  const [endpoint, setEndpoint] = useState(
    "wss://drip-node-production.up.railway.app"
  );
  const runningRef = useRef(false);

  // Load recorded proof bundle once.
  useEffect(() => {
    let alive = true;
    loadRecordedProof()
      .then((b) => {
        if (!alive) return;
        setProof(b);
        setSteps(proofToSteps(b));
        setProps(b.network);
      })
      .catch((err) => {
        // recorded proof is best-effort; UI works without it
        console.warn("Failed to load tx-proof.json", err);
      });
    return () => {
      alive = false;
    };
  }, []);

  const resetSteps = useCallback(() => {
    if (mode === "recorded" && proof) {
      setSteps(proofToSteps(proof));
    } else {
      setSteps(emptySteps());
    }
    setLiveError(null);
  }, [mode, proof]);

  // When mode flips between recorded ↔ live, snap the visible steps.
  useEffect(() => {
    if (mode === "recorded" && proof) {
      setSteps(proofToSteps(proof));
    } else if (mode === "live") {
      setSteps(emptySteps());
    }
  }, [mode, proof]);

  const runLive = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setLiveError(null);
    setSteps(emptySteps());

    try {
      const { runArisanFlow } = await import("@/lib/chain/client");
      const result = await runArisanFlow({
        endpoint,
        onProgress: (stepNum, partial) => {
          setSteps((prev) =>
            prev.map((s) => {
              if (s.step !== stepNum) return s;
              const next: StepState = { ...s };
              if (partial.phase === "started") {
                next.status = "inflight";
                next.startedAt = Date.now();
              } else if (partial.phase === "inflight") {
                next.status = "inflight";
              } else if (partial.phase === "confirmed") {
                next.status = "confirmed";
                next.txHash = partial.txHash;
                next.blockHash = partial.blockHash;
                next.blockNumber = partial.blockNumber;
                next.events = partial.events;
                next.finishedAt = Date.now();
              } else if (partial.phase === "failed") {
                next.status = "failed";
                next.error = partial.error;
                next.finishedAt = Date.now();
              }
              return next;
            })
          );
        },
      });
      setBalances(result.finalBalances);
      setProps(result.props);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setLiveError(msg);
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [endpoint]);

  const value = useMemo<ChainCtx>(
    () => ({
      mode,
      setMode,
      proof,
      steps,
      running,
      liveError,
      balances,
      props,
      endpoint,
      setEndpoint,
      runLive,
      resetSteps,
    }),
    [
      mode,
      proof,
      steps,
      running,
      liveError,
      balances,
      props,
      endpoint,
      runLive,
      resetSteps,
    ]
  );

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}
