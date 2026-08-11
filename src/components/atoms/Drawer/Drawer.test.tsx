import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Drawer } from "./Drawer";

const { useReducedMotionMock } = vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(() => false),
}));

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: useReducedMotionMock,
}));

type DrawerProps = ComponentProps<typeof Drawer>;

function DrawerHarness({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const companyRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <Drawer
        ariaLabel="Application details"
        initialFocusRef={companyRef}
        open={open}
        onOpenChange={setOpen}
      >
        <input ref={companyRef} aria-label="Company" />
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Drawer>
    </>
  );
}

function renderDrawer(overrides: Partial<DrawerProps> = {}) {
  const props: DrawerProps = {
    open: true,
    onOpenChange: vi.fn(),
    ariaLabel: "Application details",
    children: <button type="button">Drawer action</button>,
    ...overrides,
  };
  const rendered = render(<Drawer {...props} />);

  return {
    ...rendered,
    rerenderDrawer(next: Partial<DrawerProps>) {
      rendered.rerender(<Drawer {...props} {...next} />);
    },
  };
}

function dismissThrough(dismissal: "Escape" | "backdrop") {
  if (dismissal === "Escape") {
    fireEvent.keyDown(document, { key: "Escape" });
    return;
  }

  fireEvent.click(screen.getByTestId("drawer-backdrop"));
}

describe("Drawer", () => {
  beforeEach(() => {
    useReducedMotionMock.mockReturnValue(false);
    document.body.style.overflow = "";
  });

  it("renders only while open as a named modal drawer", async () => {
    const { rerenderDrawer } = renderDrawer();

    expect(
      screen.getByRole("dialog", { name: "Application details" }),
    ).toHaveAttribute("aria-modal", "true");

    rerenderDrawer({ open: false });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("focuses the requested field after opening", async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);

    await user.click(screen.getByRole("button", { name: "Open drawer" }));

    await waitFor(() => expect(screen.getByLabelText("Company")).toHaveFocus());
    expect(document.body.style.overflow).toBe("hidden");
  });

  for (const dismissal of ["Escape", "backdrop"] as const) {
    it(`requests close from ${dismissal} only while dismissable`, () => {
      const onOpenChange = vi.fn();
      const { rerenderDrawer } = renderDrawer({
        dismissable: true,
        onOpenChange,
      });

      dismissThrough(dismissal);
      expect(onOpenChange).toHaveBeenCalledWith(false);

      onOpenChange.mockClear();
      rerenderDrawer({ dismissable: false, onOpenChange });
      dismissThrough(dismissal);

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  }

  it("wraps forward and backward Tab focus inside the panel", () => {
    render(<DrawerHarness initiallyOpen />);
    const first = screen.getByLabelText("Company");
    const last = screen.getByRole("button", { name: "Last action" });
    const drawer = screen.getByRole("dialog");

    last.focus();
    fireEvent.keyDown(drawer, { key: "Tab" });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(drawer, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("restores the previous body overflow and reports exit completion", async () => {
    useReducedMotionMock.mockReturnValue(true);
    document.body.style.overflow = "clip";
    const onExitComplete = vi.fn();
    const { rerenderDrawer } = renderDrawer({ onExitComplete });

    rerenderDrawer({ open: false, onExitComplete });

    await waitFor(() => expect(onExitComplete).toHaveBeenCalledOnce());
    expect(document.body.style.overflow).toBe("clip");
    document.body.style.overflow = "";
  });

  it("positions on either side and marks the reduced-motion branch", () => {
    useReducedMotionMock.mockReturnValue(true);
    const { rerenderDrawer } = renderDrawer({ side: "left" });

    expect(screen.getByRole("dialog")).toHaveClass("left-0");
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
    expect(screen.getByTestId("drawer-backdrop")).toBeInTheDocument();

    rerenderDrawer({ side: "right" });
    expect(screen.getByRole("dialog")).toHaveClass("right-0");
  });
});
