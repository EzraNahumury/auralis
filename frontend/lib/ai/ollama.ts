// Minimal Ollama chat client. Server-side only — calls the user's local
// Ollama daemon at OLLAMA_HOST (default http://localhost:11434).
//
// We force `format: "json"` so the model returns strict JSON we can parse,
// and set a low temperature for repeatable verdicts.

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatRequest {
  model?: string;
  messages: OllamaMessage[];
  temperature?: number;
  /** Pass the JSON schema to Ollama as a hint (some models honor it). */
  schemaHint?: object;
}

export interface OllamaChatResult {
  content: string;
  model: string;
  totalDurationMs: number;
}

const DEFAULT_HOST = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.2";

export function ollamaHost(): string {
  // Trim trailing slash so we can always append "/api/chat" safely.
  return (process.env.OLLAMA_HOST ?? DEFAULT_HOST).replace(/\/+$/, "");
}

export function ollamaModel(): string {
  return process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
}

export function ollamaKey(): string | null {
  const k = process.env.OLLAMA_KEY ?? process.env.OLLAMA_API_KEY ?? "";
  return k.trim() ? k.trim() : null;
}

export async function ollamaChat(req: OllamaChatRequest): Promise<OllamaChatResult> {
  const host = ollamaHost();
  const model = req.model ?? ollamaModel();
  const apiKey = ollamaKey();

  const body = {
    model,
    messages: req.messages,
    format: "json",
    stream: false,
    options: {
      temperature: req.temperature ?? 0.2,
    },
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Ollama Cloud requires Bearer auth; local daemon ignores extra headers.
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  let res: Response;
  try {
    res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not reach Ollama at ${host} — is it running? (${msg})`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama ${res.status}: ${text || res.statusText}`);
  }

  const json = (await res.json()) as {
    message?: { content: string };
    total_duration?: number;
  };

  return {
    content: json.message?.content ?? "",
    model,
    totalDurationMs: json.total_duration ? json.total_duration / 1e6 : 0,
  };
}

/**
 * Helper: ollamaChat + JSON.parse with a recovery pass that strips
 * markdown fences if the model wraps its output in ``` blocks anyway.
 */
export async function ollamaChatJSON<T>(req: OllamaChatRequest): Promise<T> {
  const { content } = await ollamaChat(req);
  let raw = content.trim();
  // Some models wrap JSON in ```json ... ``` despite format:"json".
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(
      `Ollama returned non-JSON output: ${(err as Error).message}\n\n` +
        `First 500 chars: ${raw.slice(0, 500)}`
    );
  }
}
