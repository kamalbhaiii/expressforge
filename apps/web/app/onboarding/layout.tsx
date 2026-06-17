"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/auth/login");
  }, []);

  return (
    <div className="min-h-screen bg-forge-bg flex flex-col">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-forge-border">
        <a href="/" className="inline-flex items-center gap-2 text-lg font-bold">
          <Zap className="h-5 w-5 text-forge-accent" />
          <span className="text-forge-text">
            Express<span className="text-forge-accent">Forge</span>
          </span>
        </a>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-forge-text-dim hover:text-forge-text transition-colors"
        >
          Skip setup
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
