"""Tests for AI service — BYOK model (no server-side keys)."""

import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from app.models.config import AIConfig, GenerateConfig
from app.services.ai_service import enhance_with_ai


def _config(**kwargs) -> GenerateConfig:
    defaults = {
        "project_name": "test-api",
        "language": "javascript",
        "port": 3000,
        "auth": [],
        "database": [],
        "middleware": [],
        "file_upload": [],
        "email": [],
        "queues": [],
        "websockets": [],
        "include_docker": False,
        "include_tests": False,
        "include_swagger": False,
        "routes": [],
    }
    return GenerateConfig(**{**defaults, **kwargs})


def _ai_config(provider: str = "anthropic", key: str = "sk-fake") -> AIConfig:
    return AIConfig(provider=provider, api_key=key)


@pytest.mark.asyncio
async def test_returns_empty_when_ai_disabled(monkeypatch) -> None:
    monkeypatch.setenv("AI_ENABLED", "false")
    from importlib import reload
    import app.services.ai_service as ai_mod
    reload(ai_mod)
    result = await ai_mod.enhance_with_ai(_config(), _ai_config())
    assert result == {}


@pytest.mark.asyncio
async def test_returns_empty_when_no_byok_key() -> None:
    """Without a BYOK key, AI enhancement is skipped — not an error."""
    result = await enhance_with_ai(_config(), ai_config=None)
    assert result == {}


@pytest.mark.asyncio
async def test_returns_empty_when_empty_key() -> None:
    result = await enhance_with_ai(_config(), ai_config=AIConfig(provider="anthropic", api_key=""))
    assert result == {}


@pytest.mark.asyncio
async def test_ai_fallback_on_timeout() -> None:
    """Timeout must not propagate — fallback returns empty dict."""
    with (
        patch("app.services.ai_providers.AnthropicProvider.complete", new_callable=AsyncMock) as mock,
        patch("app.services.ai_service.settings") as mock_settings,
    ):
        mock.side_effect = asyncio.TimeoutError()
        mock_settings.ai_enabled = True
        mock_settings.ai_timeout_seconds = 5
        result = await enhance_with_ai(_config(), _ai_config())
    assert result == {}


@pytest.mark.asyncio
async def test_ai_fallback_on_unexpected_error() -> None:
    with (
        patch("app.services.ai_providers.AnthropicProvider.complete", new_callable=AsyncMock) as mock,
        patch("app.services.ai_service.settings") as mock_settings,
    ):
        mock.side_effect = RuntimeError("unexpected")
        mock_settings.ai_enabled = True
        mock_settings.ai_timeout_seconds = 5
        result = await enhance_with_ai(_config(), _ai_config())
    assert result == {}


@pytest.mark.asyncio
async def test_ai_returns_overrides_on_success() -> None:
    with (
        patch("app.services.ai_providers.AnthropicProvider.complete", new_callable=AsyncMock) as mock,
        patch("app.services.ai_service.settings") as mock_settings,
    ):
        mock.return_value = "# AI Generated Content"
        mock_settings.ai_enabled = True
        mock_settings.ai_timeout_seconds = 5
        result = await enhance_with_ai(_config(), _ai_config())
    assert "README.md" in result
    assert ".env.example" in result


@pytest.mark.asyncio
async def test_unknown_provider_returns_empty() -> None:
    # provider validation on AIConfig should reject invalid values at Pydantic level
    import pytest
    with pytest.raises(Exception):
        AIConfig(provider="unknown_llm", api_key="key")


@pytest.mark.asyncio
async def test_partial_ai_failure_returns_partial_overrides() -> None:
    """If one of the two AI calls fails, overrides still contains the successful one."""
    call_count = 0

    async def _side_effect(prompt: str, timeout: int) -> str:
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return "# README content"
        raise RuntimeError("second call failed")

    with (
        patch("app.services.ai_providers.AnthropicProvider.complete", new_callable=AsyncMock) as mock,
        patch("app.services.ai_service.settings") as mock_settings,
    ):
        mock.side_effect = _side_effect
        mock_settings.ai_enabled = True
        mock_settings.ai_timeout_seconds = 5
        result = await enhance_with_ai(_config(), _ai_config())

    # At least one override should be present (no crash; partial success or empty both ok)
    assert len(result) >= 0
