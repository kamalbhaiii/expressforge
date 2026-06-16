import { describe, it, expect } from "vitest";
import { toKebabCase, isValidProjectName } from "@/lib/utils";

describe("toKebabCase", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(toKebabCase("My Cool API")).toBe("my-cool-api");
  });

  it("strips special characters", () => {
    expect(toKebabCase("hello! world@")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(toKebabCase("my--api")).toBe("my-api");
  });

  it("trims leading and trailing hyphens", () => {
    expect(toKebabCase("-my-api-")).toBe("my-api");
  });
});

describe("isValidProjectName", () => {
  it("accepts valid kebab-case names", () => {
    expect(isValidProjectName("my-api")).toBe(true);
    expect(isValidProjectName("test123")).toBe(true);
    expect(isValidProjectName("a")).toBe(true);
  });

  it("rejects names with uppercase", () => {
    expect(isValidProjectName("MyApi")).toBe(false);
  });

  it("rejects names with spaces", () => {
    expect(isValidProjectName("my api")).toBe(false);
  });

  it("rejects names with special chars", () => {
    expect(isValidProjectName("my_api")).toBe(false);
    expect(isValidProjectName("my.api")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidProjectName("")).toBe(false);
  });

  it("rejects names over 64 chars", () => {
    expect(isValidProjectName("a".repeat(65))).toBe(false);
  });
});
