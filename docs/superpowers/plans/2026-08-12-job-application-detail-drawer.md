# Job Application Detail Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the editable job-application detail modal with a calm, accessible right-side motion drawer while preserving all existing form, mutation, ordering, error, and focus-restoration behavior.

**Architecture:** Add a reusable controlled Drawer atom adapted from the public beUI implementation, with local focus containment and exit-completion support. Convert the existing detail organism to consume that primitive, add a single-column option to the shared form fields, and let `KanbanBoardPage` retain the selected application until the exit animation completes.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, Motion for React, clsx, tailwind-merge, Vitest, Testing Library, TanStack Query, Supabase

## Global Constraints

- The detail drawer enters from the right.
- At `md` and wider the panel is exactly `32.5rem` (520px) wide.
- Below `md` the panel is `calc(100vw - 0.5rem)` wide.
- Header and footer remain fixed while only the form body scrolls.
- Detail fields remain a single column at every width; Add application retains its current responsive grid.
- Idle dismissal supports Close, Cancel, Escape, and backdrop activation.
- Save or Delete pending state blocks every dismissal path and disables editable controls.
- Successful Save or Delete retains the selected application through the exit animation, then clears it and restores focus.
- Failed Save or Delete keeps the edited draft and confirmation state visible.
- Exact focus restoration order is original connected opener, replacement opener for the same application ID, then the Applications heading.
- Preserve Clerk authentication, Supabase/RLS, TanStack Query hooks/cache keys, reorder calculations, validation rules, and mutation payloads.
- Add application remains a native modal.
- Use the existing Jobuddy tokens: `ink`, `muted`, `hover`, `surface`, `line`, `canvas`, `primary`, `primary-hover`, `focus`, and `danger`.
- Do not initialize shadcn or add autosave, tabs, activity history, read-only mode, or new card actions.

---

## File Map

- Create `src/lib/cn.ts`: merge conditional Tailwind class strings with `clsx` and `tailwind-merge`.
- Create `src/lib/motion.ts`: own the shared Drawer spring and reduced-motion transition constants.
- Create `src/components/atoms/Drawer/Drawer.tsx`: controlled beUI-derived motion primitive, body lock, focus entry/containment, dismissal, and exit callback.
- Create `src/components/atoms/Drawer/Drawer.test.tsx`: focused primitive behavior and accessibility tests.
- Modify `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx`: add the `layout` prop and single-column class path.
- Modify `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx`: prove single-column is opt-in and the Add form default remains responsive.
- Move `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.tsx` to `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.tsx`: preserve form behavior while replacing native dialog lifecycle with Drawer props.
- Move `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx` to `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx`: preserve mutation/validation coverage and add drawer-specific close and layout behavior.
- Modify `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`: split selected data from open state and finalize selection/focus only after exit completion.
- Modify `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`: prove retained exit state, replacement/fallback focus, and unchanged Add modal.
- Modify `package.json` and `package-lock.json`: add `motion`, `clsx`, and `tailwind-merge` runtime dependencies.

---

### Task 1: Accessible Motion Drawer Primitive

**Files:**
- Create: `src/lib/cn.ts`
- Create: `src/lib/motion.ts`
- Create: `src/components/atoms/Drawer/Drawer.tsx`
- Test: `src/components/atoms/Drawer/Drawer.test.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `motion/react` exports `AnimatePresence`, `motion`, and `useReducedMotion`; `clsx`; `tailwind-merge`.
- Produces: `cn(...inputs: ClassValue[]): string`.
- Produces: `DRAWER_SPRING` and `REDUCED_MOTION_TRANSITION` constants.
- Produces:

```ts
export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
  backdropClassName?: string;
  ariaLabel?: string;
  dismissable?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onExitComplete?: () => void;
};
```

- [ ] **Step 1: Install the three runtime dependencies**

Run:

```bash
npm install motion clsx tailwind-merge
```

Expected: `package.json` lists all three under `dependencies`, and `package-lock.json` resolves them without peer-dependency errors.

- [ ] **Step 2: Write the failing Drawer tests**

Create `Drawer.test.tsx` with a small harness that owns `open`, an external opener, an `initialFocusRef`, a first button, and a last button. Cover these concrete cases:

```tsx
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

beforeEach(() => {
  useReducedMotionMock.mockReturnValue(false);
  document.body.style.overflow = "";
});

function DrawerHarness({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const companyRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open drawer</button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        ariaLabel="Application details"
        initialFocusRef={companyRef}
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
  } else {
    fireEvent.click(screen.getByTestId("drawer-backdrop"));
  }
}

it("opens as a named modal drawer and focuses the requested field", async () => {
  const user = userEvent.setup();
  render(<DrawerHarness />);
  await user.click(screen.getByRole("button", { name: "Open drawer" }));

  expect(screen.getByRole("dialog", { name: "Application details" }))
    .toHaveAttribute("aria-modal", "true");
  await waitFor(() => expect(screen.getByLabelText("Company")).toHaveFocus());
  expect(document.body.style.overflow).toBe("hidden");
});

for (const dismissal of ["Escape", "backdrop"] as const) {
  it(`requests close from ${dismissal} only while dismissable`, () => {
    const onOpenChange = vi.fn();
    const { rerenderDrawer } = renderDrawer({ onOpenChange, dismissable: true });
    dismissThrough(dismissal);
    expect(onOpenChange).toHaveBeenCalledWith(false);

    onOpenChange.mockClear();
    rerenderDrawer({ onOpenChange, dismissable: false });
    dismissThrough(dismissal);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
}

it("wraps forward and backward Tab focus inside the panel", async () => {
  render(<DrawerHarness initiallyOpen />);
  const first = screen.getByLabelText("Company");
  const last = screen.getByRole("button", { name: "Last action" });

  last.focus();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
  expect(first).toHaveFocus();
  first.focus();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });
  expect(last).toHaveFocus();
});

it("restores the previous body overflow and reports exit completion", async () => {
  document.body.style.overflow = "clip";
  const onExitComplete = vi.fn();
  const { rerenderDrawer } = renderDrawer({ open: true, onExitComplete });
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
```

- [ ] **Step 3: Run the primitive test to prove RED**

Run:

```bash
npx vitest run src/components/atoms/Drawer/Drawer.test.tsx
```

Expected: FAIL because `Drawer.tsx`, `cn.ts`, and `motion.ts` do not exist.

- [ ] **Step 4: Implement the helpers and controlled primitive**

Implement `src/lib/cn.ts` exactly around the installed utilities:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Implement `src/lib/motion.ts` with stable shared values:

```ts
export const DRAWER_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 38,
  mass: 0.9,
};

export const REDUCED_MOTION_TRANSITION = { duration: 0.01 };
```

Implement `Drawer.tsx` using `AnimatePresence` around a backdrop and `motion.aside`. Keep a source comment linking `https://beui.dev/components/motion/drawer`. The core state and accessibility logic must follow this shape:

```tsx
import { useEffect, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "../../../lib/cn";
import { DRAWER_SPRING, REDUCED_MOTION_TRANSITION } from "../../../lib/motion";

// Adapted from https://beui.dev/components/motion/drawer

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const panelVariants = {
  left: { closed: { x: "-100%" }, open: { x: 0 } },
  right: { closed: { x: "100%" }, open: { x: 0 } },
};

export function Drawer({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
  backdropClassName,
  ariaLabel,
  dismissable = true,
  initialFocusRef,
  onExitComplete,
}: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      initialFocusRef?.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [initialFocusRef, open]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && dismissable) {
        event.preventDefault();
        onOpenChange(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [dismissable, onOpenChange, open]);
```

Add this panel focus-containment handler:

```tsx
function handlePanelKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusableElements = Array.from(
    panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");

  if (focusableElements.length === 0) {
    event.preventDefault();
    panelRef.current?.focus();
    return;
  }

  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
```

Render these semantics and motion branches, then close the component function after `</AnimatePresence>`:

```tsx
return (
  <AnimatePresence onExitComplete={onExitComplete}>
    {open ? (
      <>
        <motion.div
          data-testid="drawer-backdrop"
          aria-hidden="true"
          className={cn("fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px]", backdropClassName)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dismissable && onOpenChange(false)}
        />
        <motion.aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          data-reduced-motion={prefersReducedMotion ? "true" : undefined}
          className={cn(
            "fixed inset-y-0 z-50 flex flex-col bg-canvas text-ink shadow-[0_24px_64px_rgba(30,31,33,0.18)]",
            side === "left" ? "left-0 border-r border-line" : "right-0 border-l border-line",
            className,
          )}
          initial={prefersReducedMotion ? { opacity: 0 } : panelVariants[side].closed}
          animate={prefersReducedMotion ? { opacity: 1 } : panelVariants[side].open}
          exit={prefersReducedMotion ? { opacity: 0 } : panelVariants[side].closed}
          transition={prefersReducedMotion ? REDUCED_MOTION_TRANSITION : DRAWER_SPRING}
          onKeyDown={handlePanelKeyDown}
        >
          {children}
        </motion.aside>
      </>
    ) : null}
  </AnimatePresence>
);
}
```

- [ ] **Step 5: Run the focused test and static checks**

Run:

```bash
npx vitest run src/components/atoms/Drawer/Drawer.test.tsx
npm run lint
npm run build
```

Expected: Drawer tests PASS; lint exits 0; production build exits 0.

- [ ] **Step 6: Commit the primitive**

```bash
git add package.json package-lock.json src/lib/cn.ts src/lib/motion.ts src/components/atoms/Drawer/Drawer.tsx src/components/atoms/Drawer/Drawer.test.tsx
git commit -m "feat: add accessible motion drawer"
```

---

### Task 2: Single-Column Detail Form Layout

**Files:**
- Modify: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx`
- Test: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx`

**Interfaces:**
- Consumes: `cn(...inputs)` from Task 1.
- Produces: optional prop `layout?: "responsive" | "single-column"`, defaulting to `"responsive"`.
- Preserves: every existing form value, label, ref callback, validation association, and disabled state.

- [ ] **Step 1: Write the failing layout tests**

Extend the test render helper to accept `layout`, then add:

```tsx
it("keeps the default responsive two-column layout", () => {
  renderFields();
  expect(screen.getByRole("group", { name: "Application details" }))
    .toHaveClass("md:grid-cols-2");
});

it("renders every detail field in one column when requested", () => {
  renderFields({ layout: "single-column" });
  const details = screen.getByRole("group", { name: "Application details" });

  expect(details).not.toHaveClass("md:grid-cols-2");
  expect(screen.getByLabelText("Job URL").parentElement)
    .not.toHaveClass("md:col-span-2");
  expect(screen.getByLabelText("Notes").parentElement)
    .not.toHaveClass("md:col-span-2");
});
```

- [ ] **Step 2: Run the molecule test to prove RED**

Run:

```bash
npx vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx
```

Expected: FAIL because `layout` is not part of `JobApplicationFormFieldsProps`.

- [ ] **Step 3: Implement the layout prop without changing the default**

Add the prop and use `cn` for the grid and the three currently wide field wrappers:

```tsx
import { cn } from "../../../lib/cn";

type JobApplicationFormFieldsProps = {
  disabled: boolean;
  errors: JobApplicationFormErrors;
  idPrefix: string;
  layout?: "responsive" | "single-column";
  onChange: (field: JobApplicationFormField, value: string) => void;
  setFieldRef: (
    field: JobApplicationFormField,
    element: JobApplicationFormControl | null,
  ) => void;
  values: JobApplicationFormValues;
};

export function JobApplicationFormFields({
  disabled,
  errors,
  idPrefix,
  layout = "responsive",
  onChange,
  setFieldRef,
  values,
}: JobApplicationFormFieldsProps) {
  const usesResponsiveColumns = layout === "responsive";
}
```

Replace the current group opening tag with this exact class composition; its existing children and field order do not change:

```tsx
<div
  className={cn(
    "grid grid-cols-1 gap-4",
    usesResponsiveColumns && "md:grid-cols-2",
  )}
  role="group"
  aria-label="Application details"
>
```

For Job URL, Notes, and Resume version, replace the unconditional wrapper class with:

```tsx
<div className={cn(usesResponsiveColumns && "md:col-span-2")}>
```

- [ ] **Step 4: Run molecule and Add-modal regressions**

Run:

```bash
npx vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx
```

Expected: both suites PASS, proving the new detail-only layout does not alter Add application.

- [ ] **Step 5: Commit the form layout option**

```bash
git add src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx
git commit -m "feat: support single-column application fields"
```

---

### Task 3: Convert the Detail Organism to a Drawer

**Files:**
- Move: `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.tsx` → `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.tsx`
- Move test: `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx` → `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx`

**Interfaces:**
- Consumes: `Drawer` and `DrawerProps` behavior from Task 1.
- Consumes: `JobApplicationFormFields layout="single-column"` from Task 2.
- Produces:

```ts
type JobApplicationDetailDrawerProps = {
  application: JobApplication;
  hasDeleteError: boolean;
  hasSaveError: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  open: boolean;
  onDelete: (id: string) => Promise<unknown>;
  onExitComplete: () => void;
  onOpenChange: (open: boolean) => void;
  onSave: (input: UpdateJobApplicationInput) => Promise<unknown>;
};
```

- Preserves: Zod validation, input normalization, first-error focus, save/delete rejection behavior, two-step delete confirmation, and all user-facing copy.

- [ ] **Step 1: Move the files and write drawer-specific failing tests**

Run the file moves first:

```bash
git mv src/components/organisms/JobApplicationDetailModal src/components/organisms/JobApplicationDetailDrawer
git mv src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailModal.tsx src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.tsx
git mv src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailModal.test.tsx src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx
```

Rename exports/helper names from Modal to Drawer in the test, add `open`, `onOpenChange`, and `onExitComplete` to the render helper, then replace native-dialog assertions with controlled Drawer assertions:

```tsx
it("renders a right-side single-column detail drawer", () => {
  renderDrawer();
  const drawer = screen.getByRole("dialog", {
    name: "Edit Frontend Engineer",
  });

  expect(drawer).toHaveClass("right-0", "md:w-[32.5rem]");
  expect(drawer).toHaveClass("w-[calc(100vw-0.5rem)]");
  expect(screen.getByRole("group", { name: "Application details" }))
    .not.toHaveClass("md:grid-cols-2");
});

it("requests controlled close from Cancel and the close control", async () => {
  const user = userEvent.setup();
  const { props } = renderDrawer();

  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(props.onOpenChange).toHaveBeenCalledWith(false);
});

it("blocks every closing action while a mutation is pending", () => {
  const { props } = renderDrawer({ isSaving: true });
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.click(screen.getByTestId("drawer-backdrop"));

  expect(screen.getByRole("button", { name: "Close drawer" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  expect(props.onOpenChange).not.toHaveBeenCalled();
});
```

Keep all existing tests for prefilling, Zod validation, normalized Save payload, rejected Save draft, delete confirmation focus, rejected Delete, and disabled controls. Change successful Save/Delete assertions to expect `onOpenChange(false)` rather than a native `<dialog open>` change.

- [ ] **Step 2: Run the moved organism test to prove RED**

Run:

```bash
npx vitest run src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx
```

Expected: FAIL because the renamed component still exports native-modal props and behavior.

- [ ] **Step 3: Replace native dialog lifecycle with the Drawer contract**

Rename the component and props type. Remove `dialogRef`, `showModal()`, `close()`, `onCancel`, and native `onClose`. Add a dedicated Company initial-focus ref alongside the existing field map:

```tsx
import { Drawer } from "../../atoms/Drawer/Drawer";

const companyFocusRef = useRef<HTMLElement | null>(null);
const isBusy = isSaving || isDeleting;

function requestClose() {
  if (!isBusy) onOpenChange(false);
}

async function handleSave(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const result = jobApplicationFormSchema.safeParse(values);
  if (!result.success) {
    const errors = issuesToFieldErrors(result.error.issues);
    setFieldErrors(errors);
    const firstInvalidField = fieldOrder.find((field) => errors[field]);
    if (firstInvalidField) fieldRefs.current[firstInvalidField]?.focus();
    return;
  }

  try {
    await onSave({ id: application.id, ...result.data });
    onOpenChange(false);
  } catch {
    // The parent rerenders the error state after its mutation rejects.
  }
}
```

Use the same `onOpenChange(false)` success path in `handleDelete`. Render the shell as:

```tsx
<Drawer
  open={open}
  onOpenChange={onOpenChange}
  onExitComplete={onExitComplete}
  dismissable={!isBusy}
  initialFocusRef={companyFocusRef}
  ariaLabel={`Edit ${application.position}`}
  className="h-dvh w-[calc(100vw-0.5rem)] max-w-none md:w-[32.5rem] md:max-w-[calc(100vw-1rem)]"
>
  <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-6 md:py-5">
    <div>
      <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink">
        Edit {application.position}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Update the details for this job application.
      </p>
    </div>
    <button
      type="button"
      aria-label="Close drawer"
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-xl leading-none text-muted transition-colors hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
      disabled={isBusy}
      onClick={requestClose}
    >
      <span aria-hidden="true">×</span>
    </button>
  </header>
  <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSave}>
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
      <JobApplicationFormFields
        disabled={isBusy}
        errors={fieldErrors}
        idPrefix="application"
        layout="single-column"
        values={values}
        onChange={handleFieldChange}
        setFieldRef={(field, element) => {
          if (element) fieldRefs.current[field] = element;
          if (field === "company") companyFocusRef.current = element;
        }}
      />
      {hasSaveError ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          The application could not be saved. Please try again.
        </p>
      ) : null}
      {hasDeleteError ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          The application could not be deleted. Please try again.
        </p>
      ) : null}
    </div>
  </form>
</Drawer>
```

Place the current footer between the scrolling body and `</form>`. Its markup and action classes remain unchanged except that Cancel calls `requestClose`; Delete and Confirm delete continue to use their existing handlers, refs, confirmation group, and copy.

- [ ] **Step 4: Run Drawer, form, detail, and Add regressions**

Run:

```bash
npx vitest run src/components/atoms/Drawer/Drawer.test.tsx src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx
```

Expected: all focused suites PASS.

- [ ] **Step 5: Commit the detail drawer organism**

```bash
git add -A -- src/components/organisms/JobApplicationDetailModal src/components/organisms/JobApplicationDetailDrawer
git commit -m "feat: show application details in a drawer"
```

---

### Task 4: Coordinate Exit Lifecycle and Focus in the Page

**Files:**
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Test: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**
- Consumes: `JobApplicationDetailDrawer` props from Task 3.
- Produces: explicit `isDetailOpen: boolean` independent from `selectedApplication`.
- Produces: `handleRequestCloseDetails()` to queue focus/reset errors and start exit.
- Produces: `handleDetailExitComplete()` to clear retained application data.
- Preserves: `handleSaveApplication()` ordering behavior and all mutation hook contracts.

- [ ] **Step 1: Write failing page lifecycle tests**

Update detail queries to use the named Drawer while keeping Add dialog queries unchanged. Mock only the Drawer atom in this page suite so its exit callback is deterministic; primitive animation behavior remains covered by `Drawer.test.tsx`:

```tsx
vi.mock("../../components/atoms/Drawer/Drawer", () => ({
  Drawer: ({
    open,
    onExitComplete,
    ariaLabel,
    children,
  }: {
    open: boolean;
    onExitComplete?: () => void;
    ariaLabel?: string;
    children: ReactNode;
  }) => {
    return (
      <aside role="dialog" aria-modal="true" aria-label={ariaLabel}>
        {children}
        {!open ? (
          <button
            type="button"
            data-testid="complete-drawer-exit"
            onClick={onExitComplete}
          >
            Complete drawer exit
          </button>
        ) : null}
      </aside>
    );
  },
}));

function completeDrawerExit() {
  fireEvent.click(screen.getByTestId("complete-drawer-exit"));
}
```

Import `ReactNode` and `fireEvent`, then prove these states:

```tsx
it("retains detail content until the drawer exit completes", async () => {
  const user = userEvent.setup();
  render(<KanbanBoardPage />);

  await user.click(screen.getByRole("button", {
    name: "Open Frontend Engineer at Acme",
  }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(screen.getByLabelText("Company")).toHaveValue("Acme");
  completeDrawerExit();
  await waitFor(() => expect(screen.queryByLabelText("Company")).not.toBeInTheDocument());
});

it("restores the original opener only after exit completion", async () => {
  const user = userEvent.setup();
  render(<KanbanBoardPage />);
  const opener = screen.getByRole("button", {
    name: "Open Frontend Engineer at Acme",
  });

  await user.click(opener);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(opener).not.toHaveFocus();
  completeDrawerExit();
  await waitFor(() => expect(opener).toHaveFocus());
});
```

Adapt the existing moved-card and deleted-card tests so they assert detail content remains immediately after the deferred mutation resolves, call `completeDrawerExit()`, then `waitFor` replacement-opener and Applications-heading focus respectively. The rejected-save test asserts the Drawer remains visible with the edited draft. The Add test retains its native dialog `open` assertion.

- [ ] **Step 2: Run the page test to prove RED**

Run:

```bash
npx vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: FAIL because the page still imports the removed Modal and clears `selectedApplication` immediately.

- [ ] **Step 3: Split page selection from presentation state**

Replace the derived boolean with explicit state and update the focus effect to wait for selected data to clear:

```tsx
const [isDetailOpen, setIsDetailOpen] = useState(false);
const [selectedApplication, setSelectedApplication] =
  useState<JobApplication | null>(null);

useEffect(() => {
  if (selectedApplication || !pendingFocusRestorationRef.current) return;

  const animationFrameId = window.requestAnimationFrame(() => {
    const focusRestoration = pendingFocusRestorationRef.current;
    if (!focusRestoration) return;
    if (focusRestoration.opener.isConnected) {
      focusRestoration.opener.focus();
    } else {
      const replacementOpener = findApplicationOpener(
        focusRestoration.applicationId,
      );
      (replacementOpener ?? applicationsHeadingRef.current)?.focus();
    }
    pendingFocusRestorationRef.current = null;
  });

  return () => window.cancelAnimationFrame(animationFrameId);
}, [selectedApplication]);
```

Open, request close, and finalize exit with separate handlers:

```tsx
function handleSelectApplication(
  application: JobApplication,
  opener: HTMLButtonElement,
) {
  updateApplication.reset();
  deleteApplication.reset();
  pendingFocusRestorationRef.current = null;
  selectedApplicationOpenerRef.current = opener;
  setSelectedApplication(application);
  setIsDetailOpen(true);
}

function handleRequestCloseDetails() {
  updateApplication.reset();
  deleteApplication.reset();
  if (selectedApplication && selectedApplicationOpenerRef.current) {
    pendingFocusRestorationRef.current = {
      applicationId: selectedApplication.id,
      opener: selectedApplicationOpenerRef.current,
    };
  }
  setIsDetailOpen(false);
}

function handleDetailExitComplete() {
  setSelectedApplication(null);
}
```

Replace the import and render site:

```tsx
import { JobApplicationDetailDrawer } from "../../components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer";

{selectedApplication ? (
  <JobApplicationDetailDrawer
    key={selectedApplication.id}
    application={selectedApplication}
    hasDeleteError={deleteApplication.isError}
    hasSaveError={updateApplication.isError}
    isDeleting={deleteApplication.isPending}
    isSaving={updateApplication.isPending}
    open={isDetailOpen}
    onDelete={(id) => deleteApplication.mutateAsync(id)}
    onExitComplete={handleDetailExitComplete}
    onOpenChange={(open) => {
      if (!open) handleRequestCloseDetails();
    }}
    onSave={handleSaveApplication}
  />
) : null}
```

- [ ] **Step 4: Run page and complete focused feature suites**

Run:

```bash
npx vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
npx vitest run src/components/atoms/Drawer/Drawer.test.tsx src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: page suite PASS; all focused feature suites PASS.

- [ ] **Step 5: Commit page integration**

```bash
git add src/pages/KanbanBoardPage/KanbanBoardPage.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git commit -m "feat: coordinate application drawer lifecycle"
```

---

### Task 5: Full Verification and Signed-In Responsive Check

**Files:**
- Verify only; no source file is expected to change.

**Interfaces:**
- Consumes: the completed Drawer primitive, Detail organism, and page lifecycle.
- Produces: evidence that the feature passes automated and signed-in browser checks.

- [ ] **Step 1: Run the full automated verification**

Run:

```bash
npm run test:run
npm run lint
npm run build
git diff --check
```

Expected: all tests PASS; lint exits 0; production build exits 0; `git diff --check` emits no whitespace errors.

- [ ] **Step 2: Start the production preview**

Run:

```bash
npm run preview -- --host 127.0.0.1
```

Expected: Vite prints a reachable local preview URL and no startup error.

- [ ] **Step 3: Verify the signed-in desktop flow at 1440px**

Using the existing signed-in browser session:

1. Open the preview URL at a 1440px viewport.
2. Click an application card and confirm the panel enters from the right at 520px.
3. Confirm Company receives focus, the fields are one column, and header/footer stay visible while the form body scrolls.
4. Press Escape and confirm the panel exits, then focus returns to the same card.
5. Reopen, edit a harmless field without saving, click the backdrop, and confirm the draft is discarded and focus returns.
6. Reopen, trigger and cancel Delete confirmation, and confirm focus moves to Confirm delete and returns to Delete.
7. Confirm Add application still opens as a centered native modal.
8. Confirm the browser console has zero errors.

- [ ] **Step 4: Verify the signed-in mobile flow at 390px**

1. Set the viewport to 390px.
2. Open a card and confirm the Drawer leaves approximately 8px of the page visible.
3. Confirm there is no horizontal scroll inside the panel.
4. Confirm the close control and Save/Cancel/Delete actions remain reachable.
5. Tab through the panel and confirm focus wraps without entering the page behind it.
6. Enable reduced motion, reopen the Drawer, and confirm it fades without the lateral spring movement.
7. Confirm the browser console has zero errors.

- [ ] **Step 5: Review repository scope**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: only the intended feature commits appear; unrelated pre-existing changes remain unstaged and untouched.
