"use client";

import { Shield, Check } from "lucide-react";
import { useConfigStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const AUTH_OPTIONS = [
  {
    value: "jwt",
    label: "JWT",
    desc: "Access + refresh token flow, stateless",
    packages: "jsonwebtoken, bcryptjs",
  },
  {
    value: "session",
    label: "Session",
    desc: "Cookie-based sessions with server store",
    packages: "express-session, connect-pg-simple",
  },
  {
    value: "oauth_google",
    label: "Google OAuth",
    desc: "OAuth 2.0 via Passport.js",
    packages: "passport, passport-google-oauth20",
  },
  {
    value: "api_key",
    label: "API Key",
    desc: "Static Bearer key auth for service-to-service",
    packages: "—",
  },
  {
    value: "magic_link",
    label: "Magic Link",
    desc: "Passwordless email link authentication",
    packages: "nodemailer, crypto",
  },
] as const;

export function AuthPicker() {
  const { config, toggle } = useConfigStore();
  const selected = config.auth as string[];

  return (
    <Card>
      <CardHeader>
        <Shield className="h-4 w-4 text-forge-accent" />
        <CardTitle>Authentication</CardTitle>
        <span className="ml-auto text-xs text-forge-text-dim">multi-select</span>
      </CardHeader>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {AUTH_OPTIONS.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              data-testid={`auth-${opt.value}`}
              onClick={() => toggle("auth", opt.value)}
              className={cn(
                "text-left p-3 rounded-lg border transition-all duration-150 relative",
                active
                  ? "border-forge-accent bg-forge-accent/10 shadow-sm shadow-forge-accent/20"
                  : "border-forge-border bg-forge-bg hover:border-forge-muted"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-forge-text">{opt.label}</span>
                <div className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                  active ? "bg-forge-accent border-forge-accent" : "border-forge-border"
                )}>
                  {active && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
              </div>
              <p className="text-xs text-forge-text-muted">{opt.desc}</p>
              {opt.packages !== "—" && (
                <p className="mt-1.5 text-xs font-mono text-forge-text-dim truncate">{opt.packages}</p>
              )}
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="mt-2 text-xs text-forge-text-dim">No auth selected — app will have public endpoints only</p>
      )}
    </Card>
  );
}
