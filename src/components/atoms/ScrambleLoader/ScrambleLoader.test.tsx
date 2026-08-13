import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrambleLoader } from "./ScrambleLoader";

describe("ScrambleLoader", () => {
  it("announces the supplied loading label while rendering a scramble display", () => {
    render(<ScrambleLoader label="Entering workspace" />);

    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Entering workspace",
    );
    expect(screen.getByTestId("scramble-loader-display")).toBeVisible();
  });
});
