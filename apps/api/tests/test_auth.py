"""Tests for user auth — register, login, refresh, /me, security invariants."""
import uuid

import pytest
from httpx import AsyncClient


def unique_email(name: str = "user") -> str:
    """Generate a unique email per test run to avoid 409 conflicts on re-runs."""
    return f"{name}-{uuid.uuid4().hex[:8]}@example.com"


@pytest.mark.asyncio
async def test_register_creates_account(client: AsyncClient) -> None:
    res = await client.post(
        "/auth/register",
        json={"email": unique_email("alice"), "password": "Secure1!Pass"},
    )
    assert res.status_code == 201
    body = res.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_409(client: AsyncClient) -> None:
    email = unique_email("bob")
    payload = {"email": email, "password": "Secure1!Pass"}
    await client.post("/auth/register", json=payload)
    res = await client.post("/auth/register", json=payload)
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password_rejected(client: AsyncClient) -> None:
    res = await client.post(
        "/auth/register",
        json={"email": unique_email("weak"), "password": "password"},  # no upper/digit/symbol
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_login_returns_tokens(client: AsyncClient) -> None:
    email, password = unique_email("charlie"), "Secure1!Pass"
    await client.post("/auth/register", json={"email": email, "password": password})

    res = await client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client: AsyncClient) -> None:
    email = unique_email("dave")
    await client.post("/auth/register", json={"email": email, "password": "Secure1!Pass"})

    res = await client.post("/auth/login", json={"email": email, "password": "wrongpassword"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user_returns_401(client: AsyncClient) -> None:
    res = await client.post(
        "/auth/login",
        json={"email": unique_email("nobody"), "password": "Secure1!Pass"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint_returns_user_profile(client: AsyncClient) -> None:
    email = unique_email("eve")
    reg = await client.post(
        "/auth/register", json={"email": email, "password": "Secure1!Pass"}
    )
    token = reg.json()["access_token"]

    res = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == email
    assert "id" in body


@pytest.mark.asyncio
async def test_me_endpoint_requires_auth(client: AsyncClient) -> None:
    res = await client.get("/auth/me")
    assert res.status_code == 403  # HTTPBearer returns 403 when header missing


@pytest.mark.asyncio
async def test_me_endpoint_rejects_invalid_token(client: AsyncClient) -> None:
    res = await client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_refresh_returns_new_tokens(client: AsyncClient) -> None:
    reg = await client.post(
        "/auth/register",
        json={"email": unique_email("frank"), "password": "Secure1!Pass"},
    )
    refresh_token = reg.json()["refresh_token"]

    res = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert "refresh_token" in body


@pytest.mark.asyncio
async def test_refresh_with_access_token_rejected(client: AsyncClient) -> None:
    reg = await client.post(
        "/auth/register",
        json={"email": unique_email("grace"), "password": "Secure1!Pass"},
    )
    # Using the ACCESS token where a refresh token is expected must be rejected
    access_token = reg.json()["access_token"]
    res = await client.post("/auth/refresh", json={"refresh_token": access_token})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_error_messages_are_generic(client: AsyncClient) -> None:
    """Login error must not reveal whether the email exists — prevents enumeration."""
    res_nonexistent = await client.post(
        "/auth/login",
        json={"email": unique_email("ghost"), "password": "Secure1!Pass"},
    )
    real_email = unique_email("real")
    await client.post(
        "/auth/register",
        json={"email": real_email, "password": "Secure1!Pass"},
    )
    res_wrong_pass = await client.post(
        "/auth/login",
        json={"email": real_email, "password": "WrongPass1!"},
    )

    # Both must return the same status and identical detail text
    assert res_nonexistent.status_code == res_wrong_pass.status_code == 401
    assert res_nonexistent.json()["detail"] == res_wrong_pass.json()["detail"]
