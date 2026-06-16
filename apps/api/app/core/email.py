"""Email service via Resend API."""

import logging
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def _send(to: str, subject: str, html: str) -> bool:
    """Send email via Resend. Returns True on success, False on failure."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not configured — email not sent to %s", to)
        return False

    try:
        import resend  # type: ignore[import-untyped]

        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": f"ExpressForge <{settings.email_from}>",
            "to": [to],
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)
        return False


def _button(url: str, text: str) -> str:
    return (
        f'<a href="{url}" style="display:inline-block;padding:12px 24px;'
        f'background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;'
        f'font-weight:600;font-family:sans-serif">{text}</a>'
    )


def _layout(content: str) -> str:
    return f"""
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px">
      <div style="margin-bottom:24px">
        <span style="font-size:20px;font-weight:700;color:#7c3aed">Express</span>
        <span style="font-size:20px;font-weight:700;color:#e2e8f0">Forge</span>
      </div>
      {content}
      <p style="margin-top:32px;font-size:12px;color:#64748b">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """


async def send_verification_email(to: str, token: str) -> bool:
    url = f"{settings.app_url}/auth/verify-email?token={token}"
    html = _layout(f"""
      <h2 style="color:#e2e8f0;margin:0 0 8px">Verify your email</h2>
      <p style="color:#94a3b8;margin:0 0 24px">Click the button below to verify your email address.</p>
      {_button(url, "Verify Email")}
      <p style="margin-top:16px;font-size:12px;color:#64748b">Link expires in 24 hours.</p>
    """)
    return await _send(to, "Verify your ExpressForge email", html)


async def send_device_approval_email(to: str, token: str, device_label: str) -> bool:
    url = f"{settings.app_url}/auth/device-approval?token={token}"
    html = _layout(f"""
      <h2 style="color:#e2e8f0;margin:0 0 8px">New device sign-in</h2>
      <p style="color:#94a3b8;margin:0 0 8px">
        A sign-in was attempted from a new device: <strong style="color:#e2e8f0">{device_label}</strong>
      </p>
      <p style="color:#94a3b8;margin:0 0 24px">Click below to approve this device.</p>
      {_button(url, "Approve Device")}
      <p style="margin-top:16px;font-size:12px;color:#64748b">
        Link expires in 15 minutes. If this wasn't you, change your password immediately.
      </p>
    """)
    return await _send(to, "New device sign-in to ExpressForge", html)


async def send_password_reset_email(to: str, token: str) -> bool:
    url = f"{settings.app_url}/auth/reset-password?token={token}"
    html = _layout(f"""
      <h2 style="color:#e2e8f0;margin:0 0 8px">Reset your password</h2>
      <p style="color:#94a3b8;margin:0 0 24px">Click below to set a new password.</p>
      {_button(url, "Reset Password")}
      <p style="margin-top:16px;font-size:12px;color:#64748b">Link expires in 1 hour.</p>
    """)
    return await _send(to, "Reset your ExpressForge password", html)


async def send_account_locked_email(to: str, unlock_minutes: int) -> bool:
    html = _layout(f"""
      <h2 style="color:#e2e8f0;margin:0 0 8px">Account temporarily locked</h2>
      <p style="color:#94a3b8">
        Too many failed sign-in attempts. Your account is locked for {unlock_minutes} minutes.
      </p>
      <p style="color:#94a3b8">If this wasn't you, please reset your password immediately.</p>
    """)
    return await _send(to, "ExpressForge account locked", html)
