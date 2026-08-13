import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceEngineeringGrid } from "./WorkspaceEngineeringGrid";

describe("WorkspaceEngineeringGrid", () => {
  it("keeps the grid decorative and highlights the cell under the pointer", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 600,
      height: 600,
      left: 0,
      right: 960,
      toJSON: () => ({}),
      top: 0,
      width: 960,
      x: 0,
      y: 0,
    });

    render(<WorkspaceEngineeringGrid />);

    const background = screen.getByTestId("workspace-engineering-grid");
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveClass("pointer-events-none");

    fireEvent.pointerMove(window, { clientX: 180, clientY: 20 });

    const hoverCell = screen.getByTestId("workspace-grid-hover-cell");

    expect(hoverCell).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(hoverCell).toHaveAttribute("data-pattern-direction", "mirrored");
    expect(hoverCell).not.toHaveClass("border");
    expect(hoverCell).toHaveStyle(
      "background-image: repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 5px)",
    );
    expect(screen.queryByTestId("workspace-grid-nodes")).not.toBeInTheDocument();
  });
});
