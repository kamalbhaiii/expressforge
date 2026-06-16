/**
 * Auth API calls — register, login, token refresh, profile, TOTP, devices.
 * All calls use the shared axios instance (lib/http.ts) which handles
 * silent token refresh via the 401 interceptor.
 */

import { http } from "./http";
import type { DeviceInfo, TokenResponse, UserProfile } from "./types";

// ── Device fingerprint ────────────────────────────────────────────────────────

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  const raw = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}`,
    String(navigator.hardwareConcurrency ?? ""),
    navigator.platform ?? "",
  ].join("|");

  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getDeviceLabel(): string {
  if (typeof window === "undefined") return "Unknown Device";
  const ua = navigator.userAgent;
  let browser = "Browser";
  let os = "Unknown OS";

  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
}

// ── Registration ──────────────────────────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<TokenResponse> {
  const res = await http.post<TokenResponse>("/auth/register", {
    email,
    password,
    display_name: displayName ?? null,
  });
  return res.data;
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  options?: { skipFingerprint?: boolean }
): Promise<TokenResponse> {
  const fingerprint = options?.skipFingerprint ? undefined : getDeviceFingerprint();
  const res = await http.post<TokenResponse>("/auth/login", {
    email,
    password,
    device_fingerprint: fingerprint || undefined,
    device_label: fingerprint ? getDeviceLabel() : undefined,
  });
  return res.data;
}

// ── TOTP ──────────────────────────────────────────────────────────────────────

export async function verifyTOTP(
  totpSessionToken: string,
  code: string
): Promise<TokenResponse> {
  const res = await http.post<TokenResponse>("/auth/totp/verify", {
    totp_session_token: totpSessionToken,
    code,
  });
  return res.data;
}

export async function setupTOTP(): Promise<{
  secret: string;
  qr_uri: string;
  backup_codes: string[];
}> {
  const res = await http.post("/auth/totp/setup");
  return res.data;
}

export async function confirmTOTP(code: string): Promise<void> {
  await http.post("/auth/totp/confirm", { code });
}

export async function disableTOTP(): Promise<void> {
  await http.delete("/auth/totp");
}

// ── Device approval ───────────────────────────────────────────────────────────

export async function approveDevice(token: string): Promise<TokenResponse> {
  const res = await http.post<TokenResponse>("/auth/device-approval", { token });
  return res.data;
}

// ── Email verification ────────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<void> {
  await http.post(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<void> {
  await http.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await http.post("/auth/reset-password", { token, new_password: newPassword });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await http.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

// ── Token refresh ─────────────────────────────────────────────────────────────

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const res = await http.post<TokenResponse>("/auth/refresh", { refresh_token: refreshToken });
  return res.data;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<UserProfile> {
  const res = await http.get<UserProfile>("/auth/me");
  return res.data;
}

export async function updateProfile(data: {
  display_name?: string;
  avatar_url?: string;
}): Promise<UserProfile> {
  const res = await http.patch<UserProfile>("/auth/me", data);
  return res.data;
}

// ── Devices ───────────────────────────────────────────────────────────────────

export async function listDevices(): Promise<DeviceInfo[]> {
  const res = await http.get<DeviceInfo[]>("/auth/devices");
  return res.data;
}

export async function revokeDevice(deviceId: string): Promise<void> {
  await http.delete(`/auth/devices/${deviceId}`);
}
