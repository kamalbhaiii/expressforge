"""
Unified LLM provider abstraction — BYOK (Bring Your Own Key).

Supports: anthropic | openai | gemini
Each provider is a thin async adapter. The caller passes the provider name
and the user-supplied key; no server-side keys are used for generation.
"""

import asyncio
import logging
from typing import Protocol

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = frozenset({"anthropic", "openai", "gemini"})
DEFAULT_TIMEOUT = 20


class LLMProvider(Protocol):
    async def complete(self, prompt: str, timeout: int) -> str:
        ...


# ── Anthropic ─────────────────────────────────────────────────────────────────

class AnthropicProvider:
    def __init__(self, api_key: str) -> None:
        import anthropic  # lazy import — only needed when selected

        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    async def complete(self, prompt: str, timeout: int) -> str:
        message = await asyncio.wait_for(
            self._client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            ),
            timeout=timeout,
        )
        block = message.content[0]
        if block.type == "text":
            return block.text
        raise ValueError("Unexpected Anthropic response type")


# ── OpenAI ────────────────────────────────────────────────────────────────────

class OpenAIProvider:
    def __init__(self, api_key: str) -> None:
        from openai import AsyncOpenAI  # lazy import

        self._client = AsyncOpenAI(api_key=api_key)

    async def complete(self, prompt: str, timeout: int) -> str:
        response = await asyncio.wait_for(
            self._client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            ),
            timeout=timeout,
        )
        content = response.choices[0].message.content
        if content:
            return content
        raise ValueError("Empty OpenAI response")


# ── Gemini ────────────────────────────────────────────────────────────────────

class GeminiProvider:
    def __init__(self, api_key: str) -> None:
        import google.generativeai as genai  # lazy import

        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel("gemini-1.5-flash")

    async def complete(self, prompt: str, timeout: int) -> str:
        loop = asyncio.get_event_loop()
        # google-generativeai is sync; run in thread pool to keep FastAPI async
        response = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: self._model.generate_content(prompt)),
            timeout=timeout,
        )
        return response.text


# ── Factory ───────────────────────────────────────────────────────────────────

def get_provider(provider_name: str, api_key: str) -> LLMProvider:
    """Resolve provider by name. Raises ValueError for unknown providers."""
    match provider_name.lower():
        case "anthropic":
            return AnthropicProvider(api_key)
        case "openai":
            return OpenAIProvider(api_key)
        case "gemini":
            return GeminiProvider(api_key)
        case _:
            raise ValueError(
                f"Unknown provider '{provider_name}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_PROVIDERS))}"
            )
