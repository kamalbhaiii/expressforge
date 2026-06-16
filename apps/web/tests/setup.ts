import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock axios-based API client
vi.mock("@/lib/api", () => ({
  generateProject: vi.fn(),
  checkHealth: vi.fn().mockResolvedValue({ status: "ok", version: "1.0.0" }),
  downloadBlob: vi.fn(),
  getApiError: vi.fn().mockReturnValue("An unexpected error occurred."),
}));

// Suppress noisy console output in tests
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
