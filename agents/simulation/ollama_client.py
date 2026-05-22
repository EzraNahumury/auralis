"""Minimal Ollama chat client.

Port of `frontend/lib/ai/ollama.ts` so behavior is identical between the
Python BE and the TypeScript FE: forces `format: "json"` and a low
temperature for repeatable verdicts.

Supports both local daemon (no key) and Ollama Cloud (Bearer token).
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Literal

import requests

DEFAULT_HOST = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"

Role = Literal["system", "user", "assistant"]


@dataclass
class Message:
    role: Role
    content: str

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


@dataclass
class ChatResult:
    content: str
    model: str
    total_duration_ms: float


def ollama_host() -> str:
    host = os.environ.get("OLLAMA_HOST", DEFAULT_HOST)
    return host.rstrip("/")


def ollama_model() -> str:
    return os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)


def ollama_key() -> str | None:
    k = (os.environ.get("OLLAMA_KEY") or os.environ.get("OLLAMA_API_KEY") or "").strip()
    return k or None


class OllamaUnreachable(RuntimeError):
    """The Ollama daemon could not be reached. Caller may decide to mock."""


class OllamaInvalidJSON(ValueError):
    """The model returned text that could not be parsed as JSON."""


def chat(
    messages: list[Message],
    *,
    model: str | None = None,
    temperature: float = 0.2,
    timeout: int = 120,
) -> ChatResult:
    """Single non-streaming chat completion. Returns the raw `content` text."""

    host = ollama_host()
    use_model = model or ollama_model()
    api_key = ollama_key()

    body = {
        "model": use_model,
        "messages": [m.to_dict() for m in messages],
        "format": "json",
        "stream": False,
        "options": {"temperature": temperature},
    }
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        res = requests.post(
            f"{host}/api/chat",
            headers=headers,
            data=json.dumps(body),
            timeout=timeout,
        )
    except requests.exceptions.RequestException as e:
        raise OllamaUnreachable(
            f"Could not reach Ollama at {host} — is it running? ({e})"
        ) from e

    if not res.ok:
        raise RuntimeError(f"Ollama {res.status_code}: {res.text or res.reason}")

    data = res.json()
    return ChatResult(
        content=(data.get("message") or {}).get("content", ""),
        model=use_model,
        total_duration_ms=(data.get("total_duration") or 0) / 1e6,
    )


def chat_json(
    messages: list[Message],
    *,
    model: str | None = None,
    temperature: float = 0.2,
    timeout: int = 120,
) -> dict:
    """Chat + parse content as JSON, with a markdown-fence recovery pass."""

    result = chat(messages, model=model, temperature=temperature, timeout=timeout)
    raw = result.content.strip()

    # Some models wrap JSON in ```json ... ``` despite format:"json".
    if raw.startswith("```"):
        raw = raw.lstrip("`")
        # Strip optional "json" language tag at the start of the fence.
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.rstrip("`").strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise OllamaInvalidJSON(
            f"Ollama returned non-JSON output: {e}\n\nFirst 500 chars: {raw[:500]}"
        ) from e
