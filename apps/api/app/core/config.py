"""
Settings — single .env per environment.

Resolution order (first match wins, Pydantic-settings semantics):
  1. Real environment variables (shell / Docker / CI)
  2. .env.<ENVIRONMENT>   (e.g. .env.production, .env.staging)
  3. .env                 (shared fallback / local dev)

To override environment: set ENVIRONMENT=staging before starting the server.
"""

import os
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


def _env_files() -> list[str]:
    env = os.getenv("ENVIRONMENT", "development")
    return [f".env.{env}", ".env"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    environment: Literal["development", "staging", "production", "test"] = "development"
    app_name: str = "ExpressForge API"
    app_version: str = "2.0.0"

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "postgresql://postgres:password@localhost:5432/expressforge"

    # ── Redis (Upstash in prod, local in dev) ─────────────────────────────────
    redis_url: str = "redis://localhost:6379"

    # ── Auth — JWT ────────────────────────────────────────────────────────────
    # Generate: python -c "import secrets; print(secrets.token_hex(64))"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # Short-lived tokens for device approval (15 min) and TOTP sessions (10 min)
    device_token_expire_minutes: int = 15
    totp_session_expire_minutes: int = 10

    # ── Field-level encryption (Fernet AES-128-CBC) ───────────────────────────
    # python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    encryption_key: str = "REPLACE_WITH_FERNET_KEY_IN_PRODUCTION"

    # ── TOTP encryption (AES-256-GCM) — separate key for TOTP secrets ────────
    # python -c "import secrets; print(secrets.token_hex(32))"
    totp_encryption_key: str = "REPLACE_WITH_32_BYTE_HEX_KEY"

    # ── Email (Resend) ────────────────────────────────────────────────────────
    resend_api_key: str = ""
    email_from: str = "noreply@expressforge.dev"
    app_url: str = "http://localhost:3000"

    # ── AI feature flags ──────────────────────────────────────────────────────
    ai_enabled: bool = True
    ai_timeout_seconds: int = 20

    # ── Rate limiting ─────────────────────────────────────────────────────────
    max_jobs_per_hour: int = 10
    auth_rate_limit_attempts: int = 5
    auth_rate_limit_window_seconds: int = 900  # 15 min

    # ── Account lockout ───────────────────────────────────────────────────────
    account_lockout_attempts: int = 5
    account_lockout_minutes: int = 30

    # ── CORS — comma-separated list ───────────────────────────────────────────
    allowed_origins: str = "http://localhost:3000"

    @property
    def parsed_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_test(self) -> bool:
        return self.environment == "test"

    @property
    def async_database_url(self) -> str:
        return self.database_url.replace("postgresql://", "postgresql+asyncpg://")


@lru_cache
def get_settings() -> Settings:
    return Settings()
