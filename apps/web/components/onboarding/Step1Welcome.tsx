"use client";

import { Zap, Route, Download, Sparkles } from "lucide-react";
import { StepShell } from "./StepShell";
import { useAuthStore } from "@/lib/authStore";

const FEATURES = [
  {
    icon: <Zap className="h-5 w-5 text-forge-accent" />,
    title: "Visual Config Builder",
    desc: "Pick auth strategies, databases, middleware, and more — no boilerplate hunting.",
  },
  {
    icon: <Route className="h-5 w-5 text-forge-accent" />,
    title: "Route Builder",
    desc: "Define REST endpoints with request/response shapes. One click to scaffold full CRUD.",
  },
  {
    icon: <Sparkles className="h-5 w-5 text-forge-accent" />,
    title: "AI Handler Code",
    desc: "Describe a route in plain English — get production-ready handler code instantly (BYOK).",
  },
  {
    icon: <Download className="h-5 w-5 text-forge-accent" />,
    title: "Download & Run",
    desc: "Get a production-ready ZIP. Just npm install && npm run dev. No lock-in.",
  },
];

export function Step1Welcome({ onNext }: { onNext: () => void }) {
  const { user } = useAuthStore();
  const name = user?.display_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <StepShell
      step={1}
      title={`Welcome, ${name}!`}
      subtitle="ExpressForge builds production-ready Express.js backends — visually. Let's get you set up in under a minute."
      onNext={onNext}
      nextLabel="Get started →"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex gap-3 p-4 rounded-xl bg-forge-muted/60 border border-forge-border hover:border-forge-accent/40 transition-colors"
          >
            <div className="shrink-0 mt-0.5">{f.icon}</div>
            <div>
              <p className="text-sm font-semibold text-forge-text">{f.title}</p>
              <p className="text-xs text-forge-text-muted mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-forge-text-dim text-center pt-2">
        You can change any of these settings later in your project or profile.
      </p>
    </StepShell>
  );
}
