import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MagneticAddApplicationButton } from "./MagneticAddApplicationButton";

describe("MagneticAddApplicationButton", () => {
  it("keeps the beUI outline and press-capable button as the interactive element", () => {
    render(
      <MagneticAddApplicationButton onClick={vi.fn()} variant="outline">
        Add application
      </MagneticAddApplicationButton>,
    );

    expect(screen.getByRole("button", { name: "Add application" })).toHaveClass(
      "cursor-pointer",
    );
  });
});
