import { ollamaChatJSON } from "@/lib/ai/ollama";
import { reviewerMessages } from "@/lib/ai/prompts";
import type {
  ReviewerInput,
  ReviewerOutput,
  VoteValue,
} from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clamp(v: unknown, lo: number, hi: number, dflt: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(lo, Math.min(hi, n));
}

function normalizeVote(v: unknown): VoteValue {
  if (v === "APPROVE" || v === "REJECT") return v;
  return "APPROVE";
}

function normalize(raw: unknown): ReviewerOutput {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    vote: normalizeVote(r.vote),
    confidence: clamp(r.confidence, 0, 1, 0.6),
    reasoning: String(r.reasoning ?? "").trim() || "No reasoning provided.",
  };
}

export async function POST(req: Request) {
  let input: ReviewerInput | { batch: ReviewerInput[] };
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Batch mode — call Ollama in parallel for each member.
    if ("batch" in input && Array.isArray(input.batch)) {
      const results = await Promise.all(
        input.batch.map(async (one) => {
          try {
            const raw = await ollamaChatJSON<unknown>({
              messages: reviewerMessages(one),
              temperature: 0.3,
            });
            return { member: one.member, ok: true, vote: normalize(raw) };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return { member: one.member, ok: false, error: message };
          }
        })
      );
      return Response.json({ results });
    }

    const single = input as ReviewerInput;
    const raw = await ollamaChatJSON<unknown>({
      messages: reviewerMessages(single),
      temperature: 0.3,
    });
    const vote = normalize(raw);
    return Response.json({ member: single.member, vote });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 502 });
  }
}
