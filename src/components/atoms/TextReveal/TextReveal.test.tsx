import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextReveal } from "./TextReveal";

describe("TextReveal", () => {
  it("reveals heading words as individually animated units", () => {
    render(
      <TextReveal as="h1" split="word" text="Keep moving forward." />,
    );

    const heading = screen.getByRole("heading", {
      name: "Keep moving forward.",
    });

    expect(heading).toBeVisible();
    expect(heading.querySelectorAll(".will-change-transform")).toHaveLength(3);
  });
});
