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
  ChainProps,
  ProofBundle,
  StepState,
} from "@/lib/chain/types";
import {
  emptySteps,
  loadRecordedProof,
  proofToSteps,
} from "@/lib/chain/proof";
import { runCompanion } from "@/lib/chain/companion-bridge";
import type {
  RequesterOutput,
  ReviewerOutput,
} from "@/lib/ai/schemas";
import {
  requestAIPrevalidation,
  requestAIVotes,
} from "@/lib/ai/client";
import {
  DEMO_REQUESTER_INPUT,
  REVIEWER_PROFILES,
  buildReviewerBatch,
} from "@/lib/ai/seed-context";
import type { MemberName } from "@/lib/avatars";
import { REQUESTER_VERDICT, REVIEWER_VOTES } from "@/lib/mock-ai";

type Mode = "recorded" | "live";

export interface BridgeLogLine {
  ts: number;
  line: string;
  stream?: string;
}

export type AIPhase = "idle" | "requester" | "reviewers" | "done" | "error";

export interface LiveReviewerVote {
  member: MemberName;
  policy: "Conservative" | "Trust-Default" | "Strict-Emergency";
  weight: number;
  vote: ReviewerOutput["vote"] | "PENDING";
  confidence: number;
  reasoning: string;
  error?: string;
}

interface ChainCtx {
  // Connection / proof
  mode: Mode;
  setMode: (m: Mode) => void;
  proof: ProofBundle | null;
  steps: StepState[];
  running: boolean;
  liveError: string | null;
  props: ChainProps | null;
  log: BridgeLogLine[];
  // AI
  aiPhase: AIPhase;
  aiError: string | null;
  requesterVerdict: RequesterOutput | null;
  reviewerVotes: LiveReviewerVote[];
  // Actions
  runLive: () => Promise<void>;
  runAI: () => Promise<RequesterOutput | null>;
  resetSteps: () => void;
}

// Map our mocked verdict to the same shape so initial UI is populated.
const SEED_REQUESTER: RequesterOutput = {
  confidence: REQUESTER_VERDICT.confidence,
  verdict: REQUESTER_VERDICT.verdict,
  routing: REQUESTER_VERDICT.routing,
  reasoning: REQUESTER_VERDICT.reasoning,
  checks: REQUESTER_VERDICT.checks,
};

const SEED_REVIEWERS: LiveReviewerVote[] = REVIEWER_VOTES.map((v) => ({
  member: v.member,
  policy: v.policy,
  weight: v.weight,
  vote: v.vote,
  confidence: v.confidence,
  reasoning: v.reasoning,
}));

function pendingReviewers(): LiveReviewerVote[] {
  return REVIEWER_PROFILES.map((p) => ({
    member: p.member,
    policy: p.policy,
    weight: p.weight,
    vote: "PENDING",
    confidence: 0,
    reasoning: "Reviewer Agent thinking…",
  }));
}

const defaultCtx: ChainCtx = {
  mode: "recorded",
  setMode: () => {},
  proof: null,
  steps: [],
  running: false,
  liveError: null,
  props: null,
  log: [],
  aiPhase: "idle",
  aiError: null,
  requesterVerdict: SEED_REQUESTER,
  reviewerVotes: SEED_REVIEWERS,
  runLive: async () => {},
  runAI: async () => null,
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
  const [props, setProps] = useState<ChainProps | null>(null);
  const [log, setLog] = useState<BridgeLogLine[]>([]);
  const [aiPhase, setAIPhase] = useState<AIPhase>("idle");
  const [aiError, setAIError] = useState<string | null>(null);
  const [requesterVerdict, setRequesterVerdict] = useState<RequesterOutput | null>(
    SEED_REQUESTER
  );
  const [reviewerVotes, setReviewerVotes] = useState<LiveReviewerVote[]>(
    SEED_REVIEWERS
  );
  const runningRef = useRef(false);

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
        console.warn("Failed to load tx-proof.json", err);
      });
    return () => {
      alive = false;
    };
  }, []);

  const resetSteps = useCallback(() => {
    if (mode === "recorded" && proof) setSteps(proofToSteps(proof));
    else setSteps(emptySteps());
    setLiveError(null);
    setLog([]);
  }, [mode, proof]);

  useEffect(() => {
    if (mode === "recorded" && proof) {
      setSteps(proofToSteps(proof));
      setRequesterVerdict(SEED_REQUESTER);
      setReviewerVotes(SEED_REVIEWERS);
      setAIPhase("idle");
    } else if (mode === "live") {
      setSteps(emptySteps());
    }
  }, [mode, proof]);

  const runAI = useCallback(async (): Promise<RequesterOutput | null> => {
    setAIError(null);
    setAIPhase("requester");
    setRequesterVerdict(null);
    setReviewerVotes(pendingReviewers());

    let verdict: RequesterOutput;
    try {
      verdict = await requestAIPrevalidation(DEMO_REQUESTER_INPUT);
      setRequesterVerdict(verdict);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAIError(msg);
      setAIPhase("error");
      // Restore seeded data so the UI isn't empty.
      setRequesterVerdict(SEED_REQUESTER);
      setReviewerVotes(SEED_REVIEWERS);
      return null;
    }

    setAIPhase("reviewers");
    try {
      const batch = buildReviewerBatch(verdict);
      const results = await requestAIVotes(batch);
      const next: LiveReviewerVote[] = REVIEWER_PROFILES.map((p) => {
        const found = results.find((r) => r.member === p.member);
        if (found?.ok && found.vote) {
          return {
            member: p.member,
            policy: p.policy,
            weight: p.weight,
            vote: found.vote.vote,
            confidence: found.vote.confidence,
            reasoning: found.vote.reasoning,
          };
        }
        return {
          member: p.member,
          policy: p.policy,
          weight: p.weight,
          vote: "PENDING",
          confidence: 0,
          reasoning: found?.error ?? "Reviewer Agent failed to respond.",
          error: found?.error,
        };
      });
      setReviewerVotes(next);
      setAIPhase("done");
      return verdict;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAIError(msg);
      setAIPhase("error");
      setReviewerVotes(SEED_REVIEWERS);
      return verdict;
    }
  }, []);

  const runLive = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setLiveError(null);
    setLog([]);
    setSteps(emptySteps());

    // 1. AI Pre-validation + Reviewer votes (graceful fallback if Ollama down).
    const verdict = await runAI();
    if (verdict && verdict.routing === "AUTO_REJECT") {
      setLiveError(
        "Requester Agent auto-rejected the request — skipping on-chain run."
      );
      runningRef.current = false;
      setRunning(false);
      return;
    }

    // 2. On-chain via companion bridge.
    try {
      await runCompanion({
        onStart: () =>
          setLog((l) => [
            ...l,
            { ts: Date.now(), line: "→ spawning companion script…" },
          ]),
        onLog: (d) =>
          setLog((l) => [
            ...l,
            { ts: Date.now(), line: d.line, stream: d.stream },
          ]),
        onStepStart: (d) =>
          setSteps((prev) =>
            prev.map((s) =>
              s.step === d.step
                ? {
                    ...s,
                    status: "inflight",
                    description: d.description,
                    startedAt: Date.now(),
                  }
                : s
            )
          ),
        onStepSkip: (d) =>
          setSteps((prev) =>
            prev.map((s) =>
              s.step === d.step
                ? { ...s, status: "confirmed", finishedAt: Date.now() }
                : s
            )
          ),
        onStepTx: (d) =>
          setSteps((prev) =>
            prev.map((s) =>
              s.step === d.step ? { ...s, txHash: d.txHash } : s
            )
          ),
        onStepBlock: (d) =>
          setSteps((prev) =>
            prev.map((s) =>
              s.step === d.step
                ? {
                    ...s,
                    status: "confirmed",
                    blockNumber: d.blockNumber,
                    finishedAt: Date.now(),
                  }
                : s
            )
          ),
        onComplete: (d) => {
          setProof(d.proof);
          setProps(d.proof.network);
          setSteps(proofToSteps(d.proof));
        },
        onError: (d) => setLiveError(d.message),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLiveError(msg);
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [runAI]);

  const value = useMemo<ChainCtx>(
    () => ({
      mode,
      setMode,
      proof,
      steps,
      running,
      liveError,
      props,
      log,
      aiPhase,
      aiError,
      requesterVerdict,
      reviewerVotes,
      runLive,
      runAI,
      resetSteps,
    }),
    [
      mode,
      proof,
      steps,
      running,
      liveError,
      props,
      log,
      aiPhase,
      aiError,
      requesterVerdict,
      reviewerVotes,
      runLive,
      runAI,
      resetSteps,
    ]
  );

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}
