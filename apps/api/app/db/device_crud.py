"""CRUD for devices, device tokens, TOTP backup codes, email/password-reset tokens."""

import uuid
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_secure_token, hash_token
from app.models.device import Device, DeviceToken, EmailVerification, PasswordResetToken, TOTPBackupCode


# ── Devices ───────────────────────────────────────────────────────────────────

async def get_device(db: AsyncSession, user_id: uuid.UUID, fingerprint_hash: str) -> Device | None:
    result = await db.execute(
        select(Device).where(Device.user_id == user_id, Device.fingerprint_hash == fingerprint_hash)
    )
    return result.scalar_one_or_none()


async def list_devices(db: AsyncSession, user_id: uuid.UUID) -> list[Device]:
    result = await db.execute(select(Device).where(Device.user_id == user_id))
    return list(result.scalars().all())


async def create_device(
    db: AsyncSession, user_id: uuid.UUID, fingerprint_hash: str, label: str
) -> Device:
    device = Device(user_id=user_id, fingerprint_hash=fingerprint_hash, label=label)
    db.add(device)
    await db.flush()
    return device


async def touch_device(db: AsyncSession, device: Device) -> None:
    device.last_seen_at = datetime.utcnow()
    await db.flush()


async def revoke_device(db: AsyncSession, device_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Device).where(Device.id == device_id, Device.user_id == user_id)
    )
    device = result.scalar_one_or_none()
    if not device:
        return False
    await db.delete(device)
    await db.flush()
    return True


# ── Device tokens ─────────────────────────────────────────────────────────────

async def create_device_token(
    db: AsyncSession, user_id: uuid.UUID, fingerprint: str, label: str, expire_minutes: int
) -> str:
    raw = generate_secure_token()
    token = DeviceToken(
        user_id=user_id,
        token_hash=hash_token(raw),
        device_fingerprint=fingerprint,
        device_label=label,
        expires_at=datetime.utcnow() + timedelta(minutes=expire_minutes),
    )
    db.add(token)
    await db.flush()
    return raw


async def consume_device_token(db: AsyncSession, raw_token: str) -> DeviceToken | None:
    result = await db.execute(
        select(DeviceToken).where(
            DeviceToken.token_hash == hash_token(raw_token),
            DeviceToken.used_at.is_(None),
            DeviceToken.expires_at > datetime.utcnow(),
        )
    )
    token = result.scalar_one_or_none()
    if token:
        token.used_at = datetime.utcnow()
        await db.flush()
    return token


# ── Email verification ────────────────────────────────────────────────────────

async def create_email_verification(db: AsyncSession, user_id: uuid.UUID) -> str:
    raw = generate_secure_token()
    ev = EmailVerification(
        user_id=user_id,
        token_hash=hash_token(raw),
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(ev)
    await db.flush()
    return raw


async def consume_email_verification(db: AsyncSession, raw_token: str) -> EmailVerification | None:
    result = await db.execute(
        select(EmailVerification).where(
            EmailVerification.token_hash == hash_token(raw_token),
            EmailVerification.used_at.is_(None),
            EmailVerification.expires_at > datetime.utcnow(),
        )
    )
    ev = result.scalar_one_or_none()
    if ev:
        ev.used_at = datetime.utcnow()
        await db.flush()
    return ev


# ── Password reset ────────────────────────────────────────────────────────────

async def create_password_reset_token(db: AsyncSession, user_id: uuid.UUID) -> str:
    raw = generate_secure_token()
    prt = PasswordResetToken(
        user_id=user_id,
        token_hash=hash_token(raw),
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(prt)
    await db.flush()
    return raw


async def consume_password_reset_token(db: AsyncSession, raw_token: str) -> PasswordResetToken | None:
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hash_token(raw_token),
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.utcnow(),
        )
    )
    prt = result.scalar_one_or_none()
    if prt:
        prt.used_at = datetime.utcnow()
        await db.flush()
    return prt


# ── TOTP backup codes ─────────────────────────────────────────────────────────

async def save_backup_codes(db: AsyncSession, user_id: uuid.UUID, hashed_codes: list[str]) -> None:
    # Clear existing backup codes first
    result = await db.execute(select(TOTPBackupCode).where(TOTPBackupCode.user_id == user_id))
    for code in result.scalars().all():
        await db.delete(code)

    for h in hashed_codes:
        db.add(TOTPBackupCode(user_id=user_id, code_hash=h))
    await db.flush()


async def get_unused_backup_codes(db: AsyncSession, user_id: uuid.UUID) -> list[TOTPBackupCode]:
    result = await db.execute(
        select(TOTPBackupCode).where(
            TOTPBackupCode.user_id == user_id,
            TOTPBackupCode.used_at.is_(None),
        )
    )
    return list(result.scalars().all())


async def consume_backup_code(db: AsyncSession, code_obj: TOTPBackupCode) -> None:
    code_obj.used_at = datetime.utcnow()
    await db.flush()
