import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArchitectureWaveBackground } from "./ArchitectureWaveBackground";

describe("ArchitectureWaveBackground", () => {
  it("embeds the selected Spline scene outside the accessibility tree", () => {
    render(<ArchitectureWaveBackground />);

    expect(screen.getByTestId("architecture-wave-background")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const scene = screen.getByTestId("architecture-spline-scene");

    expect(scene).toHaveAttribute(
      "src",
      "https://my.spline.design/gradientspherecopycopy-ZzSuZfTkcxJU4I5ViVrR66rU-VZS/",
    );
    expect(scene).toHaveClass(
      "h-[calc(100%+4rem)]",
      "grayscale",
    );
    expect(scene).not.toHaveClass("sepia");
    expect(screen.getByTestId("architecture-primary-tint")).toHaveClass(
      "bg-[#818cf8]",
      "mix-blend-color",
    );
    expect(screen.getByTestId("architecture-wave-background")).toHaveClass(
      "bg-black",
    );
    expect(screen.getByTestId("architecture-sphere-edge-softener")).toHaveClass(
      "pointer-events-none",
      "backdrop-blur-[1.5px]",
    );
    expect(screen.queryByTestId("architecture-spline-badge-mask")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-gradient-sphere")).not.toBeInTheDocument();
  });
});
