import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AIConfig, GenerateConfig } from "./types";
import { toKebabCase } from "./utils";

type GenerationStatus = "idle" | "loading" | "success" | "error";

interface ConfigStore {
  config: GenerateConfig;
  aiConfig: AIConfig;
  status: GenerationStatus;
  error: string | null;
  isServerColdStart: boolean;
  savedProjectId: string | null;

  setProjectName: (name: string) => void;
  setLanguage: (lang: GenerateConfig["language"]) => void;
  setPort: (port: number) => void;
  toggle: <K extends keyof Pick<GenerateConfig, "auth" | "database" | "middleware" | "file_upload" | "email" | "queues" | "websockets">>(
    key: K,
    value: string
  ) => void;
  setIncludeDocker: (val: boolean) => void;
  setIncludeTests: (val: boolean) => void;
  setIncludeSwagger: (val: boolean) => void;

  setAIProvider: (provider: AIConfig["provider"]) => void;
  setAIKey: (key: string) => void;

  setStatus: (status: GenerationStatus, error?: string | null) => void;
  setServerColdStart: (val: boolean) => void;
  setSavedProjectId: (id: string | null) => void;
  reset: () => void;
}

const defaultConfig: GenerateConfig = {
  project_name: "my-api",
  language: "javascript",
  port: 3000,
  auth: [],
  database: [],
  middleware: [],
  file_upload: [],
  email: [],
  queues: [],
  websockets: [],
  include_docker: false,
  include_tests: false,
  include_swagger: false,
};

const defaultAIConfig: AIConfig = {
  provider: "anthropic",
  api_key: "",
};

export const useConfigStore = create<ConfigStore>()(
  devtools(
    (set) => ({
      config: { ...defaultConfig },
      aiConfig: { ...defaultAIConfig },
      status: "idle",
      error: null,
      isServerColdStart: false,
      savedProjectId: null,

      setProjectName: (name) =>
        set((s) => ({
          config: { ...s.config, project_name: toKebabCase(name) || s.config.project_name },
        })),

      setLanguage: (lang) =>
        set((s) => ({ config: { ...s.config, language: lang } })),

      setPort: (port) =>
        set((s) => ({ config: { ...s.config, port } })),

      toggle: (key, value) =>
        set((s) => {
          const arr = s.config[key] as string[];
          const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
          return { config: { ...s.config, [key]: next } };
        }),

      setIncludeDocker: (val) =>
        set((s) => ({ config: { ...s.config, include_docker: val } })),

      setIncludeTests: (val) =>
        set((s) => ({ config: { ...s.config, include_tests: val } })),

      setIncludeSwagger: (val) =>
        set((s) => ({ config: { ...s.config, include_swagger: val } })),

      setAIProvider: (provider) =>
        set((s) => ({ aiConfig: { ...s.aiConfig, provider } })),

      setAIKey: (api_key) =>
        set((s) => ({ aiConfig: { ...s.aiConfig, api_key } })),

      setStatus: (status, error = null) =>
        set({ status, error }),

      setServerColdStart: (val) =>
        set({ isServerColdStart: val }),

      setSavedProjectId: (id) =>
        set({ savedProjectId: id }),

      reset: () =>
        set({ config: { ...defaultConfig }, aiConfig: { ...defaultAIConfig }, status: "idle", error: null, savedProjectId: null }),
    }),
    { name: "expressforge-config" }
  )
);
