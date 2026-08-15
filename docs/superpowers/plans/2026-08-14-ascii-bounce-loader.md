# ASCII Bounce Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Clerk authentication loading indicator with a 64px, caption-free beUI ASCII Bounce loader.

**Architecture:** Add one focused Atomic Design primitive that owns the official ASCII frame cycle and accessibility contract. Integrate that atom only in `AuthGate`, leaving the authentication flow, full-screen container, and all other loader components unchanged.

**Tech Stack:** React 19, TypeScript, Motion `useReducedMotion`, Tailwind CSS v4, Vitest, Testing Library

## Global Constraints

- Use the official ASCII Bounce frame sequence: `⠁ ⠂ ⠄ ⡀ ⢀ ⠠ ⠐ ⠈`.
- Default loader size is exactly `64px`.
- Do not render a visible loading caption.
- Preserve `Entering Job Buddy workspace` as the screen-reader-accessible status label in `AuthGate`.
- Use the loader only while Clerk is resolving authentication.
- Do not delete or modify the existing `DitherLoader` or `ScrambleLoader` components.
- Do not change authentication behavior, routing, or the full-screen loading container.

---

### Task 1: Add the ASCII Bounce loader atom

**Files:**
- Create: `src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.tsx`
- Create: `src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.test.tsx`

**Interfaces:**
- Consumes: `useReducedMotion()` from `motion/react` and `cn(...classes)` from `src/lib/cn.ts`.
- Produces: `AsciiBounceLoader({ label?, size?, speed?, className? }): JSX.Element`, with `label="Loading"`, `size={64}`, and `speed={1}` defaults.

- [ ] **Step 1: Write the failing atom tests**

Create `src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.test.tsx`:

```tsx
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AsciiBounceLoader } from "./AsciiBounceLoader";

describe("AsciiBounceLoader", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a caption-free 64px ASCII status with the supplied accessible label", () => {
    render(<AsciiBounceLoader label="Entering workspace" />);

    expect(screen.getByRole("status")).toHaveAccessibleName("Entering workspace");
    expect(screen.getByTestId("ascii-bounce-loader-glyph")).toHaveTextContent("⠁");
    expect(screen.getByTestId("ascii-bounce-loader-glyph")).toHaveStyle({
      fontSize: "64px",
    });
    expect(screen.queryByText("Entering workspace")).not.toBeInTheDocument();
  });

  it("advances through the official ASCII Bounce frames", () => {
    vi.useFakeTimers();
    render(<AsciiBounceLoader speed={1} />);

    act(() => {
      vi.advanceTimersByTime(125);
    });

    expect(screen.getByTestId("ascii-bounce-loader-glyph")).toHaveTextContent("⠂");
  });
});
```

- [ ] **Step 2: Run the atom tests to verify RED**

Run:

```powershell
npx.cmd vitest run src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.test.tsx
```

Expected: FAIL because `./AsciiBounceLoader` does not exist.

- [ ] **Step 3: Implement the minimal dedicated atom**

Create `src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.tsx`:

```tsx
"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../../lib/cn";

const ASCII_BOUNCE_FRAMES = ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"] as const;

type AsciiBounceLoaderProps = {
  label?: string;
  size?: number;
  speed?: number;
  className?: string;
};

export function AsciiBounceLoader({
  label = "Loading",
  size = 64,
  speed = 1,
  className,
}: AsciiBounceLoaderProps) {
  const reduce = useReducedMotion() ?? false;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const cycleSeconds = reduce ? speed * 2.5 : speed;
    const stepMilliseconds = (cycleSeconds / ASCII_BOUNCE_FRAMES.length) * 1000;
    const intervalId = window.setInterval(() => {
      setFrame((currentFrame) => (currentFrame + 1) % ASCII_BOUNCE_FRAMES.length);
    }, stepMilliseconds);

    return () => window.clearInterval(intervalId);
  }, [reduce, speed]);

  return (
    <span
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-primary", className)}
      role="status"
    >
      <span
        aria-hidden="true"
        className="font-mono leading-none tabular-nums"
        data-testid="ascii-bounce-loader-glyph"
        style={{ fontSize: size, lineHeight: 1 }}
      >
        {ASCII_BOUNCE_FRAMES[frame]}
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Run the atom tests to verify GREEN**

Run:

```powershell
npx.cmd vitest run src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.test.tsx
```

Expected: 2 tests PASS. If Motion reports reduced motion in the test environment, mock `useReducedMotion` to return `false` so the 125ms assertion remains deterministic.

- [ ] **Step 5: Commit the atom**

```powershell
git add -- src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.tsx src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.test.tsx
git commit -m "feat: add ASCII bounce loader"
```

---

### Task 2: Use ASCII Bounce during Clerk authentication loading

**Files:**
- Modify: `src/components/organisms/AuthGate/AuthGate.tsx:1-25`
- Modify: `src/components/organisms/AuthGate/AuthGate.test.tsx:24-47`

**Interfaces:**
- Consumes: `AsciiBounceLoader` from `src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.tsx`.
- Produces: Clerk loading UI containing a `role="status"` named `Entering Job Buddy workspace` and a 64px ASCII Bounce glyph, with no visible caption.

- [ ] **Step 1: Update the AuthGate test first**

Replace the dither-specific expectation in the first `AuthGate` test:

```tsx
expect(screen.getByRole("status")).toHaveAccessibleName(
  "Entering Job Buddy workspace",
);
expect(screen.getByTestId("ascii-bounce-loader-glyph")).toHaveStyle({
  fontSize: "64px",
});
expect(
  screen.queryByTestId("dither-loader-grid"),
).not.toBeInTheDocument();
expect(screen.queryByText("Entering Job Buddy workspace")).not.toBeInTheDocument();
expect(screen.queryByText("Protected board")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the AuthGate test to verify RED**

Run:

```powershell
npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx
```

Expected: FAIL because `AuthGate` still renders `DitherLoader` and no `ascii-bounce-loader-glyph` exists.

- [ ] **Step 3: Replace only the Clerk loading indicator**

In `src/components/organisms/AuthGate/AuthGate.tsx`, replace:

```tsx
import { DitherLoader } from "../../atoms/DitherLoader/DitherLoader";
```

with:

```tsx
import { AsciiBounceLoader } from "../../atoms/AsciiBounceLoader/AsciiBounceLoader";
```

Then replace:

```tsx
<DitherLoader label="Entering Job Buddy workspace" />
```

with:

```tsx
<AsciiBounceLoader label="Entering Job Buddy workspace" size={64} />
```

Do not change the surrounding `<main className="grid min-h-screen place-items-center bg-canvas px-6">` element.

- [ ] **Step 4: Run focused loader and AuthGate tests**

Run:

```powershell
npx.cmd vitest run src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.test.tsx src/components/organisms/AuthGate/AuthGate.test.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 5: Run project verification**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
```

Expected: every command exits with code 0. Also run `npm.cmd run test:run`; if the previously identified MonthInterviewCalendar hover-versus-click test still fails, report it as unrelated and do not alter it within this loader task.

- [ ] **Step 6: Verify the loading UI in the browser when observable**

Open or reload `http://localhost:5173/` and inspect the Clerk-loading state. Confirm:

- the centered glyph is approximately 64px;
- the visible loading caption is absent;
- no console error occurs;
- the signed-in workspace or signed-out landing page still replaces the loader after Clerk resolves.

If Clerk resolves too quickly to observe reliably, record that limitation and rely on the deterministic `AuthGate` test for the loading-state contract.

- [ ] **Step 7: Commit the integration**

```powershell
git add -- src/components/organisms/AuthGate/AuthGate.tsx src/components/organisms/AuthGate/AuthGate.test.tsx
git commit -m "feat: show ASCII bounce while signing in"
```
