"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AuthForm } from "./AuthForm";
import type { TokenResponse } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectOnSuccess?: string;
}

export function AuthModal({ isOpen, onClose, onSuccess, redirectOnSuccess }: AuthModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  function handleSuccess(res: TokenResponse) {
    if (res.requires_totp && res.totp_session_token) {
      onClose();
      router.push(`/auth/totp?token=${encodeURIComponent(res.totp_session_token)}`);
      return;
    }
    if (res.requires_device_approval) {
      onClose();
      router.push("/auth/device-approval?pending=true");
      return;
    }
    onSuccess?.();
    if (redirectOnSuccess) {
      router.push(redirectOnSuccess);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-sm bg-forge-surface border border-forge-border rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-forge-text-dim hover:text-forge-text transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-forge-text">
            <span className="text-forge-accent">Express</span>Forge
          </h2>
          <p className="text-sm text-forge-text-muted mt-1">Sign in to generate projects</p>
        </div>
        <AuthForm onSuccess={handleSuccess} compact />
      </div>
    </div>
  );
}
