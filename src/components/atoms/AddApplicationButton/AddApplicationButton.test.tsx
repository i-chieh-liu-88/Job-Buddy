import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddApplicationButton } from "./AddApplicationButton";

describe("AddApplicationButton", () => {
  it("renders the magnetic outline control with its large plus glyph", () => {
    render(<AddApplicationButton onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Add application" })).toHaveClass(
      "rounded-full",
      "cursor-pointer",
      "bg-surface",
      "text-ink",
      "focus-visible:ring-2",
    );
    expect(screen.getByTestId("add-application-plus")).toHaveClass("size-7");
    expect(screen.getByText("Add application")).toHaveClass(
      "font-mono",
      "text-[11px]",
      "uppercase",
      "tracking-tight",
    );
  });

  it("keeps a collapsed plus-only control named Add application", () => {
    render(<AddApplicationButton collapsed onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Add application" })).toHaveAttribute(
      "title",
      "Add application",
    );
    expect(screen.queryByText("Add application")).not.toBeInTheDocument();
  });
});
