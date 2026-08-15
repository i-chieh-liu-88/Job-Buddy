import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobuddyLogo } from "./JobuddyLogo";

const { animationControls } = vi.hoisted(() => ({
  animationControls: {
    mount: vi.fn(() => () => undefined),
    set: vi.fn(),
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  },
}));

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useAnimationControls: () => animationControls,
  useReducedMotion: () => false,
}));

describe("JobuddyLogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the four-lobed mark beside a stationary Inter wordmark", () => {
    render(<JobuddyLogo />);

    const logo = screen.getByLabelText("Jobuddy");
    const mark = screen.getByTestId("jobuddy-mark");
    const markPath = screen.getByTestId("jobuddy-mark-path");
    const wordmark = screen.getByText("Jobuddy");

    expect(logo).toBeInTheDocument();
    expect(mark).toHaveClass("size-6");
    expect(mark).toHaveAttribute("viewBox", "0 0 256 256");
    expect(markPath).toHaveAttribute(
      "d",
      "M 192 0 C 227.346 0 256 28.654 256 64 C 256 99.346 227.346 128 192 128 C 227.346 128 256 156.654 256 192 C 256 227.346 227.346 256 192 256 C 156.654 256 128 227.346 128 192 C 128 227.346 99.346 256 64 256 C 28.654 256 0 227.346 0 192 C 0 156.654 28.654 128 64 128 C 28.654 128 0 99.346 0 64 C 0 28.654 28.654 0 64 0 C 99.346 0 128 28.654 128 64 C 128 28.654 156.654 0 192 0 Z M 128 100 C 112.536 100 100 112.536 100 128 C 100 143.464 112.536 156 128 156 C 143.464 156 156 143.464 156 128 C 156 112.536 143.464 100 128 100 Z",
    );
    expect(wordmark).toHaveClass("font-display");
    expect(mark.contains(wordmark)).toBe(false);
  });

  it("keeps its accessible name while compact", () => {
    render(<JobuddyLogo compact />);

    expect(screen.getByLabelText("Jobuddy")).toBeInTheDocument();
    expect(screen.queryByText("Jobuddy")).not.toBeInTheDocument();
  });

  it("plays the mark animation when the wordmark is hovered", () => {
    render(<JobuddyLogo />);

    fireEvent.mouseEnter(screen.getByText("Jobuddy"));

    expect(animationControls.start).toHaveBeenCalledOnce();
  });
});
