"""CRUD operations for User — all email lookups use the encrypted index."""

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    decrypt_field,
    encrypt_field,
    hash_email,
    hash_password,
    verify_password,
    needs_rehash,
)
from app.models.user import User


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    h = hash_email(email.lower())
    result = await db.execute(select(User).where(User.email_hash == h))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession, email: str, password: str, display_name: str | None = None
) -> User:
    user = User(
        email_encrypted=encrypt_field(email.lower()),
        email_hash=hash_email(email.lower()),
        password_hash=hash_password(password),
        display_name=display_name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


def authenticate_user(user: User, plain_password: str) -> bool:
    return verify_password(plain_password, user.password_hash)


def get_email(user: User) -> str:
    return decrypt_field(user.email_encrypted)


async def record_failed_attempt(db: AsyncSession, user: User, lockout_minutes: int) -> None:
    user.failed_attempts += 1
    if user.failed_attempts >= 5:
        from datetime import timedelta
        user.locked_until = datetime.utcnow() + timedelta(minutes=lockout_minutes)
    await db.flush()


async def reset_failed_attempts(db: AsyncSession, user: User) -> None:
    user.failed_attempts = 0
    user.locked_until = None
    await db.flush()


def is_locked(user: User) -> bool:
    if user.locked_until and datetime.utcnow() < user.locked_until:
        return True
    return False


async def verify_user_email(db: AsyncSession, user: User) -> None:
    user.is_verified = True
    await db.flush()


async def update_profile(
    db: AsyncSession, user: User, display_name: str | None, avatar_url: str | None
) -> None:
    if display_name is not None:
        user.display_name = display_name
    if avatar_url is not None:
        user.avatar_url = avatar_url
    await db.flush()


async def change_password(db: AsyncSession, user: User, new_password: str) -> None:
    user.password_hash = hash_password(new_password)
    user.failed_attempts = 0
    user.locked_until = None
    await db.flush()


async def set_totp(
    db: AsyncSession, user: User, encrypted_secret: str | None, enabled: bool
) -> None:
    user.totp_secret_encrypted = encrypted_secret
    user.totp_enabled = enabled
    await db.flush()
