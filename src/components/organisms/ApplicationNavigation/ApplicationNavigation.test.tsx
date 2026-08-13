import { type ComponentProps, useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedSidebarProvider } from "../../atoms/AnimatedSidebar/AnimatedSidebar";
import { ApplicationNavigation } from "./ApplicationNavigation";

const stageCounts = {
  saved: 2,
  applied: 0,
  interview: 1,
  offer: 0,
  rejected: 0,
};

const defaultProps: ComponentProps<typeof ApplicationNavigation> = {
  accountMenu: <button type="button">Account menu</button>,
  isAddDisabled: false,
  onAddApplication: vi.fn(),
  stageCounts: {
    saved: 1,
    applied: 2,
    interview: 3,
    offer: 4,
    rejected: 5,
  },
};

function renderNavigation(
  props: ComponentProps<typeof ApplicationNavigation>,
  { initialOpen = true }: { initialOpen?: boolean } = {},
) {
  function Harness() {
    const [open, setOpen] = useState(initialOpen);

    return (
      <AnimatedSidebarProvider open={open} onOpenChange={setOpen}>
        <ApplicationNavigation {...props} />
      </AnimatedSidebarProvider>
    );
  }

  return render(<Harness />);
}

function mockDesktopViewport() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("ApplicationNavigation", () => {
  beforeEach(() => mockDesktopViewport());

  it("opens the mobile drawer and restores menu focus after every close path", async () => {
    const user = userEvent.setup();
    renderNavigation({
      accountMenu: <button type="button">Account menu</button>,
      isAddDisabled: false,
      onAddApplication: vi.fn(),
      stageCounts,
    });
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
    renderNavigation({
      accountMenu: <button type="button">Account menu</button>,
      isAddDisabled: false,
      onAddApplication: vi.fn(),
      stageCounts,
    });

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
    renderNavigation({
      accountMenu: <button type="button">Account menu</button>,
      isAddDisabled: false,
      onAddApplication: vi.fn(),
      stageCounts,
    });

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

  it("reports each exact Add opener and honors the disabled state", async () => {
    const onAddApplication = vi.fn();
    const user = userEvent.setup();
    const navigationProps = {
      accountMenu: <button type="button">Account menu</button>,
      isAddDisabled: false,
      onAddApplication,
      stageCounts,
    };
    const mountedNavigation = renderNavigation(navigationProps);
    const addButtons = screen.getAllByRole("button", { name: "Add application" });

    expect(addButtons).toHaveLength(2);

    for (const addButton of addButtons) {
      await user.click(addButton);

      expect(onAddApplication).toHaveBeenLastCalledWith(addButton);
    }

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    const collapsedAddButton = within(
      screen.getByRole("complementary", { name: "Application navigation" }),
    ).getByRole("button", { name: "Add application" });
    await user.click(collapsedAddButton);
    expect(onAddApplication).toHaveBeenLastCalledWith(collapsedAddButton);

    mountedNavigation.unmount();
    renderNavigation({ ...navigationProps, isAddDisabled: true });

    for (const addButton of screen.getAllByRole("button", {
      name: "Add application",
    })) {
      expect(addButton).toBeDisabled();
    }
  });

  it("morphs the light desktop panel without changing the dark workspace rail", async () => {
    const user = userEvent.setup();
    renderNavigation(defaultProps);

    expect(screen.getByTestId("workspace-rail")).toHaveClass("w-16");
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    const collapse = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(collapse).toHaveAttribute("aria-expanded", "true");

    await user.click(collapse);

    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
    const expand = screen.getByRole("button", { name: "Expand sidebar" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expect(expand).toHaveFocus();
    expect(
      screen.getByRole("complementary", { name: "Application navigation" }),
    ).toHaveAttribute("data-state", "collapsed");
  });

  it("keeps collapsed controls named, titled, and disabled where required", () => {
    renderNavigation(defaultProps, { initialOpen: false });
    const desktopNavigation = within(
      screen.getByRole("complementary", { name: "Application navigation" }),
    );

    expect(
      desktopNavigation.getByRole("button", { name: "Add application" }),
    ).toHaveAttribute("title", "Add application");
    expect(desktopNavigation.getByRole("link", { name: "Applications" })).toHaveAttribute(
      "title",
      "Applications",
    );
    for (const label of ["Stats", "Reminders", "Export"]) {
      const item = desktopNavigation.getByRole("button", { name: label });
      expect(item).toBeDisabled();
      expect(item).toHaveAttribute("title", label);
    }
  });

  it("renders collapsed destinations as centered icon-only controls", () => {
    renderNavigation(defaultProps, { initialOpen: false });
    const desktopNavigation = within(
      screen.getByRole("complementary", { name: "Application navigation" }),
    );

    for (const label of ["Applications", "Stats", "Reminders", "Export"]) {
      const control = desktopNavigation.getByRole(
        label === "Applications" ? "link" : "button",
        { name: label },
      );

      expect(control).toHaveClass("justify-center");
      expect(within(control).queryByText(label)).not.toBeInTheDocument();
    }
  });

  it.each([
    ["Saved", 1],
    ["Applied", 2],
    ["Interview", 3],
    ["Offer", 4],
    ["Rejected", 5],
  ])("describes the collapsed %s stage count", (stage, count) => {
    renderNavigation(defaultProps, { initialOpen: false });

    expect(
      screen.getByLabelText(`${stage} · ${count} applications`),
    ).toHaveAttribute("title", `${stage} · ${count} applications`);
  });
});
