"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StepShell } from "./StepShell";
import { useOnboardingStore } from "@/lib/onboardingStore";
import type { GenerateConfig } from "@/lib/types";

const LANGUAGES: { value: GenerateConfig["language"]; label: string; badge: string; desc: string }[] = [
  {
    value: "typescript",
    label: "TypeScript",
    badge: "Recommended",
    desc: "Full type safety, interfaces, and modern tooling. Generated code includes tsconfig and ts-node.",
  },
  {
    value: "javascript",
    label: "JavaScript",
    badge: "Quick start",
    desc: "No compile step. Ideal for rapid prototyping or teams not yet using TypeScript.",
  },
];

const PORT_PRESETS = [3000, 4000, 8000, 8080];

export function Step2Stack({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { preferences, setPreferences } = useOnboardingStore();
  const [lang, setLang] = useState<GenerateConfig["language"]>(preferences.language);
  const [port, setPort] = useState(preferences.port);
  const [portRaw, setPortRaw] = useState(String(preferences.port));
  const [portError, setPortError] = useState("");

  function handlePortChange(raw: string) {
    setPortRaw(raw);
    const n = parseInt(raw, 10);
    if (!raw || isNaN(n) || n < 1 || n > 65535) {
      setPortError("Port must be 1–65535");
    } else {
      setPortError("");
      setPort(n);
    }
  }

  function handleNext() {
    if (portError) return;
    setPreferences({ language: lang, port });
    onNext();
  }

  return (
    <StepShell
      step={2}
      title="Choose your stack"
      subtitle="Set your preferred language and default port. These become the starting point for every new project."
      onNext={handleNext}
      onBack={onBack}
      nextDisabled={!!portError}
    >
      {/* Language */}
      <div>
        <label className="forge-label mb-3 block">Language</label>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLang(l.value)}
              className={cn(
                "relative text-left p-4 rounded-xl border-2 transition-all duration-200",
                lang === l.value
                  ? "border-forge-accent bg-forge-accent/10"
                  : "border-forge-border bg-forge-muted/50 hover:border-forge-accent/40"
              )}
            >
              {lang === l.value && (
                <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-forge-accent flex items-center justify-center">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              <p className="text-sm font-semibold text-forge-text">{l.label}</p>
              <span className="text-[10px] font-medium text-forge-accent bg-forge-accent/10 rounded px-1.5 py-0.5 mt-1 inline-block">
                {l.badge}
              </span>
              <p className="text-xs text-forge-text-muted mt-2 leading-relaxed">{l.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Port */}
      <div>
        <label className="forge-label mb-2 block">Default port</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PORT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPort(p); setPortRaw(String(p)); setPortError(""); }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg border font-mono transition-all",
                port === p && !portError
                  ? "bg-forge-accent text-white border-forge-accent"
                  : "bg-forge-muted border-forge-border text-forge-text-muted hover:border-forge-accent/40"
              )}
            >
              {p}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={65535}
            value={portRaw}
            onChange={(e) => handlePortChange(e.target.value)}
            className="forge-input w-24 font-mono text-sm"
            placeholder="Custom"
          />
        </div>
        {portError && <p className="text-xs text-forge-error mt-1">{portError}</p>}
        <p className="text-xs text-forge-text-dim mt-1">
          This sets the <code className="text-forge-accent">PORT</code> in generated <code className="text-forge-accent">.env</code> files.
        </p>
      </div>
    </StepShell>
  );
}
