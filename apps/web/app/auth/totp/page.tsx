"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Loader2, Zap } from "lucide-react";
import { verifyTOTP } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/authStore";
import { getApiError } from "@/lib/api";

function TOTPContent() {
  const params = useSearchParams();
  const router = useRouter();
  const totpToken = params.get("token");
  const { setTokens, setUser } = useAuthStore();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!totpToken) return;
    setError("");
    setLoading(true);

    try {
      const res = await verifyTOTP(totpToken, code);
      if (res.access_token) {
        setTokens(res.access_token, res.refresh_token);
        const user = await getCurrentUser();
        setUser(user);
        router.replace("/dashboard");
      }
    } catch (err) {
      setError(getApiError(err));
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  if (!totpToken) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center">
        <p className="text-forge-error">Invalid session. Please sign in again.</p>
      </div>
    );
  }

  return (
    <div className="bg-forge-surface border border-forge-border rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="forge-input w-full text-center text-2xl tracking-widest font-mono"
          autoFocus
          autoComplete="one-time-code"
        />

        {error && (
          <p className="text-sm text-forge-error bg-forge-error/10 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="forge-btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify
        </button>
      </form>

      <p className="text-center text-xs text-forge-text-dim mt-4">
        Lost access to your authenticator?{" "}
        <span className="text-forge-text-muted">Enter a backup code above.</span>
      </p>
    </div>
  );
}

export default function TOTPPage() {
  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold mb-6">
            <Zap className="h-5 w-5 text-forge-accent" />
            <span className="text-forge-text">Express<span className="text-forge-accent">Forge</span></span>
          </a>
          <ShieldCheck className="h-10 w-10 text-forge-accent mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-forge-text">Two-Factor Auth</h1>
          <p className="text-forge-text-muted text-sm mt-1">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        <Suspense fallback={
          <div className="bg-forge-surface border border-forge-border rounded-2xl p-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-forge-accent" />
          </div>
        }>
          <TOTPContent />
        </Suspense>
      </div>
    </div>
  );
}
