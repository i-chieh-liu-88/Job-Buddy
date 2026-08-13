import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArchitectureWaveBackground } from "./ArchitectureWaveBackground";

describe("ArchitectureWaveBackground", () => {
  it("renders decorative animated signal bars outside the accessibility tree", () => {
    render(<ArchitectureWaveBackground />);

    expect(screen.getByTestId("architecture-wave-background")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getAllByTestId("architecture-signal-bar")).toHaveLength(44);
    expect(screen.getAllByTestId("architecture-signal-bar")[0]).toHaveClass(
      "architecture-grid-pattern",
    );
    expect(screen.getByTestId("architecture-noise")).toBeInTheDocument();
  });
});
