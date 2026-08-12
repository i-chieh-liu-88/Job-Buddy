import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AnimatedSidebar,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarProvider,
  AnimatedSidebarRail,
  useAnimatedSidebar,
} from "./AnimatedSidebar";

function mockViewport(isMobile: boolean, prefersReducedMotion = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches:
      query === "(max-width: 767px)"
        ? isMobile
        : query === "(prefers-reduced-motion: reduce)"
          ? prefersReducedMotion
          : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function StateProbe() {
  const { open, state, setOpen } = useAnimatedSidebar();
  return (
    <>
      <output>{`${state}:${open}`}</output>
      <button type="button" onClick={() => setOpen(!open)}>
        Toggle probe
      </button>
    </>
  );
}

function Harness({ initialOpen = true, desktopOnly = false }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <AnimatedSidebarProvider open={open} onOpenChange={setOpen}>
      <AnimatedSidebar desktopOnly={desktopOnly} data-testid="sidebar">
        <AnimatedSidebarMenu>
          <AnimatedSidebarMenuItem>
            <AnimatedSidebarMenuButton
              aria-label="Applications"
              title="Applications"
            >
              <span aria-hidden="true">A</span>
            </AnimatedSidebarMenuButton>
          </AnimatedSidebarMenuItem>
        </AnimatedSidebarMenu>
        <AnimatedSidebarRail
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        />
      </AnimatedSidebar>
      <StateProbe />
      <input aria-label="Company" />
      <textarea aria-label="Notes" />
      <select aria-label="Status">
        <option>Saved</option>
      </select>
      <div contentEditable aria-label="Editable notes" />
    </AnimatedSidebarProvider>
  );
}

describe("AnimatedSidebar", () => {
  beforeEach(() => mockViewport(false));

  it("renders controlled expanded and collapsed states with an accessible rail", () => {
    render(<Harness />);
    expect(screen.getByTestId("sidebar")).toHaveAttribute(
      "data-state",
      "expanded",
    );
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByTestId("sidebar")).toHaveAttribute(
      "data-state",
      "collapsed",
    );
    expect(screen.getByRole("button", { name: "Applications" })).toHaveAttribute(
      "title",
      "Applications",
    );
  });

  it.each([
    { key: "b", ctrlKey: true },
    { key: "b", metaKey: true },
  ])("toggles with the desktop keyboard shortcut", (shortcut) => {
    render(<Harness />);
    fireEvent.keyDown(window, shortcut);
    expect(screen.getByText("collapsed:false")).toBeInTheDocument();
  });

  it.each(["Company", "Notes", "Status", "Editable notes"])(
    "ignores the shortcut while editing %s",
    (name) => {
      render(<Harness />);
      const target = screen.getByLabelText(name);
      target.focus();
      fireEvent.keyDown(target, { key: "b", ctrlKey: true });
      expect(screen.getByText("expanded:true")).toBeInTheDocument();
    },
  );

  it("does not mount a desktopOnly sidebar or toggle by shortcut on mobile", () => {
    mockViewport(true);
    render(<Harness desktopOnly />);
    expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(screen.getByText("expanded:true")).toBeInTheDocument();
  });

  it("marks the zero-duration width branch for reduced-motion users", () => {
    mockViewport(false, true);
    render(<Harness />);
    expect(screen.getByTestId("sidebar")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });
});
