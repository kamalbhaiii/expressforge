"""
AI enhancement service — BYOK (Bring Your Own Key).

The user supplies their own LLM provider name + API key in the request body.
No server-side API keys are used for generation. Falls back to static templates
on any failure so the ZIP always downloads.
"""

import asyncio
import logging

from app.core.config import get_settings
from app.models.config import AIConfig, GenerateConfig
from app.services.ai_providers import DEFAULT_TIMEOUT, SUPPORTED_PROVIDERS, get_provider

logger = logging.getLogger(__name__)
settings = get_settings()


def _build_readme_prompt(config: GenerateConfig) -> str:
    _auth_names = {
        "jwt": "JWT (access + refresh tokens)",
        "session": "Express sessions with PostgreSQL store",
        "oauth_google": "Google OAuth 2.0 via Passport.js",
        "api_key": "API key authentication",
        "magic_link": "Magic link email authentication",
    }
    auth_label = ", ".join(_auth_names.get(a, a) for a in config.auth) if config.auth else "None"

    _db_names = {
        "mongodb": "MongoDB with Mongoose ORM",
        "postgres_prisma": "PostgreSQL with Prisma ORM",
        "mysql_prisma": "MySQL with Prisma ORM",
        "postgres_sequelize": "PostgreSQL with Sequelize ORM",
        "redis": "Redis",
    }
    db_label = ", ".join(_db_names.get(d, d) for d in config.database) if config.database else "None"

    middleware_labels = ", ".join(config.middleware) if config.middleware else "none"

    return f"""Generate a concise, professional README.md for an Express.js project with these exact specs:

Project name: {config.project_name}
Language: {config.language}
Port: {config.port}
Authentication: {auth_label}
Database: {db_label}
Middleware: {middleware_labels}
Docker included: {config.include_docker}
Tests included: {config.include_tests}

Requirements:
- Include badges for Node.js and npm
- Quick start section with exact commands
- Environment variables section listing every .env key with a one-line description
- Project structure tree
- API endpoints section (at minimum GET /health, and auth routes if auth != none)
- Keep it under 120 lines
- Use markdown formatting only, no HTML

Return only the README.md content, no preamble."""


def _build_env_comment_prompt(config: GenerateConfig) -> str:
    auth_list = ", ".join(config.auth) if config.auth else "none"
    db_list = ", ".join(config.database) if config.database else "none"
    return f"""Generate .env.example file content for an Express.js project with:
- Auth: {auth_list}
- Database: {db_list}
- Port: {config.port}

For each environment variable include a short inline comment (after #) explaining what it does.
Always include PORT, NODE_ENV.
Include database connection vars if database includes a DB option.
Include JWT_SECRET, JWT_REFRESH_SECRET if auth includes jwt.
Include SESSION_SECRET if auth includes session.
Include GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL if auth includes oauth_google.

Return only the .env.example file content, no preamble."""


async def enhance_with_ai(
    config: GenerateConfig, ai_config: AIConfig | None = None
) -> dict[str, str]:
    """Return AI-generated file overrides keyed by output path.

    Uses the user-supplied provider + API key (BYOK). Falls back gracefully to
    an empty dict on any failure — generation never depends on AI availability.
    """
    if not settings.ai_enabled:
        return {}

    if ai_config is None or not ai_config.api_key.strip():
        logger.debug("No BYOK key provided — skipping AI enhancement")
        return {}

    if ai_config.provider not in SUPPORTED_PROVIDERS:
        logger.warning("Unknown provider '%s' — skipping AI", ai_config.provider)
        return {}

    overrides: dict[str, str] = {}
    timeout = settings.ai_timeout_seconds or DEFAULT_TIMEOUT

    try:
        provider = get_provider(ai_config.provider, ai_config.api_key)

        readme, env_content = await asyncio.gather(
            provider.complete(_build_readme_prompt(config), timeout),
            provider.complete(_build_env_comment_prompt(config), timeout),
            return_exceptions=True,
        )

        if isinstance(readme, str):
            overrides["README.md"] = readme
        if isinstance(env_content, str):
            overrides[".env.example"] = env_content

        if not overrides:
            logger.warning("All AI calls returned exceptions — using static fallback")

    except asyncio.TimeoutError:
        logger.warning("AI provider timed out after %ds — using static fallback", timeout)
    except ValueError as exc:
        logger.warning("AI provider error: %s — using static fallback", exc)
    except Exception as exc:
        logger.warning("Unexpected AI error: %s — using static fallback", exc)

    return overrides
