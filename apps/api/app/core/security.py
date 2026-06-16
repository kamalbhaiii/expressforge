"""
Cryptographic utilities.

Password hashing: Argon2id (winner of Password Hashing Competition — more
memory-hard than bcrypt, OWASP recommended for new systems).
Field encryption: Fernet (AES-128-CBC + HMAC-SHA256) for email column.
TOTP secret encryption: AES-256-GCM via cryptography library.
JWT: HS256 signed access + refresh + short-lived session tokens.
"""

import hashlib
import os
import secrets
from base64 import b64decode, b64encode
from datetime import datetime, timedelta, timezone
from functools import lru_cache

import pyotp
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

# ── Argon2id password hashing ─────────────────────────────────────────────────
# timeCost=3, memoryCost=65536 (64MB), parallelism=1 — PHC winner parameters
_ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=1, hash_len=32, salt_len=16)


def hash_password(plain: str) -> str:
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time Argon2id verify. Returns False on any mismatch — never raises."""
    try:
        return _ph.verify(hashed, plain)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(hashed: str) -> bool:
    return _ph.check_needs_rehash(hashed)


# ── Field-level encryption (Fernet / AES-128-CBC + HMAC) ─────────────────────

@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    return Fernet(settings.encryption_key.encode())


def encrypt_field(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt_field(ciphertext: str) -> str:
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Field decryption failed — possible data tampering") from exc


def hash_email(email: str) -> str:
    """Deterministic HMAC-SHA256 of the lowercased email — used as lookup index.
    Fernet is non-deterministic so we cannot query by email_encrypted directly."""
    import hmac as _hmac
    key = settings.jwt_secret.encode()
    return _hmac.new(key, email.lower().encode(), hashlib.sha256).hexdigest()


# ── TOTP secret encryption (AES-256-GCM) ─────────────────────────────────────

def _totp_key() -> bytes:
    """Derive 32-byte AES key from the hex config value."""
    return bytes.fromhex(settings.totp_encryption_key)


def encrypt_totp_secret(secret: str) -> str:
    """Encrypt TOTP secret with AES-256-GCM. Returns base64(nonce + tag + ciphertext)."""
    aesgcm = AESGCM(_totp_key())
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, secret.encode(), None)
    return b64encode(nonce + ct).decode()


def decrypt_totp_secret(encrypted: str) -> str:
    aesgcm = AESGCM(_totp_key())
    raw = b64decode(encrypted)
    nonce, ct = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ct, None).decode()


# ── TOTP ──────────────────────────────────────────────────────────────────────

def generate_totp_secret() -> str:
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="ExpressForge")


def verify_totp(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def generate_backup_codes(count: int = 8) -> tuple[list[str], list[str]]:
    """Return (plaintext_codes, hashed_codes). Show plaintext once; store hashed."""
    codes = [secrets.token_hex(4).upper() for _ in range(count)]
    hashed = [hashlib.sha256(c.encode()).hexdigest() for c in codes]
    return codes, hashed


def verify_backup_code(code: str, hashed_codes: list[str]) -> str | None:
    """Return the matching hash if found, else None."""
    h = hashlib.sha256(code.upper().encode()).hexdigest()
    return h if h in hashed_codes else None


# ── Token utilities ───────────────────────────────────────────────────────────

def hash_token(token: str) -> str:
    """SHA-256 hash for storing tokens in DB (never store raw tokens)."""
    return hashlib.sha256(token.encode()).hexdigest()


def generate_secure_token() -> str:
    return secrets.token_urlsafe(32)


# ── JWT tokens ────────────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(tz=timezone.utc)


def create_access_token(subject: str) -> str:
    expire = _now_utc() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    return jwt.encode(
        {"sub": subject, "exp": expire, "type": "access"},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(subject: str) -> str:
    expire = _now_utc() + timedelta(days=settings.jwt_refresh_token_expire_days)
    return jwt.encode(
        {"sub": subject, "exp": expire, "type": "refresh"},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def create_totp_session_token(subject: str) -> str:
    """Short-lived token used between password verification and TOTP check."""
    expire = _now_utc() + timedelta(minutes=settings.totp_session_expire_minutes)
    return jwt.encode(
        {"sub": subject, "exp": expire, "type": "totp_session"},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises ValueError on invalid/expired tokens."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
