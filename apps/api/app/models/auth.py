"""Pydantic request/response schemas for the auth router."""

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str | None = Field(None, max_length=100)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        errors: list[str] = []
        if not re.search(r"[A-Z]", v):
            errors.append("at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("at least one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-]", v):
            errors.append("at least one special character")
        if errors:
            raise ValueError("Password must contain " + ", ".join(errors))
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    # Client-side device fingerprint (SHA-256 hex, optional — graceful degradation)
    device_fingerprint: str | None = Field(None, max_length=64)
    device_label: str | None = Field(None, max_length=200)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    # When set, frontend must collect TOTP before session is established
    requires_totp: bool = False
    # When set, frontend must wait for device approval email
    requires_device_approval: bool = False
    totp_session_token: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class TOTPVerifyRequest(BaseModel):
    totp_session_token: str
    code: str = Field(..., min_length=6, max_length=8)


class TOTPSetupResponse(BaseModel):
    secret: str
    qr_uri: str
    backup_codes: list[str]


class TOTPConfirmRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class DeviceApprovalRequest(BaseModel):
    token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        errors: list[str] = []
        if not re.search(r"[A-Z]", v):
            errors.append("at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("at least one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-]", v):
            errors.append("at least one special character")
        if errors:
            raise ValueError("Password must contain " + ", ".join(errors))
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UpdateProfileRequest(BaseModel):
    display_name: str | None = Field(None, max_length=100)
    avatar_url: str | None = Field(None, max_length=500)


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str | None
    avatar_url: str | None
    is_active: bool
    is_verified: bool
    totp_enabled: bool
    created_at: datetime


class DeviceResponse(BaseModel):
    id: str
    label: str
    trusted: bool
    created_at: datetime
    last_seen_at: datetime
