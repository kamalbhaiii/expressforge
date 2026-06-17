"use client";

import { useState } from "react";
import { Eye, EyeOff, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepShell } from "./StepShell";
import { useOnboardingStore } from "@/lib/onboardingStore";
import type { AIConfig } from "@/lib/types";

const PROVIDERS: {
  value: AIConfig["provider"];
  label: string;
  model: string;
  keyPlaceholder: string;
  docsUrl: string;
}[] = [
  {
    value: "anthropic",
    label: "Anthropic",
    model: "claude-sonnet-4-6",
    keyPlaceholder: "sk-ant-api03-…",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    value: "openai",
    label: "OpenAI",
    model: "gpt-4o-mini",
    keyPlaceholder: "sk-proj-…",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    model: "gemini-1.5-flash",
    keyPlaceholder: "AIza…",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
];

export function Step3AI({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { preferences, setPreferences } = useOnboardingStore();
  const [provider, setProvider] = useState<AIConfig["provider"]>(preferences.aiProvider);
  const [apiKey, setApiKey] = useState(preferences.aiKey);
  const [showKey, setShowKey] = useState(false);
  const [skip, setSkip] = useState(!preferences.aiKey);

  const selected = PROVIDERS.find((p) => p.value === provider)!;

  function handleNext() {
    setPreferences({
      aiProvider: provider,
      aiKey: skip ? "" : apiKey.trim(),
    });
    onNext();
  }

  return (
    <StepShell
      step={3}
      title="AI-powered handlers"
      subtitle="Supply your own LLM key to generate route handler code from plain-English descriptions. Your key is never stored on our servers."
      onNext={handleNext}
      onBack={onBack}
      nextLabel={skip || !apiKey.trim() ? "Skip for now" : "Save & continue"}
    >
      {/* Skip toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none group">
        <div
          onClick={() => setSkip((v) => !v)}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0",
            !skip ? "bg-forge-accent" : "bg-forge-muted border border-forge-border"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
              !skip ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </div>
        <span className="text-sm text-forge-text">Enable AI handler generation</span>
      </label>

      {!skip && (
        <div className="space-y-4 animate-fade-in">
          {/* Provider tabs */}
          <div>
            <label className="forge-label mb-2 block">Provider</label>
            <div className="flex gap-2 flex-wrap">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setProvider(p.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg border font-medium transition-all",
                    provider === p.value
                      ? "bg-forge-accent text-white border-forge-accent"
                      : "bg-forge-muted border-forge-border text-forge-text-muted hover:border-forge-accent/40"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-forge-text-dim mt-1.5">
              Model: <span className="text-forge-accent font-mono">{selected.model}</span>
            </p>
          </div>

          {/* API key input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="forge-label">API Key</label>
              <a
                href={selected.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-forge-accent hover:underline"
              >
                Get key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selected.keyPlaceholder}
                className="forge-input w-full pr-10 font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-text-dim hover:text-forge-text"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Security note */}
          <div className="flex gap-2.5 p-3 rounded-lg bg-forge-accent/5 border border-forge-accent/20">
            <Sparkles className="h-4 w-4 text-forge-accent shrink-0 mt-0.5" />
            <p className="text-xs text-forge-text-muted leading-relaxed">
              Your API key is stored only in your browser (localStorage) and sent directly to the AI provider per request.
              It is <strong className="text-forge-text">never transmitted to or stored on ExpressForge servers</strong>.
            </p>
          </div>
        </div>
      )}

      {skip && (
        <div className="p-4 rounded-xl bg-forge-muted/50 border border-forge-border text-center">
          <p className="text-sm text-forge-text-muted">
            No problem — you can add an AI key any time in the builder under{" "}
            <span className="text-forge-text font-medium">AI Config</span>.
          </p>
        </div>
      )}
    </StepShell>
  );
}
