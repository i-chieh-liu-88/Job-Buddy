import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  it("opens the mobile drawer and restores menu focus after every close path", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationNavigation
        accountMenu={<button type="button">Account menu</button>}
        isAddDisabled={false}
        onAddApplication={vi.fn()}
        stageCounts={stageCounts}
      />,
    );
    const menuButton = screen.getByRole("button", { name: "Open navigation" });

    await user.click(menuButton);

    const drawer = screen.getByRole("dialog", { name: "Job Buddy navigation" });
    expect(drawer).toBeVisible();
    expect(
      within(drawer).getByRole("button", { name: "Close navigation" }),
    ).toHaveFocus();
    fireEvent(drawer, new Event("cancel", { cancelable: true }));

    await waitFor(() => expect(menuButton).toHaveFocus());
    expect(drawer).not.toHaveAttribute("open");

    await user.click(menuButton);
    await user.click(
      within(drawer).getByRole("button", { name: "Close navigation" }),
    );

    await waitFor(() => expect(menuButton).toHaveFocus());
    expect(drawer).not.toHaveAttribute("open");
  });

  it("shows counts and unavailable destinations inside the mobile drawer", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationNavigation
        accountMenu={<button type="button">Account menu</button>}
        isAddDisabled={false}
        onAddApplication={vi.fn()}
        stageCounts={stageCounts}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const drawer = screen.getByRole("dialog", { name: "Job Buddy navigation" });
    const drawerNavigation = within(drawer).getByRole("navigation", {
      name: "Applications",
    });

    expect(
      within(drawerNavigation).getByText("Saved").closest("li"),
    ).toHaveTextContent("2");
    expect(
      within(drawerNavigation).getByText("Interview").closest("li"),
    ).toHaveTextContent("1");
    for (const name of ["Stats — Soon", "Reminders — Soon", "Export — Soon"]) {
      expect(within(drawer).getByRole("button", { name })).toBeDisabled();
    }
    expect(within(drawer).getByRole("button", { name: "Account menu" })).toBeVisible();
  });

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

  it("reports each exact Add application opener and honors the disabled state", async () => {
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
    const addButtons = screen.getAllByRole("button", { name: "Add application" });

    expect(addButtons).toHaveLength(2);

    for (const addButton of addButtons) {
      await user.click(addButton);

      expect(onAddApplication).toHaveBeenLastCalledWith(addButton);
    }

    rerender(
      <ApplicationNavigation
        accountMenu={<button type="button">Account menu</button>}
        isAddDisabled
        onAddApplication={onAddApplication}
        stageCounts={stageCounts}
      />,
    );

    for (const addButton of screen.getAllByRole("button", {
      name: "Add application",
    })) {
      expect(addButton).toBeDisabled();
    }
  });
});
