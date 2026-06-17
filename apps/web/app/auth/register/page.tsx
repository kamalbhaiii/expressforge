"use client";

import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useOnboardingStore } from "@/lib/onboardingStore";
import type { TokenResponse } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { reset } = useOnboardingStore();

  function handleSuccess(res: TokenResponse) {
    if (res.requires_device_approval) {
      router.push("/auth/device-approval?pending=true");
      return;
    }
    // New users always start onboarding from step 1
    reset();
    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-xl font-bold mb-6">
            <Zap className="h-5 w-5 text-forge-accent" />
            <span className="text-forge-text">Express<span className="text-forge-accent">Forge</span></span>
          </a>
          <h1 className="text-2xl font-bold text-forge-text">Create account</h1>
          <p className="text-forge-text-muted text-sm mt-1">Start building backends in seconds</p>
        </div>
        <div className="bg-forge-surface border border-forge-border rounded-2xl p-6">
          <AuthForm defaultTab="register" onSuccess={handleSuccess} compact />
        </div>
        <p className="text-center text-sm text-forge-text-dim mt-4">
          Already have an account?{" "}
          <a href="/auth/login" className="text-forge-accent hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
