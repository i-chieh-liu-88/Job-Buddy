import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnimatedSidebar } from "../../components/atoms/AnimatedSidebar/AnimatedSidebar";
import { ApplicationShell, SIDEBAR_STORAGE_KEY } from "./ApplicationShell";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isLoaded: true, userId: "user-1", getToken: async () => null }),
}));
vi.mock("../../hooks/useJobApplications", () => ({
  useJobApplications: () => ({ data: [], isPending: false, isError: false }),
  useCreateJobApplication: () => ({ isError: false, isPending: false, mutateAsync: vi.fn(), reset: vi.fn() }),
}));

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

function NavigationProbe() {
  const { open, setOpen } = useAnimatedSidebar();
  return (
    <nav>
      <output>{open ? "expanded" : "collapsed"}</output>
      <button type="button" onClick={() => setOpen(!open)}>
        Toggle navigation
      </button>
    </nav>
  );
}

function renderShell() {
  return render(
    <ApplicationShell navigation={<NavigationProbe />}>
      <p>Workspace</p>
    </ApplicationShell>,
  );
}

describe("ApplicationShell", () => {
  beforeEach(() => {
    localStorage.clear();
    mockDesktopViewport();
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([
    { stored: null, expected: "expanded" },
    { stored: "invalid", expected: "expanded" },
    { stored: "true", expected: "expanded" },
    { stored: "false", expected: "collapsed" },
  ])("initializes from the accepted storage values", ({ stored, expected }) => {
    if (stored !== null) localStorage.setItem(SIDEBAR_STORAGE_KEY, stored);
    renderShell();
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("persists each controlled state change", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe("true");
  });

  it("falls back to expanded when storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderShell();
    expect(screen.getByText("expanded")).toBeInTheDocument();
  });

  it("keeps the changed state when storage cannot be written", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    expect(screen.getByText("collapsed")).toBeInTheDocument();
  });

  it("places navigation beside a flexible main workspace", () => {
    renderShell();
    const main = screen.getByRole("main");
    expect(main).toHaveClass("min-w-0", "flex-1");
    expect(screen.getByRole("navigation").parentElement).toBe(main.parentElement);
  });

  it("retains the canvas and ink styling on the shell wrapper", () => {
    renderShell();
    const shellWrapper = screen.getByRole("main").parentElement;
    expect(shellWrapper).toHaveClass("bg-canvas", "text-ink");
  });
});
