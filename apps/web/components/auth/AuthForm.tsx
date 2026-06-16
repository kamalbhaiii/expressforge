"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { register, login } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { getApiError } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import type { TokenResponse } from "@/lib/types";

interface AuthFormProps {
  defaultTab?: "login" | "register";
  onSuccess?: (response: TokenResponse) => void;
  compact?: boolean;
}

export function AuthForm({ defaultTab = "login", onSuccess, compact }: AuthFormProps) {
  const { setTokens, setUser } = useAuthStore();
  const [tab, setTab] = useState(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res: TokenResponse;
      if (tab === "register") {
        res = await register(email, password, displayName || undefined);
      } else {
        res = await login(email, password);
      }

      // Handle flows that need further action (TOTP, device approval)
      if (res.requires_totp || res.requires_device_approval) {
        onSuccess?.(res);
        return;
      }

      if (res.access_token) {
        setTokens(res.access_token, res.refresh_token);
        const user = await getCurrentUser();
        setUser(user);
        toast(tab === "register" ? "Account created!" : "Welcome back!", "success");
        onSuccess?.(res);
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "" : "w-full max-w-sm mx-auto"}>
      <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setError(""); }}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
          <TabsTrigger value="register" className="flex-1">Create Account</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div>
              <label className="forge-label">Display Name (optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="forge-input w-full mt-1"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="forge-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="forge-input w-full mt-1"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="forge-label">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? "8+ chars, mixed case + symbol" : "Your password"}
                className="forge-input w-full pr-10"
                required
                autoComplete={tab === "register" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-text-dim hover:text-forge-text transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-forge-error bg-forge-error/10 rounded-lg px-3 py-2 border border-forge-error/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="forge-btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === "register" ? "Create Account" : "Sign In"}
          </button>

          {tab === "login" && (
            <p className="text-center text-xs text-forge-text-dim">
              <a href="/auth/forgot-password" className="text-forge-accent hover:underline">
                Forgot password?
              </a>
            </p>
          )}
        </form>
      </Tabs>
    </div>
  );
}
