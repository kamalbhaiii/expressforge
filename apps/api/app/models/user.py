import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Fernet-encrypted ciphertext — never raw plaintext in DB
    email_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    # Deterministic HMAC-SHA256 of lower(email) — used for lookup (Fernet is non-deterministic)
    email_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    # Argon2id hash
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # TOTP 2FA — secret stored AES-256-GCM encrypted
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    totp_secret_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Account lockout (5 consecutive failures → 30 min lockout)
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    devices: Mapped[list["Device"]] = relationship(  # noqa: F821
        "Device", back_populates="user", cascade="all, delete-orphan"
    )
    projects: Mapped[list["Project"]] = relationship(  # noqa: F821
        "Project", back_populates="user", cascade="all, delete-orphan"
    )
    totp_backup_codes: Mapped[list["TOTPBackupCode"]] = relationship(  # noqa: F821
        "TOTPBackupCode", back_populates="user", cascade="all, delete-orphan"
    )
