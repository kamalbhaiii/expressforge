import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useConfigStore } from "@/lib/store";

beforeEach(() => {
  act(() => useConfigStore.getState().reset());
});

describe("useConfigStore", () => {
  it("has correct defaults", () => {
    const state = useConfigStore.getState();
    expect(state.config.project_name).toBe("my-api");
    expect(state.config.language).toBe("javascript");
    expect(state.config.port).toBe(3000);
    expect(state.config.auth).toEqual([]);
    expect(state.config.database).toEqual([]);
    expect(state.config.middleware).toEqual([]);
    expect(state.config.file_upload).toEqual([]);
    expect(state.config.email).toEqual([]);
    expect(state.config.queues).toEqual([]);
    expect(state.config.websockets).toEqual([]);
    expect(state.config.include_docker).toBe(false);
    expect(state.config.include_tests).toBe(false);
    expect(state.config.include_swagger).toBe(false);
    expect(state.status).toBe("idle");
  });

  it("setProjectName converts to kebab-case", () => {
    act(() => useConfigStore.getState().setProjectName("My Cool API"));
    expect(useConfigStore.getState().config.project_name).toBe("my-cool-api");
  });

  it("setLanguage updates language", () => {
    act(() => useConfigStore.getState().setLanguage("typescript"));
    expect(useConfigStore.getState().config.language).toBe("typescript");
  });

  it("toggle(auth) adds and removes auth strategy", () => {
    act(() => useConfigStore.getState().toggle("auth", "jwt"));
    expect(useConfigStore.getState().config.auth).toContain("jwt");

    act(() => useConfigStore.getState().toggle("auth", "jwt"));
    expect(useConfigStore.getState().config.auth).not.toContain("jwt");
  });

  it("toggle(auth) supports multiple strategies", () => {
    act(() => {
      useConfigStore.getState().toggle("auth", "jwt");
      useConfigStore.getState().toggle("auth", "session");
    });
    const auth = useConfigStore.getState().config.auth;
    expect(auth).toContain("jwt");
    expect(auth).toContain("session");
  });

  it("toggle(database) adds and removes database option", () => {
    act(() => useConfigStore.getState().toggle("database", "mongodb"));
    expect(useConfigStore.getState().config.database).toContain("mongodb");

    act(() => useConfigStore.getState().toggle("database", "mongodb"));
    expect(useConfigStore.getState().config.database).not.toContain("mongodb");
  });

  it("toggle(middleware) adds and removes middleware", () => {
    act(() => useConfigStore.getState().toggle("middleware", "cors"));
    expect(useConfigStore.getState().config.middleware).toContain("cors");

    act(() => useConfigStore.getState().toggle("middleware", "cors"));
    expect(useConfigStore.getState().config.middleware).not.toContain("cors");
  });

  it("toggle(middleware) can hold multiple items", () => {
    act(() => {
      useConfigStore.getState().toggle("middleware", "cors");
      useConfigStore.getState().toggle("middleware", "helmet");
    });
    const mw = useConfigStore.getState().config.middleware;
    expect(mw).toContain("cors");
    expect(mw).toContain("helmet");
  });

  it("toggle(file_upload) works", () => {
    act(() => useConfigStore.getState().toggle("file_upload", "multer_s3"));
    expect(useConfigStore.getState().config.file_upload).toContain("multer_s3");
  });

  it("setIncludeSwagger toggles swagger", () => {
    act(() => useConfigStore.getState().setIncludeSwagger(true));
    expect(useConfigStore.getState().config.include_swagger).toBe(true);
  });

  it("setStatus updates status and error", () => {
    act(() => useConfigStore.getState().setStatus("error", "Something failed"));
    const state = useConfigStore.getState();
    expect(state.status).toBe("error");
    expect(state.error).toBe("Something failed");
  });

  it("reset restores defaults", () => {
    act(() => {
      useConfigStore.getState().toggle("auth", "jwt");
      useConfigStore.getState().toggle("middleware", "cors");
      useConfigStore.getState().setStatus("error", "fail");
      useConfigStore.getState().setIncludeSwagger(true);
    });

    act(() => useConfigStore.getState().reset());

    const state = useConfigStore.getState();
    expect(state.config.auth).toEqual([]);
    expect(state.config.middleware).toEqual([]);
    expect(state.config.include_swagger).toBe(false);
    expect(state.status).toBe("idle");
    expect(state.error).toBeNull();
  });
});
