"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Zap, ArrowRight, Loader2 } from "lucide-react";
import { StepShell } from "./StepShell";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { useConfigStore } from "@/lib/store";
import { useRouteStore } from "@/lib/routeStore";
import { toKebabCase } from "@/lib/utils";

export function Step4Project({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { preferences, setPreferences, complete } = useOnboardingStore();
  const { setProjectName, setLanguage, setPort, setAIProvider, setAIKey, reset } = useConfigStore();
  const { clearRoutes } = useRouteStore();

  const [name, setName] = useState(preferences.firstProjectName);
  const [loading, setLoading] = useState(false);
  const nameSlug = toKebabCase(name) || "my-api";

  function applyPreferences() {
    reset();
    clearRoutes();
    setProjectName(nameSlug);
    setLanguage(preferences.language);
    setPort(preferences.port);
    if (preferences.aiKey) {
      setAIProvider(preferences.aiProvider);
      setAIKey(preferences.aiKey);
    }
  }

  function handleStart() {
    setLoading(true);
    setPreferences({ firstProjectName: nameSlug });
    applyPreferences();
    complete();
    router.push("/builder");
  }

  function handleDashboard() {
    applyPreferences();
    complete();
    router.push("/dashboard");
  }

  return (
    <StepShell
      step={4}
      title="Name your first project"
      subtitle="Give your first project a name. You can create as many projects as you want — this is just the starting point."
      onNext={handleStart}
      onBack={onBack}
      nextLabel="Open Builder →"
      loading={loading}
      nextDisabled={!nameSlug}
    >
      {/* Name input */}
      <div>
        <label className="forge-label mb-1.5 block">Project name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-api"
          className="forge-input w-full font-mono"
          maxLength={64}
          autoFocus
        />
        {name && nameSlug !== name && (
          <p className="text-xs text-forge-text-dim mt-1">
            Will be saved as: <span className="text-forge-accent font-mono">{nameSlug}</span>
          </p>
        )}
      </div>

      {/* Summary card */}
      <div className="p-4 rounded-xl bg-forge-muted/50 border border-forge-border space-y-2">
        <p className="text-xs font-semibold text-forge-text-muted uppercase tracking-wider mb-3">
          Your setup
        </p>
        <SummaryRow label="Language" value={preferences.language === "typescript" ? "TypeScript" : "JavaScript"} />
        <SummaryRow label="Default port" value={String(preferences.port)} mono />
        <SummaryRow
          label="AI handler"
          value={preferences.aiKey ? `${capitalize(preferences.aiProvider)} · enabled` : "Not configured"}
          accent={!!preferences.aiKey}
        />
      </div>

      {/* Alternative CTA */}
      <div className="flex items-center gap-3">
        <hr className="flex-1 border-forge-border" />
        <span className="text-xs text-forge-text-dim">or</span>
        <hr className="flex-1 border-forge-border" />
      </div>
      <button
        onClick={handleDashboard}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-forge-text-muted hover:text-forge-text border border-forge-border hover:border-forge-accent/40 rounded-xl transition-all"
      >
        <FolderOpen className="h-4 w-4" />
        Go to Dashboard first
      </button>
    </StepShell>
  );
}

function SummaryRow({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-forge-text-dim">{label}</span>
      <span
        className={[
          mono ? "font-mono" : "font-medium",
          accent ? "text-forge-accent" : "text-forge-text",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
