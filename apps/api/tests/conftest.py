import asyncio
import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Force test environment before importing the app
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:test@postgres-test:5432/expressforge_test")
os.environ.setdefault("REDIS_URL", "redis://redis-test:6379")
os.environ.setdefault("AI_ENABLED", "false")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-not-used-in-production-x1y2z3")
os.environ.setdefault(
    "ENCRYPTION_KEY",
    "dGVzdC1rZXktZm9yLXRlc3RzLW9ubHktMzItYnl0ZXM=",
)
os.environ.setdefault(
    "TOTP_ENCRYPTION_KEY",
    "0000000000000000000000000000000000000000000000000000000000000000",
)
os.environ.setdefault("RESEND_API_KEY", "re_test_placeholder")
os.environ.setdefault("EMAIL_FROM", "test@expressforge.dev")
os.environ.setdefault("APP_URL", "http://localhost:3000")

from app.db.database import init_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the whole test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def _init_db():
    """Create all tables once per test session."""
    await init_db()


@pytest_asyncio.fixture(scope="session")
async def client(_init_db):
    """Shared unauthenticated HTTP client for the full test session."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture(scope="session")
async def auth_client(client: AsyncClient):
    """HTTP client pre-loaded with a valid JWT — use for endpoints requiring auth."""
    res = await client.post(
        "/auth/register",
        json={
            "email": "testrunner@expressforge.dev",
            "password": "TestRunner1!Pass",
        },
    )
    # May return 409 if already registered from a previous run; login then
    if res.status_code == 409:
        res = await client.post(
            "/auth/login",
            json={
                "email": "testrunner@expressforge.dev",
                "password": "TestRunner1!Pass",
            },
        )
    token = res.json().get("access_token", "")

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as ac:
        yield ac


@pytest.fixture
def minimal_config() -> dict:
    """Minimal valid Phase 2 GenerateConfig — no auth, no DB, no extras."""
    return {
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
