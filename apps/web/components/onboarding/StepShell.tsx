"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { n: 1, label: "Welcome" },
  { n: 2, label: "Your Stack" },
  { n: 3, label: "AI Setup" },
  { n: 4, label: "First Project" },
];

interface StepShellProps {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}

export function StepShell({
  step,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = "Continue",
  nextDisabled = false,
  loading = false,
}: StepShellProps) {
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="w-full max-w-lg animate-fade-in">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300",
                  s.n < step
                    ? "bg-forge-accent border-forge-accent text-white"
                    : s.n === step
                    ? "bg-forge-accent/20 border-forge-accent text-forge-accent"
                    : "bg-forge-muted border-forge-border text-forge-text-dim"
                )}
              >
                {s.n < step ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium hidden sm:block",
                  s.n === step ? "text-forge-accent" : "text-forge-text-dim"
                )}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1.5 bg-forge-muted rounded-full overflow-hidden mt-1">
          <div
            className="absolute inset-y-0 left-0 bg-forge-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-forge-surface border border-forge-border rounded-2xl p-8 shadow-xl shadow-black/20">
        <h1 className="text-2xl font-bold text-forge-text mb-1">{title}</h1>
        <p className="text-forge-text-muted text-sm mb-8">{subtitle}</p>

        <div className="space-y-5">{children}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {onBack ? (
            <button
              onClick={onBack}
              className="text-sm text-forge-text-muted hover:text-forge-text transition-colors"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onNext}
            disabled={nextDisabled || loading}
            className="forge-btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {nextLabel}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-forge-text-dim mt-4">
        Step {step} of {STEPS.length}
      </p>
    </div>
  );
}
