"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Laptop, CheckCircle, XCircle, Loader2, Zap, Mail } from "lucide-react";
import { approveDevice } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/authStore";
import type { TokenResponse } from "@/lib/types";

function DeviceApprovalContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const pending = params.get("pending");
  const { setTokens, setUser } = useAuthStore();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">(
    pending ? "pending" : token ? "loading" : "error"
  );

  useEffect(() => {
    if (!token) return;

    approveDevice(token)
      .then(async (res: TokenResponse) => {
        if (res.requires_totp && res.totp_session_token) {
          router.push(`/auth/totp?token=${encodeURIComponent(res.totp_session_token)}`);
          return;
        }
        if (res.access_token) {
          setTokens(res.access_token, res.refresh_token);
          const user = await getCurrentUser();
          setUser(user);
        }
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="bg-forge-surface border border-forge-border rounded-2xl p-8">
      {status === "pending" && (
        <>
          <Mail className="h-10 w-10 text-forge-accent mx-auto mb-4" />
          <h1 className="text-xl font-bold text-forge-text mb-2">Check your email</h1>
          <p className="text-forge-text-muted text-sm">
            We sent a device approval link to your email. Click it to complete sign-in.
          </p>
          <p className="text-forge-text-dim text-xs mt-4">Link expires in 15 minutes.</p>
        </>
      )}
      {status === "loading" && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-forge-accent mx-auto mb-4" />
          <h1 className="text-xl font-bold text-forge-text">Approving device…</h1>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="h-10 w-10 text-forge-success mx-auto mb-4" />
          <h1 className="text-xl font-bold text-forge-text mb-2">Device approved!</h1>
          <p className="text-forge-text-muted text-sm mb-6">You are now signed in.</p>
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
          <h1 className="text-xl font-bold text-forge-text mb-2">Invalid or expired link</h1>
          <p className="text-forge-text-muted text-sm mb-6">
            Please sign in again to receive a new approval email.
          </p>
          <button
            onClick={() => router.push("/auth/login")}
            className="forge-btn-primary w-full"
          >
            Back to Sign In
          </button>
        </>
      )}
    </div>
  );
}

export default function DeviceApprovalPage() {
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
          <DeviceApprovalContent />
        </Suspense>
      </div>
    </div>
  );
}
