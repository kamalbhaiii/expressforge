import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { FeatureSelector } from "@/components/config-builder/FeatureSelector";
import { useConfigStore } from "@/lib/store";

beforeEach(() => {
  act(() => useConfigStore.getState().reset());
});

describe("FeatureSelector", () => {
  it("renders Docker and Tests toggles", () => {
    render(<FeatureSelector />);
    expect(screen.getByText(/Include Docker/i)).toBeInTheDocument();
    expect(screen.getByText(/Include Tests/i)).toBeInTheDocument();
  });

  it("toggles Docker on click", () => {
    render(<FeatureSelector />);
    const dockerToggle = screen.getByTestId("toggle-docker");
    fireEvent.click(dockerToggle);
    expect(useConfigStore.getState().config.include_docker).toBe(true);
  });

  it("toggles Tests on click", () => {
    render(<FeatureSelector />);
    const testsToggle = screen.getByTestId("toggle-tests");
    fireEvent.click(testsToggle);
    expect(useConfigStore.getState().config.include_tests).toBe(true);
  });
});
