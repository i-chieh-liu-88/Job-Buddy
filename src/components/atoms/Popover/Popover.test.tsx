import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

describe("Popover", () => {
  it("opens hover content for keyboard focus and a touch-style click", async () => {
    const user = userEvent.setup();

    render(
      <Popover trigger="hover">
        <PopoverTrigger>
          <button type="button">Technical interview</button>
        </PopoverTrigger>
        <PopoverContent>Interview details</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", {
      name: "Technical interview",
    });

    await user.tab();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(screen.getByRole("dialog")).toHaveTextContent("Interview details");
  });
});
