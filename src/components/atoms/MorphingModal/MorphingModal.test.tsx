import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MorphingModal } from "./MorphingModal";

describe("MorphingModal", () => {
  it("renders a centered modal and closes from its blurred backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MorphingModal placement="center" viewId="technical" onClose={onClose}>
        <p>Technical interview details</p>
      </MorphingModal>,
    );

    const modalContent = screen.getByText("Technical interview details");
    const panel = modalContent.parentElement?.parentElement?.parentElement;
    const overlay = screen.getByRole("button", { name: "Close modal" }).parentElement;

    expect(modalContent).toBeVisible();
    expect(panel).not.toHaveClass("border");
    expect(overlay?.parentElement).toBe(document.body);
    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
