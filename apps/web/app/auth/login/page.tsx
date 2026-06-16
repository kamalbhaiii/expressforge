"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuthStore } from "@/lib/authStore";
import { useEffect } from "react";
import type { TokenResponse } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  function handleSuccess(res: TokenResponse) {
    if (res.requires_totp && res.totp_session_token) {
      router.push(`/auth/totp?token=${encodeURIComponent(res.totp_session_token)}`);
      return;
    }
    if (res.requires_device_approval) {
      router.push("/auth/device-approval?pending=true");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold mb-6">
            <Zap className="h-5 w-5 text-forge-accent" />
            <span className="text-forge-text">Express<span className="text-forge-accent">Forge</span></span>
          </a>
          <h1 className="text-2xl font-bold text-forge-text">Welcome back</h1>
          <p className="text-forge-text-muted text-sm mt-1">Sign in to your account</p>
        </div>
        <div className="bg-forge-surface border border-forge-border rounded-2xl p-6">
          <AuthForm defaultTab="login" onSuccess={handleSuccess} compact />
        </div>
        <p className="text-center text-sm text-forge-text-dim mt-4">
          Don&apos;t have an account?{" "}
          <a href="/auth/register" className="text-forge-accent hover:underline">Create one</a>
        </p>
      </div>
    </div>
  );
}
