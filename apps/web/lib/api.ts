import { AxiosError } from "axios";
import { http } from "./http";
import type { AIConfig, GenerateConfig, Project } from "./types";

// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: "ok";
  version: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await http.get<HealthResponse>("/health");
  return res.data;
}

// ── Project generation ────────────────────────────────────────────────────────

export async function generateProject(
  config: GenerateConfig,
  aiConfig?: AIConfig,
  customRoutes?: object[]
): Promise<Blob> {
  const body = {
    ...config,
    custom_routes: customRoutes ?? [],
    ...(aiConfig?.api_key
      ? { ai: { provider: aiConfig.provider, api_key: aiConfig.api_key } }
      : {}),
  };
  const res = await http.post("/generate", body, { responseType: "blob" });
  return new Blob([res.data], { type: "application/zip" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Projects CRUD ─────────────────────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  const res = await http.get<Project[]>("/projects");
  return res.data;
}

export async function getProject(id: string): Promise<Project> {
  const res = await http.get<Project>(`/projects/${id}`);
  return res.data;
}

export async function createProject(
  name: string,
  config: GenerateConfig,
  routes: object[]
): Promise<Project> {
  const res = await http.post<Project>("/projects", { name, config, routes });
  return res.data;
}

export async function updateProject(
  id: string,
  updates: { name?: string; config?: GenerateConfig; routes?: object[] }
): Promise<Project> {
  const res = await http.put<Project>(`/projects/${id}`, updates);
  return res.data;
}

export async function patchProject(
  id: string,
  updates: { name?: string; config?: GenerateConfig; routes?: object[] }
): Promise<Project> {
  const res = await http.patch<Project>(`/projects/${id}`, updates);
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await http.delete(`/projects/${id}`);
}

export async function generateFromProject(id: string): Promise<Blob> {
  const res = await http.post(`/projects/${id}/generate`, {}, { responseType: "blob" });
  return new Blob([res.data], { type: "application/zip" });
}

export async function duplicateProject(id: string): Promise<Project> {
  const res = await http.post<Project>(`/projects/${id}/duplicate`);
  return res.data;
}

// ── AI handler generation ─────────────────────────────────────────────────────

export async function generateHandler(
  description: string,
  route: object,
  projectConfig: object & { ai?: AIConfig }
): Promise<{ handler_code: string; imports_needed: string[]; warnings: string[] }> {
  const res = await http.post("/ai/generate-handler", {
    description,
    route,
    project_config: projectConfig,
  });
  return res.data;
}

// ── Error handling ────────────────────────────────────────────────────────────

export function getApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (err.response?.status === 401) return "Session expired. Please sign in again.";
    if (err.response?.status === 403) return "You don't have permission to do that.";
    if (err.response?.status === 404) return "Not found.";
    if (err.response?.status === 409) return "An account with this email already exists.";
    if (err.response?.status === 423) return "Account locked. Check your email.";
    if (err.response?.status === 429) return "Too many requests. Please try again later.";
    if (err.response?.status === 422) return "Invalid configuration. Please check your inputs.";
    if (err.response?.status === 500) return "Server error. Please try again.";
    if (err.code === "ECONNABORTED") return "Request timed out. The server may be cold-starting — try again.";
  }
  return "An unexpected error occurred.";
}
