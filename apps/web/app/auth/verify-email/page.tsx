"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Zap } from "lucide-react";
import { verifyEmail } from "@/lib/auth";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="bg-forge-surface border border-forge-border rounded-2xl p-8">
      {status === "loading" && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-forge-accent mx-auto mb-4" />
          <h1 className="text-xl font-bold text-forge-text">Verifying your email…</h1>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="h-10 w-10 text-forge-success mx-auto mb-4" />
          <h1 className="text-xl font-bold text-forge-text mb-2">Email verified!</h1>
          <p className="text-forge-text-muted text-sm mb-6">Your account is ready to use.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="forge-btn-primary w-full"
          >
            Go to Dashboard
          </button>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-10 w-10 text-forge-error mx-auto mb-4" />
          <h1 className="text-xl font-bold text-forge-text mb-2">Invalid link</h1>
          <p className="text-forge-text-muted text-sm mb-6">
            This link is invalid or has expired. Request a new one from your settings.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="forge-btn-primary w-full"
          >
            Go to Dashboard
          </button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <a href="/" className="inline-flex items-center gap-2 text-xl font-bold mb-8">
          <Zap className="h-5 w-5 text-forge-accent" />
          <span className="text-forge-text">Express<span className="text-forge-accent">Forge</span></span>
        </a>
        <Suspense fallback={
          <div className="bg-forge-surface border border-forge-border rounded-2xl p-8">
            <Loader2 className="h-10 w-10 animate-spin text-forge-accent mx-auto mb-4" />
            <h1 className="text-xl font-bold text-forge-text">Loading…</h1>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
