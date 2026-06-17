import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AIConfig, GenerateConfig } from "./types";

export interface OnboardingPreferences {
  language: GenerateConfig["language"];
  port: number;
  aiProvider: AIConfig["provider"];
  aiKey: string;
  firstProjectName: string;
}

interface OnboardingStore {
  completed: boolean;
  step: number; // 1–4
  preferences: OnboardingPreferences;

  setStep: (step: number) => void;
  setPreferences: (patch: Partial<OnboardingPreferences>) => void;
  complete: () => void;
  reset: () => void;
}

const defaultPreferences: OnboardingPreferences = {
  language: "typescript",
  port: 3000,
  aiProvider: "anthropic",
  aiKey: "",
  firstProjectName: "my-api",
};

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    persist(
      (set) => ({
        completed: false,
        step: 1,
        preferences: { ...defaultPreferences },

        setStep: (step) => set({ step }),

        setPreferences: (patch) =>
          set((s) => ({ preferences: { ...s.preferences, ...patch } })),

        complete: () => set({ completed: true }),

        reset: () =>
          set({ completed: false, step: 1, preferences: { ...defaultPreferences } }),
      }),
      { name: "expressforge-onboarding" }
    ),
    { name: "expressforge-onboarding" }
  )
);
