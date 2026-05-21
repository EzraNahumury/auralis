import { ollamaChatJSON } from "@/lib/ai/ollama";
import { requesterMessages } from "@/lib/ai/prompts";
import type {
  RequesterInput,
  RequesterOutput,
  Routing,
  Verdict,
} from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECK_WEIGHTS: Record<string, number> = {
  "Deposit consistency": 25,
  "Reputation score": 25,
  "Cross-group history": 15,
  "Reason plausibility": 15,
  "Emergency flag": 10,
  "Outstanding debts": 10,
};

function clamp(v: unknown, lo: number, hi: number, dflt: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}

function normalizeRouting(r: unknown, confidence: number): Routing {
  if (r === "HYBRID_FAST_TRACK" || r === "NORMAL" || r === "AUTO_REJECT") return r;
  if (confidence >= 0.85) return "HYBRID_FAST_TRACK";
  if (confidence >= 0.5) return "NORMAL";
  return "AUTO_REJECT";
}

function normalizeVerdict(v: unknown, routing: Routing): Verdict {
  if (v === "PASS" || v === "REJECT") return v;
  return routing === "AUTO_REJECT" ? "REJECT" : "PASS";
}

function normalize(raw: unknown): RequesterOutput {
  const r = (raw ?? {}) as Record<string, unknown>;
  const confidence = clamp(r.confidence, 0, 1, 0.5);
  const routing = normalizeRouting(r.routing, confidence);
  const verdict = normalizeVerdict(r.verdict, routing);

  const reasoning = Array.isArray(r.reasoning)
    ? (r.reasoning as unknown[])
        .map((x) => String(x))
        .filter((x) => x.length > 0)
        .slice(0, 4)
    : [];

  const rawChecks = Array.isArray(r.checks)
    ? (r.checks as unknown[]).map((c) => (c ?? {}) as Record<string, unknown>)
    : [];

  // Coerce checks into the 6 required rows, even if the model omitted some.
  const checks = Object.entries(CHECK_WEIGHTS).map(([label, weight]) => {
    const match = rawChecks.find(
      (c) => String(c.label ?? "").toLowerCase() === label.toLowerCase()
    );
    return {
      label,
      value: String(match?.value ?? "—"),
      weight,
      ok: match?.ok === true,
    };
  });

  return { confidence, verdict, routing, reasoning, checks };
}

export async function POST(req: Request) {
  let input: RequesterInput;
  try {
    input = (await req.json()) as RequesterInput;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const raw = await ollamaChatJSON<unknown>({
      messages: requesterMessages(input),
      temperature: 0.2,
    });
    const verdict = normalize(raw);
    return Response.json(verdict);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 502 });
  }
}
