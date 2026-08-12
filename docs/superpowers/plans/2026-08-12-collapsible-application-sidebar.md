# Collapsible Application Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Jobuddy's fixed light desktop navigation panel with the standalone beUI Animated Sidebar, supporting a persistent 224px/68px morph while preserving the permanent dark rail and existing mobile navigation dialog.

**Architecture:** Install the complete `@beui/animated-sidebar` registry source, retain its public primitives, and adapt only its desktop shortcut, mobile bypass, reduced-motion, and Atomic Design placement. `ApplicationShell` controls and persists the sidebar state; `ApplicationNavigation` consumes the provider state to render the existing information hierarchy as expanded labels or accessible collapsed icons. The page's data, mutations, authentication, routes, and mobile dialog lifecycle remain unchanged.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, Motion, lucide-react, Vitest, Testing Library, shadcn registry CLI

## Global Constraints

- Keep the dark desktop workspace rail at exactly `4rem` (64px).
- Use `--sidebar-width: 14rem` (224px) and `--sidebar-width-icon: 4.25rem` (68px).
- Default to expanded when `jobuddy:sidebar-expanded` is missing, invalid, or unreadable; accept only the strings `"true"` and `"false"`.
- Persist every successful in-memory desktop toggle to `jobuddy:sidebar-expanded`; a write exception must not revert the visible state.
- Support `Ctrl+B` and `Cmd+B` on desktop, but ignore the shortcut on mobile and from `input`, `textarea`, `select`, or descendants of `[contenteditable="true"]`.
- Keep the current native mobile navigation dialog as the only navigation experience below `md`; pass `desktopOnly` to the beUI panel.
- Keep `ApplicationNavigationProps`, Add application opener identity, Clerk account content, mobile focus restoration, page queries, mutations, drag-and-drop, card Drawer, authentication, routing, environment files, and database files unchanged.
- Use the complete standalone `@beui/animated-sidebar`; do not install AI Sidebar, resource management, MorphPopover, or agent-specific behaviors.
- Retain the beUI origin comment in the installed primitive and place reusable UI source under `src/components/atoms/`.
- Use Jobuddy's existing `surface`, `line`, `ink`, `muted`, `hover`, `focus`, and `primary` tokens; introduce no gradients, harsh contrast, or new stage colors.
- Decorative lucide icons use `aria-hidden="true"`; links and buttons own their accessible names.
- Respect `prefers-reduced-motion` by removing the width spring and using immediate or near-immediate label transitions.
- Preserve unrelated uncommitted files and do not edit `src/routeTree.gen.ts`.

---

## File Map

- Create `components.json`: shadcn registry configuration with Vite/Tailwind paths and Atomic Design aliases.
- Modify `package.json` and `package-lock.json`: add `lucide-react` through the registry installation.
- Modify `tsconfig.app.json`: resolve `@/*` to `src/*` for TypeScript.
- Modify `vite.config.ts`: resolve the same `@` alias at build/runtime.
- Create `src/components/atoms/AnimatedSidebar/AnimatedSidebar.tsx`: complete beUI sidebar primitives plus the approved Jobuddy guards and `desktopOnly` prop.
- Create `src/components/atoms/AnimatedSidebar/SharedLayoutBackground.tsx`: installed beUI shared active-layout helper exporting `SharedLayoutBg`.
- Create `src/components/atoms/AnimatedSidebar/AnimatedSidebar.test.tsx`: primitive state, shortcut, mobile, semantics, and reduced-motion coverage.
- Create `src/lib/ease.ts`: installed beUI easing and spring constants.
- Reuse `src/lib/cn.ts`: existing shadcn-compatible `cn` utility; configure the registry to import it rather than create a duplicate.
- Modify `src/layouts/ApplicationShell/ApplicationShell.tsx`: own controlled sidebar state and safe localStorage persistence.
- Modify `src/layouts/ApplicationShell/ApplicationShell.test.tsx`: persistence, invalid/error fallback, and flexible layout coverage.
- Modify `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`: compose the desktop panel from beUI primitives while retaining the dark rail and native mobile dialog.
- Modify `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`: expanded/collapsed content, toggle accessibility, opener identity, disabled items, stage labels, and mobile regression coverage.
- Modify `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`: signed-in integration coverage proving sidebar toggling preserves cards, counts, Add flow, Detail Drawer, and mutation boundaries.

---

### Task 1: Install and adapt the standalone beUI primitive

**Files:**
- Create: `components.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.app.json`
- Modify: `vite.config.ts`
- Create: `src/components/atoms/AnimatedSidebar/AnimatedSidebar.tsx`
- Create: `src/components/atoms/AnimatedSidebar/SharedLayoutBackground.tsx`
- Create: `src/components/atoms/AnimatedSidebar/AnimatedSidebar.test.tsx`
- Create: `src/lib/ease.ts`
- Reuse: `src/lib/cn.ts`

**Interfaces:**
- Consumes: the official `@beui/animated-sidebar` registry source and existing `cn(...inputs: ClassValue[]): string` from `src/lib/cn.ts`.
- Produces: all official Animated Sidebar exports, including `AnimatedSidebarProvider`, `AnimatedSidebar`, `AnimatedSidebarRail`, `AnimatedSidebarHeader`, `AnimatedSidebarContent`, `AnimatedSidebarFooter`, `AnimatedSidebarGroup`, `AnimatedSidebarGroupLabel`, `AnimatedSidebarGroupContent`, `AnimatedSidebarMenu`, `AnimatedSidebarMenuItem`, `AnimatedSidebarMenuButton`, and `useAnimatedSidebar`.
- Produces: `AnimatedSidebar` with the additive prop `desktopOnly?: boolean`.
- Produces: the official provider context state, including `{ state: "expanded" | "collapsed"; open: boolean; setOpen: (open: boolean) => void; isMobile: boolean; reduce: boolean; toggleSidebar: () => void }`, used by Tasks 2 and 3.

- [ ] **Step 1: Add the registry configuration and import aliases**

Create `components.json` with the existing utility alias and Atomic Design target:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/cn",
    "ui": "@/components/atoms",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Add the alias to `tsconfig.app.json` inside `compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

Add the matching Vite alias without changing plugins or server behavior:

```ts
import { fileURLToPath, URL } from "node:url";

resolve: {
  alias: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
},
```

- [ ] **Step 2: Install the exact standalone registry package**

Run from the repository root:

```powershell
npx.cmd shadcn@latest add @beui/animated-sidebar
```

Expected: `lucide-react` is added to `package.json` and `package-lock.json`; the complete Animated Sidebar, shared-layout helper, and easing source are generated. No AI Sidebar or agent/resource files appear.

- [ ] **Step 3: Move the generated source into the Atomic Design folder**

Place the registry source at:

```text
src/components/atoms/AnimatedSidebar/AnimatedSidebar.tsx
src/components/atoms/AnimatedSidebar/SharedLayoutBackground.tsx
src/lib/ease.ts
```

Update generated imports to:

```ts
import { cn } from "@/lib/cn";
import { SharedLayoutBg } from "./SharedLayoutBackground";
```

Keep every standalone export and the beUI origin comment. Remove only the registry preview file if it was generated; do not retain a second `cn` implementation.

Replace registry preview-theme utilities in the installed primitives with the existing Jobuddy tokens:

```text
bg-background                    -> bg-surface
border-border / bg-border        -> border-line / bg-line
text-foreground                  -> text-ink
text-muted-foreground            -> text-muted
bg-muted / bg-muted/70           -> bg-hover
hover:bg-muted/60                -> hover:bg-hover
hover:text-foreground            -> hover:text-ink
focus-visible:ring-ring          -> focus-visible:ring-focus
focus-visible:ring-offset-background -> focus-visible:ring-offset-surface
```

Keep `bg-black/40`, `bg-current`, `bg-transparent`, structural border utilities, and typography utilities because they are semantic implementation details rather than preview-theme tokens.

- [ ] **Step 4: Write the failing primitive tests**

Create `src/components/atoms/AnimatedSidebar/AnimatedSidebar.test.tsx` with a controlled harness and explicit viewport mock:

```tsx
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
      <button type="button" onClick={() => setOpen(!open)}>Toggle probe</button>
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
            <AnimatedSidebarMenuButton aria-label="Applications" title="Applications">
              <span aria-hidden="true">A</span>
            </AnimatedSidebarMenuButton>
          </AnimatedSidebarMenuItem>
        </AnimatedSidebarMenu>
        <AnimatedSidebarRail aria-label={open ? "Collapse sidebar" : "Expand sidebar"} />
      </AnimatedSidebar>
      <StateProbe />
      <input aria-label="Company" />
      <textarea aria-label="Notes" />
      <select aria-label="Status"><option>Saved</option></select>
      <div contentEditable aria-label="Editable notes" />
    </AnimatedSidebarProvider>
  );
}

describe("AnimatedSidebar", () => {
  beforeEach(() => mockViewport(false));

  it("renders controlled expanded and collapsed states with an accessible rail", () => {
    render(<Harness />);
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-state", "expanded");
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-state", "collapsed");
    expect(screen.getByRole("button", { name: "Applications" })).toHaveAttribute("title", "Applications");
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
```

- [ ] **Step 5: Run the primitive test and confirm the local adaptations fail**

Run:

```powershell
npx.cmd vitest run src/components/atoms/AnimatedSidebar/AnimatedSidebar.test.tsx
```

Expected: FAIL because the registry source does not yet implement `desktopOnly`, editable-target guards, mobile shortcut suppression, and Jobuddy's controlled rail semantics.

- [ ] **Step 6: Implement the approved local adaptations in the installed primitive**

Add `desktopOnly` to the official sidebar prop type and mobile branch:

```tsx
export interface AnimatedSidebarProps
  extends Omit<HTMLMotionProps<"aside">, "children"> {
  children?: ReactNode;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  desktopOnly?: boolean;
  ariaLabel?: string;
  panelClassName?: string;
}

if (isMobile && desktopOnly) {
  return null;
}
```

Guard the provider shortcut before calling `setOpen`:

```ts
function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return (
    target.matches("input, textarea, select") ||
    target.closest('[contenteditable="true"]') !== null
  );
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (
    isMobile ||
    event.key.toLowerCase() !== "b" ||
    (!event.metaKey && !event.ctrlKey) ||
    isEditableShortcutTarget(event.target)
  ) {
    return;
  }

  event.preventDefault();
  setOpen(!desktopOpen);
};
```

Keep `desktopOpen`, `isMobile`, and `setOpen` in the shortcut effect dependencies so the controlled value cannot become stale.

Keep the official `useReducedMotion()` branch and expose the active branch for deterministic tests. The installed width transition already removes the spring, while `REDUCED_TRANSITION` keeps opacity changes short:

```tsx
<motion.aside
  data-reduced-motion={context.reduce ? "true" : "false"}
  transition={context.reduce ? { duration: 0 } : SIDEBAR_MORPH_TRANSITION}
/>

<motion.span
  transition={
    context.reduce
      ? REDUCED_TRANSITION
      : panel.collapsed
        ? LABEL_EXIT_TRANSITION
        : LABEL_ENTER_TRANSITION
  }
/>
```

Ensure `AnimatedSidebarRail` keeps its semantic `button`, forwards `aria-label`, `aria-expanded`, and `title`, defaults into the tab order, and uses the existing focus token:

```tsx
export const AnimatedSidebarRail = forwardRef<
  HTMLButtonElement,
  AnimatedSidebarRailProps
>(function AnimatedSidebarRail(
  {
    className,
    onClick,
    tabIndex = 0,
    title,
    type = "button",
    ...props
  },
  forwardedRef,
) {
  const context = useAnimatedSidebar();
  const panel = useAnimatedSidebarPanel();
  const accessibleLabel = props["aria-label"] ?? "Toggle sidebar";

  return (
    <button
      {...props}
      ref={forwardedRef}
      type={type}
      data-side={panel.side}
      aria-label={accessibleLabel}
      title={title ?? accessibleLabel}
      tabIndex={tabIndex}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.toggleSidebar();
      }}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 outline-none md:block",
        "focus-visible:ring-2 focus-visible:ring-focus",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent after:transition-colors hover:after:bg-line",
        "data-[side=right]:right-0 data-[side=right]:translate-x-1/2 data-[side=left]:left-full",
        className,
      )}
    />
  );
});
```

- [ ] **Step 7: Run the primitive tests and static checks**

Run:

```powershell
npx.cmd vitest run src/components/atoms/AnimatedSidebar/AnimatedSidebar.test.tsx
npm.cmd run build
git diff --check
```

Expected: primitive tests PASS, TypeScript/Vite build PASS, and diff check reports no whitespace errors.

- [ ] **Step 8: Commit the registry primitive**

```powershell
git add -- components.json package.json package-lock.json tsconfig.app.json vite.config.ts src/components/atoms/AnimatedSidebar src/lib/ease.ts
git commit -m "feat: add animated sidebar primitives"
```

---

### Task 2: Control and persist sidebar state in ApplicationShell

**Files:**
- Modify: `src/layouts/ApplicationShell/ApplicationShell.tsx`
- Modify: `src/layouts/ApplicationShell/ApplicationShell.test.tsx`

**Interfaces:**
- Consumes: `AnimatedSidebarProvider` from Task 1 with controlled props `open: boolean` and `onOpenChange: (open: boolean) => void`.
- Produces: `SIDEBAR_STORAGE_KEY = "jobuddy:sidebar-expanded"` and the unchanged `ApplicationShell({ navigation, children }: PropsWithChildren<{ navigation: ReactNode }>)` API.
- Produces: one provider around the existing sibling navigation and flexible `<main>`.

- [ ] **Step 1: Write persistence and layout tests**

Replace the single shell test with focused cases that render a provider probe:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnimatedSidebar } from "../../components/atoms/AnimatedSidebar/AnimatedSidebar";
import { ApplicationShell, SIDEBAR_STORAGE_KEY } from "./ApplicationShell";

function NavigationProbe() {
  const { open, setOpen } = useAnimatedSidebar();
  return (
    <nav>
      <output>{open ? "expanded" : "collapsed"}</output>
      <button type="button" onClick={() => setOpen(!open)}>Toggle navigation</button>
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
  beforeEach(() => localStorage.clear());
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
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    renderShell();
    expect(screen.getByText("expanded")).toBeInTheDocument();
  });

  it("keeps the changed state when storage cannot be written", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
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
});
```

- [ ] **Step 2: Run the shell tests to verify RED**

Run:

```powershell
npx.cmd vitest run src/layouts/ApplicationShell/ApplicationShell.test.tsx
```

Expected: FAIL because the shell does not export the key, provide Animated Sidebar context, read persistence, or save changes.

- [ ] **Step 3: Implement safe controlled persistence**

Implement these exact helpers and keep the existing props unchanged:

```tsx
import {
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
  useState,
} from "react";

export const SIDEBAR_STORAGE_KEY = "jobuddy:sidebar-expanded";

function readInitialSidebarState() {
  try {
    const storedValue = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return storedValue === "false" ? false : true;
  } catch {
    return true;
  }
}

export function ApplicationShell({ navigation, children }: ApplicationShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(readInitialSidebarState);

  const handleSidebarOpenChange = (nextOpen: boolean) => {
    setIsSidebarOpen(nextOpen);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextOpen));
    } catch {
      // Persistence is optional; the controlled in-memory state remains authoritative.
    }
  };

  return (
    <AnimatedSidebarProvider
      open={isSidebarOpen}
      onOpenChange={handleSidebarOpenChange}
      style={{
        "--sidebar-width": "14rem",
        "--sidebar-width-icon": "4.25rem",
      } as CSSProperties}
    >
      {navigation}
      <main className="min-w-0 flex-1">{children}</main>
    </AnimatedSidebarProvider>
  );
}
```

Do not put destinations, Clerk state, stage counts, or modal state into this layout.

- [ ] **Step 4: Run focused and neighboring tests**

Run:

```powershell
npx.cmd vitest run src/layouts/ApplicationShell/ApplicationShell.test.tsx src/components/atoms/AnimatedSidebar/AnimatedSidebar.test.tsx
```

Expected: both files PASS and no test logs an unhandled storage exception.

- [ ] **Step 5: Commit the controlled shell**

```powershell
git add -- src/layouts/ApplicationShell/ApplicationShell.tsx src/layouts/ApplicationShell/ApplicationShell.test.tsx
git commit -m "feat: persist sidebar state in application shell"
```

---

### Task 3: Recompose ApplicationNavigation for expanded and collapsed desktop states

**Files:**
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`

**Interfaces:**
- Consumes: Task 1 primitives and `useAnimatedSidebar()` state.
- Consumes: the unchanged `ApplicationNavigationProps` with `accountMenu`, `isAddDisabled`, `onAddApplication`, and `stageCounts`.
- Produces: the existing dark `w-16` rail plus one light `AnimatedSidebar desktopOnly collapsible="icon" side="left"` panel.
- Produces: rail labels `Collapse sidebar`/`Expand sidebar`, collapsed stage descriptions such as `Interview · 3 applications`, and exact Add opener identity in both widths.

- [ ] **Step 1: Add a shared provider render helper to navigation tests**

Wrap every navigation render so the organism receives the same controlled context as production:

```tsx
import { type ComponentProps, useState } from "react";

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
```

Keep the current native-dialog `showModal`/`close` polyfill and all existing mobile assertions.

- [ ] **Step 2: Write failing expanded/collapsed desktop tests**

Add these behaviors using the current stage fixture `{ saved: 1, applied: 2, interview: 3, offer: 4, rejected: 5 }`:

```tsx
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
  expect(screen.getByRole("button", { name: "Add application" })).toHaveAttribute("title", "Add application");
  expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute("title", "Applications");
  for (const label of ["Stats", "Reminders", "Export"]) {
    const item = screen.getByRole("button", { name: label });
    expect(item).toBeDisabled();
    expect(item).toHaveAttribute("title", label);
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
  expect(screen.getByLabelText(`${stage} · ${count} applications`)).toHaveAttribute(
    "title",
    `${stage} · ${count} applications`,
  );
});
```

Extend the exact-opener test by clicking Add before and after toggling, asserting each callback argument is the clicked `HTMLButtonElement`.

- [ ] **Step 3: Run the navigation suite to verify RED**

Run:

```powershell
npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx
```

Expected: existing mobile tests remain meaningful, while new desktop tests FAIL because the fixed panel has no provider-driven collapsed state, semantic rail, or icon labels.

- [ ] **Step 4: Build the desktop panel from the installed primitives**

Use these lucide icons:

```ts
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  Plus,
} from "lucide-react";
```

Read the provider once inside the desktop navigation subtree:

```ts
const { open, state } = useAnimatedSidebar();
const isCollapsed = state === "collapsed";
```

Keep the desktop wrapper hidden below `md`, retain the dark rail, and replace only the fixed light `<aside>`:

```tsx
<div className="hidden min-h-screen shrink-0 md:flex">
  <aside
    data-testid="workspace-rail"
    className="flex w-16 shrink-0 flex-col items-center border-r border-line bg-ink py-4 text-white"
    aria-label="Job Buddy workspace"
  >
    <span className="grid size-9 place-items-center rounded-lg bg-primary text-xs font-bold text-ink">
      JB
    </span>
    <span
      className="mt-6 grid size-9 place-items-center rounded-lg bg-white/12 text-sm font-semibold"
      aria-current="page"
      aria-label="Applications workspace"
    >
      A
    </span>
  </aside>
  <AnimatedSidebar
    ariaLabel="Application navigation"
    collapsible="icon"
    desktopOnly
    side="left"
    className="border-r border-line bg-surface text-ink"
  >
    <AnimatedSidebarHeader>
      <DesktopIdentity isCollapsed={isCollapsed} />
      <DesktopAddApplicationButton
        isCollapsed={isCollapsed}
        disabled={isAddDisabled}
        onAddApplication={onAddApplication}
      />
    </AnimatedSidebarHeader>
    <AnimatedSidebarContent>
      <DesktopApplicationDestinations
        isCollapsed={isCollapsed}
        stageCounts={stageCounts}
      />
    </AnimatedSidebarContent>
    <AnimatedSidebarFooter>
      {!isCollapsed ? <p className="mb-2 text-xs text-muted">Signed in</p> : null}
      <div className={cn(isCollapsed && "flex justify-center")}>{accountMenu}</div>
    </AnimatedSidebarFooter>
    <AnimatedSidebarRail
      aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      aria-expanded={open}
      title={open ? "Collapse sidebar" : "Expand sidebar"}
    >
      {open ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
    </AnimatedSidebarRail>
  </AnimatedSidebar>
</div>
```

Render expanded labels only when `!isCollapsed`, rather than hiding focusable descendants with CSS. In collapsed state:

- `BriefcaseBusiness` represents Workspace.
- `Plus` represents the exact Add application button.
- `LayoutDashboard`, `BarChart3`, `Bell`, and `Download` represent Applications, Stats, Reminders, and Export.
- Each pipeline row renders only its existing colored dot with both `aria-label` and `title` equal to `${label} · ${count} applications`.
- The footer removes Signed in text and centers the unchanged `accountMenu` node.

Use `SharedLayoutBg` only behind the active Applications destination; give it `aria-hidden="true"` and no pointer or keyboard handlers.

Define the three focused desktop helpers in the same organism file with these exact signatures so the main return remains readable:

```ts
function DesktopIdentity({ isCollapsed }: { isCollapsed: boolean }): ReactNode;

function DesktopAddApplicationButton(props: {
  disabled: boolean;
  isCollapsed: boolean;
  onAddApplication: (opener: HTMLButtonElement) => void;
}): ReactNode;

function DesktopApplicationDestinations(props: {
  isCollapsed: boolean;
  stageCounts: ApplicationStageCounts;
}): ReactNode;
```

Keep the complete mobile JSX and dialog effects unchanged.

- [ ] **Step 5: Run navigation, shell, Add modal, and Drawer regression suites**

Run:

```powershell
npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/layouts/ApplicationShell/ApplicationShell.test.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx
```

Expected: all tests PASS, including mobile open/close/Escape/focus restoration and exact Add opener assertions.

- [ ] **Step 6: Commit the navigation integration**

```powershell
git add -- src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx
git commit -m "feat: make application navigation collapsible"
```

---

### Task 4: Verify page integration, responsive behavior, and production quality

**Files:**
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`
- Verify only: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`

**Interfaces:**
- Consumes: the current page composition `<ApplicationShell navigation={<ApplicationNavigation ... />}>` without changing query or mutation signatures.
- Produces: integration evidence that a UI-only sidebar toggle preserves board data and both application workflows.

- [ ] **Step 1: Write the page-level preservation test**

Add a test that uses the current query/mutation mocks and existing application fixture:

```tsx
it("preserves board workflows and data when the desktop sidebar is toggled", async () => {
  const user = userEvent.setup();
  render(<KanbanBoardPage />);

  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(screen.getByText("Saved (1)")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
  expect(screen.getByText("Acme")).toBeInTheDocument();
  expect(screen.getByLabelText("Saved · 1 applications")).toBeInTheDocument();
  expect(updateMutateAsync).not.toHaveBeenCalled();
  expect(createMutateAsync).not.toHaveBeenCalled();
  expect(deleteMutateAsync).not.toHaveBeenCalled();

  const desktopSidebar = screen.getByRole("complementary", {
    name: "Application navigation",
  });
  await user.click(
    within(desktopSidebar).getByRole("button", { name: "Add application" }),
  );
  expect(screen.getByRole("dialog", { name: "Add application" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  await user.click(
    screen.getByRole("button", { name: "Open Frontend Engineer at Acme" }),
  );
  expect(
    screen.getByRole("dialog", { name: "Edit Frontend Engineer" }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the page suite and verify the new integration assertion**

Run:

```powershell
npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: PASS without modifying `KanbanBoardPage.tsx`; if the test exposes an integration mismatch, limit the production change to passing existing props through the current shell/navigation composition.

- [ ] **Step 3: Run the complete automated verification set**

Run:

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
git diff --check
```

Expected: 0 failing tests, ESLint exits 0, Vite production build exits 0, and diff check prints no errors. Record any existing Vite chunk-size warning separately; do not disable it.

- [ ] **Step 4: Verify the signed-in desktop flow at 1440px**

Start or reuse Vite, open `http://localhost:5173`, set the viewport to 1440px wide, and verify:

1. Dark workspace rail remains 64px.
2. Light panel is 224px on a clean storage state.
3. Rail click changes it to 68px and main board reflows without overlap.
4. Icon-only items expose browser titles and keyboard focus rings.
5. `Ctrl+B` or `Cmd+B` toggles from the board but not while Company, Notes, Status, or contenteditable content is focused.
6. Reload restores the last width.
7. Add application opens and cancels with focus returning to the exact icon/full button.
8. Clicking a card still opens the Detail Drawer.
9. The browser console has no feature-related errors.

- [ ] **Step 5: Verify the unchanged mobile flow at 390px**

At 390px wide, verify:

1. Both desktop rails and the beUI panel are absent.
2. The fixed mobile header remains visible.
3. Open navigation uses the current native dialog.
4. Close button and Escape both restore focus to Open navigation.
5. Mobile Add application still opens the form.
6. `Ctrl+B`/`Cmd+B` does not change stored or visible sidebar state.
7. The browser console has no feature-related errors.

- [ ] **Step 6: Review the final diff against security and scope boundaries**

Run:

```powershell
git status --short
git diff -- src/components/atoms/AnimatedSidebar src/components/organisms/ApplicationNavigation src/layouts/ApplicationShell src/pages/KanbanBoardPage components.json package.json package-lock.json tsconfig.app.json vite.config.ts
```

Confirm the diff contains no edits to Clerk, Supabase, TanStack Query hooks, migrations, `.env*`, routes, `src/routeTree.gen.ts`, card reordering, unrelated user files, or generated build output.

- [ ] **Step 7: Commit the page integration test**

```powershell
git add -- src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git commit -m "test: preserve board workflows across sidebar toggles"
```

---

## Final Acceptance Checklist

- [ ] Fresh users see a 224px light navigation panel beside the unchanged 64px dark rail.
- [ ] The light panel morphs to a 68px accessible icon rail from mouse, keyboard, and desktop shortcut input.
- [ ] The valid persisted values are exactly `"true"` and `"false"`, with safe read/write failure behavior.
- [ ] Collapsed actions have names and titles; disabled future destinations stay disabled; stage dots announce current counts.
- [ ] Motion follows beUI and reduced-motion users do not receive the width spring.
- [ ] The native mobile dialog, Add application modal, card Detail Drawer, board data, drag-and-drop, Clerk, and Supabase behavior remain unchanged.
- [ ] Focused tests, full tests, ESLint, build, diff check, 1440px browser check, and 390px browser check all pass.
