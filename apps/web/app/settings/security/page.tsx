"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, ShieldOff, Smartphone, Trash2, Loader2,
  KeyRound, Eye, EyeOff, CheckCircle2, Copy
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import {
  setupTOTP, confirmTOTP, disableTOTP,
  listDevices, revokeDevice,
  changePassword, getCurrentUser,
} from "@/lib/auth";
import { getApiError } from "@/lib/api";
import { Nav } from "@/components/Nav";
import { toast } from "@/components/ui/Toast";
import type { DeviceInfo } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type TOTPStep = "idle" | "setup" | "confirm" | "done";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/auth/login");
    else {
      loadDevices();
    }
  }, []);

  // ── Devices ────────────────────────────────────────────────────────────────
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  async function loadDevices() {
    try {
      const list = await listDevices();
      setDevices(list);
    } catch {
      /* noop */
    } finally {
      setDevicesLoading(false);
    }
  }

  async function handleRevokeDevice(id: string) {
    try {
      await revokeDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      toast("Device removed", "info");
    } catch (err) {
      toast(getApiError(err), "error");
    }
  }

  // ── TOTP ───────────────────────────────────────────────────────────────────
  const [totpStep, setTotpStep] = useState<TOTPStep>("idle");
  const [totpData, setTotpData] = useState<{ secret: string; qr_uri: string; backup_codes: string[] } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [backupsCopied, setBackupsCopied] = useState(false);

  async function startTOTPSetup() {
    setTotpLoading(true);
    try {
      const data = await setupTOTP();
      setTotpData(data);
      setTotpStep("setup");
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleConfirmTOTP() {
    if (!totpCode || totpCode.length < 6) return;
    setTotpLoading(true);
    try {
      await confirmTOTP(totpCode);
      const updated = await getCurrentUser();
      setUser(updated);
      setTotpStep("done");
      toast("2FA enabled!", "success");
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setTotpLoading(false);
    }
  }

  async function handleDisableTOTP() {
    if (!confirm("Disable two-factor authentication? This reduces your account security.")) return;
    try {
      await disableTOTP();
      const updated = await getCurrentUser();
      setUser(updated);
      setTotpStep("idle");
      toast("2FA disabled", "info");
    } catch (err) {
      toast(getApiError(err), "error");
    }
  }

  function copyBackups() {
    if (!totpData) return;
    navigator.clipboard.writeText(totpData.backup_codes.join("\n"));
    setBackupsCopied(true);
    setTimeout(() => setBackupsCopied(false), 2000);
  }

  // ── Change password ────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleChangePw(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { toast("Passwords don't match", "error"); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast("Password changed", "success");
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setPwLoading(false);
    }
  }

  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-forge-bg">
      <Nav />
      <main className="max-w-screen-sm mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-forge-text">Security</h1>
          <p className="text-forge-text-muted text-sm mt-1">Manage your password, 2FA, and trusted devices</p>
        </div>

        {/* ── Two-factor authentication ─────────────────────────────────────── */}
        <Section title="Two-Factor Authentication">
          {user?.totp_enabled && totpStep !== "done" ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-forge-success" />
                <div>
                  <p className="text-sm font-medium text-forge-text">2FA is enabled</p>
                  <p className="text-xs text-forge-text-muted">Your account is protected with TOTP.</p>
                </div>
              </div>
              <button
                onClick={handleDisableTOTP}
                className="text-xs text-forge-error hover:underline"
              >
                Disable
              </button>
            </div>
          ) : totpStep === "idle" || totpStep === "done" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-forge-text-dim" />
                <div>
                  <p className="text-sm font-medium text-forge-text">2FA is not enabled</p>
                  <p className="text-xs text-forge-text-muted">Add an extra layer of protection.</p>
                </div>
              </div>
              <button
                onClick={startTOTPSetup}
                disabled={totpLoading}
                className="forge-btn-primary text-sm flex items-center gap-2"
              >
                {totpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <ShieldCheck className="h-4 w-4" />
                Enable 2FA
              </button>
            </div>
          ) : totpStep === "setup" && totpData ? (
            <div className="space-y-4">
              <p className="text-sm text-forge-text-muted">
                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc).
              </p>
              {/* QR via Google Charts */}
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpData.qr_uri)}`}
                  alt="TOTP QR Code"
                  className="rounded-lg border border-forge-border p-2 bg-white"
                  width={180}
                  height={180}
                />
              </div>
              <div>
                <label className="forge-label">Manual entry (secret)</label>
                <code className="block mt-1 text-xs bg-forge-muted rounded-lg px-3 py-2 text-forge-accent break-all">
                  {totpData.secret}
                </code>
              </div>
              <div>
                <label className="forge-label mb-1">Backup codes — save these somewhere safe</label>
                <div className="bg-forge-muted rounded-lg p-3 grid grid-cols-2 gap-1">
                  {totpData.backup_codes.map((code) => (
                    <code key={code} className="text-xs text-forge-text font-mono">{code}</code>
                  ))}
                </div>
                <button
                  onClick={copyBackups}
                  className="mt-2 flex items-center gap-1.5 text-xs text-forge-text-muted hover:text-forge-text transition-colors"
                >
                  {backupsCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-forge-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {backupsCopied ? "Copied!" : "Copy backup codes"}
                </button>
              </div>
              <button
                onClick={() => setTotpStep("confirm")}
                className="forge-btn-primary text-sm w-full"
              >
                I&apos;ve saved the codes — continue
              </button>
            </div>
          ) : totpStep === "confirm" ? (
            <div className="space-y-3">
              <p className="text-sm text-forge-text-muted">
                Enter the 6-digit code from your authenticator to confirm.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="forge-input w-full text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
              <button
                onClick={handleConfirmTOTP}
                disabled={totpLoading || totpCode.length < 6}
                className="forge-btn-primary text-sm w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {totpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Activate 2FA
              </button>
            </div>
          ) : null}
        </Section>

        {/* ── Change password ─────────────────────────────────────────────────── */}
        <Section title="Change Password">
          <form onSubmit={handleChangePw} className="space-y-3">
            {[
              { label: "Current password", value: currentPw, onChange: setCurrentPw, autoComplete: "current-password" },
              { label: "New password", value: newPw, onChange: setNewPw, autoComplete: "new-password" },
              { label: "Confirm new password", value: confirmPw, onChange: setConfirmPw, autoComplete: "new-password" },
            ].map(({ label, value, onChange, autoComplete }) => (
              <div key={label}>
                <label className="forge-label">{label}</label>
                <div className="relative mt-1">
                  <input
                    type={showPw ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="forge-input w-full pr-10"
                    autoComplete={autoComplete}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-text-dim hover:text-forge-text"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={pwLoading}
              className="forge-btn-primary text-sm flex items-center gap-2"
            >
              {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </button>
          </form>
        </Section>

        {/* ── Trusted devices ─────────────────────────────────────────────────── */}
        <Section title="Trusted Devices">
          {devicesLoading ? (
            <div className="flex items-center gap-2 text-forge-text-muted text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading devices…
            </div>
          ) : devices.length === 0 ? (
            <p className="text-sm text-forge-text-muted">No trusted devices yet.</p>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-forge-muted/50 border border-forge-border"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Smartphone className="h-4 w-4 text-forge-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-forge-text truncate">{device.label}</p>
                      <p className="text-xs text-forge-text-dim">
                        Last seen {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeDevice(device.id)}
                    className="text-forge-text-dim hover:text-forge-error transition-colors shrink-0"
                    title="Remove device"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <nav className="flex gap-3">
          <a href="/settings/profile" className="text-sm text-forge-text-muted hover:text-forge-text transition-colors">Profile</a>
          <span className="text-forge-border">·</span>
          <a href="/settings/security" className="text-sm text-forge-accent font-medium">Security</a>
        </nav>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-forge-surface border border-forge-border rounded-2xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-forge-text">{title}</h2>
      {children}
    </div>
  );
}
