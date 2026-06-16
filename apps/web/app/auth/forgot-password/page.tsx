"use client";

import { useState } from "react";
import { Zap, CheckCircle, Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth";
import { getApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold mb-6">
            <Zap className="h-5 w-5 text-forge-accent" />
            <span className="text-forge-text">Express<span className="text-forge-accent">Forge</span></span>
          </a>
          <h1 className="text-2xl font-bold text-forge-text">Forgot password?</h1>
          <p className="text-forge-text-muted text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-forge-surface border border-forge-border rounded-2xl p-6">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="h-10 w-10 text-forge-success mx-auto mb-3" />
              <p className="text-forge-text font-medium">Check your email</p>
              <p className="text-forge-text-muted text-sm mt-1">
                If that address is registered, a reset link is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="forge-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="forge-input w-full mt-1"
                  required
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
                Send Reset Link
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-forge-text-dim mt-4">
          <a href="/auth/login" className="text-forge-accent hover:underline">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
