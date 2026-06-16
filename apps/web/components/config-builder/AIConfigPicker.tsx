"use client";

import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useConfigStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  {
    id: "anthropic" as const,
    label: "Anthropic",
    hint: "claude-sonnet-4-6",
    placeholder: "sk-ant-...",
  },
  {
    id: "openai" as const,
    label: "OpenAI",
    hint: "gpt-4o-mini",
    placeholder: "sk-...",
  },
  {
    id: "gemini" as const,
    label: "Gemini",
    hint: "gemini-1.5-flash",
    placeholder: "AIza...",
  },
];

export function AIConfigPicker() {
  const { aiConfig, setAIProvider, setAIKey } = useConfigStore();
  const [showKey, setShowKey] = useState(false);

  const selectedProvider = PROVIDERS.find((p) => p.id === aiConfig.provider)!;

  return (
    <Card>
      <CardHeader>
        <Sparkles className="h-4 w-4 text-forge-accent" />
        <CardTitle>AI Enhancement</CardTitle>
        <span className="ml-auto text-xs text-forge-text-muted">Optional · BYOK</span>
      </CardHeader>

      <p className="text-xs text-forge-text-muted mb-4 leading-relaxed">
        Add your own API key to get an AI-generated README and .env.example.
        Your key is used only for this request and <strong className="text-forge-text">never stored</strong>.
        Leave blank to use static templates.
      </p>

      {/* Provider selector */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => setAIProvider(p.id)}
            className={cn(
              "py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 border",
              aiConfig.provider === p.id
                ? "bg-forge-accent/15 border-forge-accent text-forge-glow"
                : "bg-forge-muted/30 border-forge-border text-forge-text-muted hover:border-forge-muted hover:text-forge-text"
            )}
          >
            <span className="block">{p.label}</span>
            <span className="block text-xs opacity-60 font-mono">{p.hint}</span>
          </button>
        ))}
      </div>

      {/* API key input */}
      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={aiConfig.api_key}
          onChange={(e) => setAIKey(e.target.value)}
          placeholder={selectedProvider.placeholder}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "w-full bg-forge-muted/40 border border-forge-border rounded-lg",
            "px-3 py-2.5 pr-10 text-sm font-mono text-forge-text placeholder:text-forge-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-forge-glow focus:border-forge-accent",
            "transition-colors duration-150"
          )}
        />
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-text-muted hover:text-forge-text transition-colors"
          aria-label={showKey ? "Hide API key" : "Show API key"}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {aiConfig.api_key && (
        <p className="mt-2 text-xs text-emerald-400">
          ✓ AI enhancement enabled with {selectedProvider.label}
        </p>
      )}
    </Card>
  );
}
