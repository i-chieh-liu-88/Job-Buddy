import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DitherLoader } from "./DitherLoader";

describe("DitherLoader", () => {
  it("announces the supplied loading label with a dither-grid display", () => {
    render(<DitherLoader label="Entering workspace" />);

    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Entering workspace",
    );
    expect(screen.getByTestId("dither-loader-grid")).toBeVisible();
  });
});
