import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotFound } from "./NotFound";

vi.mock("../../backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid", () => ({
  WorkspaceEngineeringGrid: () => <div data-testid="workspace-grid" />,
}));

describe("NotFound", () => {
  it("renders the scramble code, explanation, and recovery links", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "404" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to applications" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Browse workspace" })).toHaveAttribute("href", "/resumes");
  });
});
