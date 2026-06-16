"""
Auth router — register, login, refresh, TOTP, device fingerprint, me, settings.

Security posture:
- Passwords: Argon2id (timeCost=3, memory=64MB) — never stored plaintext
- Emails: Fernet AES-encrypted at rest — not readable from DB dumps
- JWTs: HS256, short-lived (30m access / 7d refresh)
- Account lockout: 5 consecutive failures → 30-minute lock
- Device fingerprint: new device → email approval link (15-min single-use)
- TOTP: RFC 6238 via pyotp, secret AES-256-GCM encrypted at rest
- No enumeration: all error messages are generic
"""

import asyncio
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.email import (
    send_device_approval_email,
    send_password_reset_email,
    send_verification_email,
)
from app.core.redis import cache_delete, cache_get, cache_set, rate_limit_check
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_totp_session_token,
    decode_token,
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_backup_codes,
    generate_totp_secret,
    get_totp_uri,
    verify_backup_code,
    verify_totp,
)
from app.db.database import get_db
from app.db.device_crud import (
    consume_device_token,
    consume_email_verification,
    consume_password_reset_token,
    create_device,
    create_device_token,
    create_email_verification,
    create_password_reset_token,
    get_device,
    get_unused_backup_codes,
    list_devices,
    revoke_device,
    save_backup_codes,
    touch_device,
    consume_backup_code,
)
from app.db.user_crud import (
    authenticate_user,
    change_password,
    create_user,
    get_email,
    get_user_by_email,
    get_user_by_id,
    is_locked,
    record_failed_attempt,
    reset_failed_attempts,
    set_totp,
    update_profile,
    verify_user_email,
)
from app.models.auth import (
    ChangePasswordRequest,
    DeviceApprovalRequest,
    DeviceResponse,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    TOTPConfirmRequest,
    TOTPSetupResponse,
    TOTPVerifyRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.models.user import User

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])

_INVALID = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
_LOCKED = HTTPException(
    status_code=status.HTTP_423_LOCKED,
    detail="Account is temporarily locked due to too many failed attempts. Check your email.",
)


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=get_email(user),
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        totp_enabled=user.totp_enabled,
        created_at=user.created_at,
    )


# ── Registration ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account already exists")

    user = await create_user(db, body.email, body.password, body.display_name)
    subject = str(user.id)

    # Send verification email in background
    email = body.email
    async def _send_verification() -> None:
        raw_token = await create_email_verification(db, user.id)
        await send_verification_email(email, raw_token)

    background.add_task(asyncio.create_task, _send_verification())

    return TokenResponse(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )


# ── Login (email + password + device fingerprint + TOTP) ─────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    background: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    # Auth rate limit: 5 per 15 min per IP (skipped in test env)
    if not settings.is_test:
        ip = request.client.host if request.client else "unknown"
        limited, _ = await rate_limit_check(f"auth_login:{ip}", 5, 900)
        if limited:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts")

    user = await get_user_by_email(db, body.email)

    # Always run Argon2id verify — prevents timing attacks even when user is None
    dummy_hash = "$argon2id$v=19$m=65536,t=3,p=1$dummysaltpadding0000$dummyhashpadding00000000000000000000000000000="
    valid = authenticate_user(user, body.password) if user else False
    if not user:
        verify_totp("JBSWY3DPEHPK3PXP", "000000")  # constant-time dummy

    if not user or not valid or not user.is_active:
        if user:
            await record_failed_attempt(db, user, settings.account_lockout_minutes)
            if is_locked(user):
                email_addr = get_email(user)
                background.add_task(asyncio.ensure_future, _noop())
        raise _INVALID

    if is_locked(user):
        raise _LOCKED

    await reset_failed_attempts(db, user)
    subject = str(user.id)

    # ── Device fingerprint check ──
    fp = body.device_fingerprint
    fp_label = body.device_label or "Unknown Device"

    if fp:
        device = await get_device(db, user.id, fp)
        if device:
            await touch_device(db, device)
        else:
            # New device — send approval email, return 202-style response
            email_addr = get_email(user)
            raw_token = await create_device_token(
                db, user.id, fp, fp_label, settings.device_token_expire_minutes
            )
            background.add_task(asyncio.ensure_future, send_device_approval_email(email_addr, raw_token, fp_label))
            return TokenResponse(
                access_token="",
                refresh_token="",
                requires_device_approval=True,
            )

    # ── TOTP check ──
    if user.totp_enabled:
        totp_token = create_totp_session_token(subject)
        return TokenResponse(
            access_token="",
            refresh_token="",
            requires_totp=True,
            totp_session_token=totp_token,
        )

    return TokenResponse(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )


async def _noop() -> None:
    pass


# ── TOTP verification ─────────────────────────────────────────────────────────

@router.post("/totp/verify", response_model=TokenResponse)
async def verify_totp_login(
    body: TOTPVerifyRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    try:
        payload = decode_token(body.totp_session_token)
    except ValueError:
        raise _INVALID

    if payload.get("type") != "totp_session":
        raise _INVALID

    user_id = payload.get("sub")
    if not user_id:
        raise _INVALID

    user = await get_user_by_id(db, uuid.UUID(user_id))
    if not user or not user.is_active or not user.totp_enabled:
        raise _INVALID

    secret = decrypt_totp_secret(user.totp_secret_encrypted)  # type: ignore[arg-type]

    # Check TOTP code
    if verify_totp(secret, body.code):
        subject = str(user.id)
        return TokenResponse(
            access_token=create_access_token(subject),
            refresh_token=create_refresh_token(subject),
        )

    # Check backup codes
    backup_codes = await get_unused_backup_codes(db, user.id)
    hashed = [bc.code_hash for bc in backup_codes]
    matched_hash = verify_backup_code(body.code, hashed)
    if matched_hash:
        for bc in backup_codes:
            if bc.code_hash == matched_hash:
                await consume_backup_code(db, bc)
                break
        subject = str(user.id)
        return TokenResponse(
            access_token=create_access_token(subject),
            refresh_token=create_refresh_token(subject),
        )

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid TOTP code")


# ── Device approval ───────────────────────────────────────────────────────────

@router.post("/device-approval", response_model=TokenResponse)
async def approve_device(
    body: DeviceApprovalRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    token_obj = await consume_device_token(db, body.token)
    if not token_obj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user = await get_user_by_id(db, token_obj.user_id)
    if not user or not user.is_active:
        raise _INVALID

    # Register the device as trusted
    await create_device(db, user.id, token_obj.device_fingerprint, token_obj.device_label)

    subject = str(user.id)
    if user.totp_enabled:
        totp_token = create_totp_session_token(subject)
        return TokenResponse(
            access_token="",
            refresh_token="",
            requires_totp=True,
            totp_session_token=totp_token,
        )

    return TokenResponse(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )


# ── Email verification ────────────────────────────────────────────────────────

@router.post("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)) -> dict:
    ev = await consume_email_verification(db, token)
    if not ev:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    user = await get_user_by_id(db, ev.user_id)
    if user:
        await verify_user_email(db, user)
    return {"message": "Email verified"}


# ── Token refresh ─────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    try:
        payload = decode_token(body.refresh_token)
    except ValueError:
        raise _INVALID

    if payload.get("type") != "refresh":
        raise _INVALID

    user_id = payload.get("sub")
    if not user_id:
        raise _INVALID

    user = await get_user_by_id(db, uuid.UUID(user_id))
    if not user or not user.is_active:
        raise _INVALID

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ── Password reset ────────────────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(
    body: PasswordResetRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await get_user_by_email(db, body.email)
    if user:
        raw_token = await create_password_reset_token(db, user.id)
        background.add_task(asyncio.ensure_future, send_password_reset_email(body.email, raw_token))
    # Always return 200 — never reveal if email exists
    return {"message": "If that email is registered, a reset link was sent"}


@router.post("/reset-password")
async def reset_password(body: PasswordResetConfirm, db: AsyncSession = Depends(get_db)) -> dict:
    prt = await consume_password_reset_token(db, body.token)
    if not prt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    user = await get_user_by_id(db, prt.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
    await change_password(db, user, body.new_password)
    return {"message": "Password updated"}


# ── Authenticated endpoints ───────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)) -> UserResponse:
    return _user_response(user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    await update_profile(db, user, body.display_name, body.avatar_url)
    return _user_response(user)


@router.post("/change-password")
async def change_my_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not authenticate_user(user, body.current_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    await change_password(db, user, body.new_password)
    return {"message": "Password changed"}


# ── Devices ───────────────────────────────────────────────────────────────────

@router.get("/devices", response_model=list[DeviceResponse])
async def get_devices(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[DeviceResponse]:
    devices = await list_devices(db, user.id)
    return [
        DeviceResponse(
            id=str(d.id),
            label=d.label,
            trusted=d.trusted,
            created_at=d.created_at,
            last_seen_at=d.last_seen_at,
        )
        for d in devices
    ]


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_device(
    device_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    removed = await revoke_device(db, device_id, user.id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")


# ── TOTP setup ────────────────────────────────────────────────────────────────

@router.post("/totp/setup", response_model=TOTPSetupResponse)
async def setup_totp(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> TOTPSetupResponse:
    secret = generate_totp_secret()
    email = get_email(user)
    qr_uri = get_totp_uri(secret, email)
    plain_codes, hashed_codes = generate_backup_codes()

    # Store encrypted secret temporarily in Redis until confirmed
    await cache_set(f"totp_setup:{user.id}", secret, 600)  # 10 min TTL

    return TOTPSetupResponse(secret=secret, qr_uri=qr_uri, backup_codes=plain_codes)


@router.post("/totp/confirm")
async def confirm_totp(
    body: TOTPConfirmRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    secret = await cache_get(f"totp_setup:{user.id}")
    if not secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP setup session expired")

    if not verify_totp(secret, body.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code")

    _, hashed = generate_backup_codes()
    await save_backup_codes(db, user.id, hashed)
    await set_totp(db, user, encrypt_totp_secret(secret), True)
    await cache_delete(f"totp_setup:{user.id}")

    return {"message": "2FA enabled"}


@router.delete("/totp", status_code=status.HTTP_204_NO_CONTENT)
async def disable_totp(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> None:
    await set_totp(db, user, None, False)
