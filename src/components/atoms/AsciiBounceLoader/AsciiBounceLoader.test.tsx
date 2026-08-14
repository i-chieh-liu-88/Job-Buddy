import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AsciiBounceLoader } from "./AsciiBounceLoader";

describe("AsciiBounceLoader", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a caption-free 64px ASCII status with the supplied accessible label", () => {
    render(<AsciiBounceLoader label="Entering workspace" />);

    expect(screen.getByRole("status")).toHaveAccessibleName("Entering workspace");
    expect(screen.getByTestId("ascii-bounce-loader-glyph")).toHaveTextContent("⠁");
    expect(screen.getByTestId("ascii-bounce-loader-glyph")).toHaveStyle({
      fontSize: "64px",
    });
    expect(screen.queryByText("Entering workspace")).not.toBeInTheDocument();
  });

  it("advances through the official ASCII Bounce frames", () => {
    vi.useFakeTimers();
    render(<AsciiBounceLoader speed={1} />);

    act(() => {
      vi.advanceTimersByTime(125);
    });

    expect(screen.getByTestId("ascii-bounce-loader-glyph")).toHaveTextContent("⠂");
  });
});
