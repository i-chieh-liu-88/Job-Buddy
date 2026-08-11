import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApplicationNavigation } from "./ApplicationNavigation";

const stageCounts = {
  saved: 2,
  applied: 0,
  interview: 1,
  offer: 0,
  rejected: 0,
};

describe("ApplicationNavigation", () => {
  it("shows current and future navigation with the application stage summary", () => {
    render(
      <ApplicationNavigation
        accountMenu={<button type="button">Account menu</button>}
        isAddDisabled={false}
        onAddApplication={vi.fn()}
        stageCounts={stageCounts}
      />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Applications",
    });

    expect(
      within(navigation).getByRole("link", { name: "Applications" }),
    ).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByText("Saved").closest("li")).toHaveTextContent(
      "2",
    );
    expect(
      within(navigation).getByText("Interview").closest("li"),
    ).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: "Stats — Soon" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Reminders — Soon" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export — Soon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Account menu" })).toBeVisible();
  });

  it("reports the exact Add application opener and honors its disabled state", async () => {
    const onAddApplication = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <ApplicationNavigation
        accountMenu={<button type="button">Account menu</button>}
        isAddDisabled={false}
        onAddApplication={onAddApplication}
        stageCounts={stageCounts}
      />,
    );
    const addButton = screen.getByRole("button", { name: "Add application" });

    await user.click(addButton);

    expect(onAddApplication).toHaveBeenCalledWith(addButton);

    rerender(
      <ApplicationNavigation
        accountMenu={<button type="button">Account menu</button>}
        isAddDisabled
        onAddApplication={onAddApplication}
        stageCounts={stageCounts}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Add application" }),
    ).toBeDisabled();
  });
});
