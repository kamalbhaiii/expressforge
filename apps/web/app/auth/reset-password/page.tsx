"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { resetPassword } from "@/lib/auth";
import { getApiError } from "@/lib/api";

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-forge-surface border border-forge-border rounded-2xl p-6">
      {done ? (
        <div className="text-center">
          <CheckCircle className="h-10 w-10 text-forge-success mx-auto mb-3" />
          <p className="text-forge-text font-medium mb-4">Password updated!</p>
          <button onClick={() => router.push("/auth/login")} className="forge-btn-primary w-full">
            Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="forge-label">New Password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ chars, mixed case + symbol"
                className="forge-input w-full pr-10"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-text-dim hover:text-forge-text transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="forge-label">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="forge-input w-full mt-1"
              required
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="text-sm text-forge-error bg-forge-error/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="forge-btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update Password
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold mb-6">
            <Zap className="h-5 w-5 text-forge-accent" />
            <span className="text-forge-text">Express<span className="text-forge-accent">Forge</span></span>
          </a>
          <h1 className="text-2xl font-bold text-forge-text">Set new password</h1>
        </div>
        <Suspense fallback={
          <div className="bg-forge-surface border border-forge-border rounded-2xl p-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-forge-accent" />
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
