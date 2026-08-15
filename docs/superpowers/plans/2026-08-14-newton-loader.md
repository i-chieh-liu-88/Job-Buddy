# Newton Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Clerk authentication ASCII Bounce indicator with a caption-free 64px beUI Newton loader.

**Architecture:** Add a dedicated `NewtonLoader` atom containing only the official five-ball animation rather than bundling every beUI loader variant. `AuthGate` will consume the new atom only during Clerk authentication resolution; all existing loader atoms and authentication branches remain unchanged.

**Tech Stack:** React 19, TypeScript, Motion, Tailwind CSS v4, Vitest, Testing Library

## Global Constraints

- Use five adjacent circular balls and the official end-ball motion sequence.
- Default loader size is exactly `64px` and default speed is `1`.
- Use the existing primary color.
- Do not render a visible loading caption.
- Preserve `Entering Job Buddy workspace` as the accessible status label in `AuthGate`.
- Under reduced motion, render all five balls without transform animation.
- Keep `AsciiBounceLoader`, `DitherLoader`, and `ScrambleLoader` unchanged.
- Do not change authentication behavior, routing, or the full-screen loading container.

---

### Task 1: Add the Newton loader atom

**Files:**
- Create: `src/components/atoms/NewtonLoader/NewtonLoader.tsx`
- Create: `src/components/atoms/NewtonLoader/NewtonLoader.test.tsx`

**Interfaces:**
- Consumes: `EASE_IN_OUT` from `src/lib/ease.ts`, `cn` from `src/lib/cn.ts`, and `motion` plus `useReducedMotion` from `motion/react`.
- Produces: `NewtonLoader({ label?, size?, speed?, className? })`, defaulting to `label="Loading"`, `size={64}`, and `speed={1}`.

- [ ] **Step 1: Write the failing atom tests**

Create `src/components/atoms/NewtonLoader/NewtonLoader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewtonLoader } from "./NewtonLoader";

describe("NewtonLoader", () => {
  it("renders five 64px-scaled balls without a visible caption", () => {
    render(<NewtonLoader label="Entering workspace" />);

    expect(screen.getByRole("status")).toHaveAccessibleName("Entering workspace");
    expect(screen.getAllByTestId("newton-loader-ball")).toHaveLength(5);
    expect(screen.getByTestId("newton-loader-balls")).toHaveStyle({
      height: "12.8px",
    });
    expect(screen.getAllByTestId("newton-loader-ball")[0]).toHaveStyle({
      width: "12.8px",
      height: "12.8px",
    });
    expect(screen.queryByText("Entering workspace")).not.toBeInTheDocument();
  });

  it("scales its ball geometry from the supplied size", () => {
    render(<NewtonLoader size={40} />);

    expect(screen.getByTestId("newton-loader-balls")).toHaveStyle({ height: "8px" });
    expect(screen.getAllByTestId("newton-loader-ball")[0]).toHaveStyle({
      width: "8px",
      height: "8px",
    });
  });
});
```

- [ ] **Step 2: Run the atom test to verify RED**

Run:

```powershell
npx.cmd vitest run src/components/atoms/NewtonLoader/NewtonLoader.test.tsx
```

Expected: FAIL because `./NewtonLoader` does not exist.

- [ ] **Step 3: Implement the focused official Newton component**

Create `src/components/atoms/NewtonLoader/NewtonLoader.tsx`:

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../../lib/cn";
import { EASE_IN_OUT } from "../../../lib/ease";

const NEWTON_BALLS = [0, 1, 2, 3, 4] as const;

type NewtonLoaderProps = {
  label?: string;
  size?: number;
  speed?: number;
  className?: string;
};

export function NewtonLoader({
  label = "Loading",
  size = 64,
  speed = 1,
  className,
}: NewtonLoaderProps) {
  const reduce = useReducedMotion() ?? false;
  const diameter = size * 0.2;
  const travel = diameter * 1.1;
  const moves: Partial<Record<(typeof NEWTON_BALLS)[number], { x: number[]; times: number[] }>> = {
    0: { x: [0, -travel, 0, 0], times: [0, 0.28, 0.5, 1] },
    4: { x: [0, 0, travel, 0], times: [0, 0.5, 0.78, 1] },
  };

  return (
    <span
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-primary", className)}
      role="status"
    >
      <span
        aria-hidden="true"
        className="flex items-center justify-center"
        data-testid="newton-loader-balls"
        style={{ height: diameter }}
      >
        {NEWTON_BALLS.map((index) => {
          const move = moves[index];

          return (
            <motion.span
              animate={reduce || !move ? undefined : { x: move.x }}
              className="rounded-full bg-current"
              data-testid="newton-loader-ball"
              key={index}
              style={{ width: diameter, height: diameter }}
              transition={
                reduce || !move
                  ? undefined
                  : {
                      duration: speed * 1.5,
                      ease: EASE_IN_OUT,
                      repeat: Number.POSITIVE_INFINITY,
                      times: move.times,
                    }
              }
            />
          );
        })}
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Run the atom tests to verify GREEN**

Run:

```powershell
npx.cmd vitest run src/components/atoms/NewtonLoader/NewtonLoader.test.tsx
```

Expected: 2 tests PASS with no warnings.

- [ ] **Step 5: Commit the atom**

```powershell
git add -- src/components/atoms/NewtonLoader/NewtonLoader.tsx src/components/atoms/NewtonLoader/NewtonLoader.test.tsx
git commit -m "feat: add Newton loader"
```

---

### Task 2: Use Newton during Clerk authentication loading

**Files:**
- Modify: `src/components/organisms/AuthGate/AuthGate.tsx:1-25`
- Modify: `src/components/organisms/AuthGate/AuthGate.test.tsx:24-50`

**Interfaces:**
- Consumes: `NewtonLoader` from `src/components/atoms/NewtonLoader/NewtonLoader.tsx`.
- Produces: Clerk loading UI with five 64px-scaled Newton balls, no caption, and a status named `Entering Job Buddy workspace`.

- [ ] **Step 1: Update the AuthGate test first**

Replace the ASCII-specific loading assertions with:

```tsx
expect(screen.getByRole("status")).toHaveAccessibleName(
  "Entering Job Buddy workspace",
);
expect(screen.getAllByTestId("newton-loader-ball")).toHaveLength(5);
expect(screen.getByTestId("newton-loader-balls")).toHaveStyle({
  height: "12.8px",
});
expect(
  screen.queryByTestId("ascii-bounce-loader-glyph"),
).not.toBeInTheDocument();
expect(screen.queryByText("Entering Job Buddy workspace")).not.toBeInTheDocument();
expect(screen.queryByText("Protected board")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the AuthGate test to verify RED**

Run:

```powershell
npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx
```

Expected: FAIL because `AuthGate` still renders `AsciiBounceLoader`.

- [ ] **Step 3: Replace only the Clerk loading indicator**

Replace the `AsciiBounceLoader` import with:

```tsx
import { NewtonLoader } from "../../atoms/NewtonLoader/NewtonLoader";
```

Replace the loading indicator with:

```tsx
<NewtonLoader label="Entering Job Buddy workspace" size={64} />
```

Do not alter the surrounding `<main className="grid min-h-screen place-items-center bg-canvas px-6">` element.

- [ ] **Step 4: Run the focused suite**

Run:

```powershell
npx.cmd vitest run src/components/atoms/NewtonLoader/NewtonLoader.test.tsx src/components/organisms/AuthGate/AuthGate.test.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 5: Run project verification**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
npm.cmd run test:run
```

Expected: focused checks, lint, build, and diff check exit with code 0. The full suite may retain only the previously identified `MonthInterviewCalendar` hover-versus-click failure; report it without changing Calendar code.

- [ ] **Step 6: Check the Clerk loading transition in the browser when observable**

Reload `http://localhost:5173/` and confirm the signed-in workspace or signed-out landing page replaces the loading state without console errors. If Clerk resolves too quickly to capture the loader, record that limitation and use the deterministic `AuthGate` test as the visual-state contract.

- [ ] **Step 7: Commit the integration**

```powershell
git add -- src/components/organisms/AuthGate/AuthGate.tsx src/components/organisms/AuthGate/AuthGate.test.tsx
git commit -m "feat: show Newton loader while signing in"
```
