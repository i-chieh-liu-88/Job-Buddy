# Jobuddy Logo Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Jobuddy mark with the supplied four-lobed geometry and animate only that mark through a restrained clockwise 30-degree bounce while the wordmark remains fixed.

**Architecture:** Keep the change inside the existing `JobuddyLogo` atom. Use a plain outer `span` as the full hover target and `useAnimationControls()` to start rotation keyframes exclusively on the child `motion.svg`; the plain wordmark span remains outside every motion wrapper.

**Tech Stack:** React, TypeScript, motion/react, Tailwind CSS v4, Vitest, React Testing Library

## Global Constraints

- The visible mark remains exactly 24 px.
- The SVG uses the supplied geometry with `viewBox="0 0 256 256"` and `currentColor`.
- The mark rotates clockwise to 30 degrees, performs a small counter-motion, and returns to 0 degrees in approximately 500–600 ms.
- The `Jobuddy` wordmark remains completely stationary and keeps its existing Inter display typography.
- Compact mode continues to render only the mark.
- `prefers-reduced-motion` disables the rotation.
- No dependency, navigation, layout, route, authentication, or typography changes are permitted.

---

### Task 1: Replace and animate the Jobuddy mark

**Files:**
- Modify: `src/components/atoms/JobuddyLogo/JobuddyLogo.test.tsx`
- Modify: `src/components/atoms/JobuddyLogo/JobuddyLogo.tsx`

**Interfaces:**
- Consumes: existing `JobuddyLogo({ className?: string, compact?: boolean })` props and `motion/react`'s `motion`, `useAnimationControls`, and `useReducedMotion` APIs.
- Produces: the unchanged `JobuddyLogo` component contract with a new SVG mark and mark-only hover animation.

- [ ] **Step 1: Strengthen the tests around geometry and motion isolation**

Replace the first test with assertions that identify the new path and prove that the wordmark is not inside the animated SVG:

```tsx
it("renders the four-lobed mark beside a stationary Inter wordmark", () => {
  render(<JobuddyLogo />);

  const logo = screen.getByLabelText("Jobuddy");
  const mark = screen.getByTestId("jobuddy-mark");
  const markPath = screen.getByTestId("jobuddy-mark-path");
  const wordmark = screen.getByText("Jobuddy");

  expect(logo).toBeInTheDocument();
  expect(mark).toHaveClass("size-6");
  expect(mark).toHaveAttribute("viewBox", "0 0 256 256");
  expect(markPath).toHaveAttribute(
    "d",
    "M 192 0 C 227.346 0 256 28.654 256 64 C 256 99.346 227.346 128 192 128 C 227.346 128 256 156.654 256 192 C 256 227.346 227.346 256 192 256 C 156.654 256 128 227.346 128 192 C 128 227.346 99.346 256 64 256 C 28.654 256 0 227.346 0 192 C 0 156.654 28.654 128 64 128 C 28.654 128 0 99.346 0 64 C 0 28.654 28.654 0 64 0 C 99.346 0 128 28.654 128 64 C 128 28.654 156.654 0 192 0 Z M 128 100 C 112.536 100 100 112.536 100 128 C 100 143.464 112.536 156 128 156 C 143.464 156 156 143.464 156 128 C 156 112.536 143.464 100 128 100 Z",
  );
  expect(wordmark).toHaveClass("font-display");
  expect(mark.contains(wordmark)).toBe(false);
});
```

Keep the existing compact-mode test unchanged because it protects the accessible name and hidden wordmark behavior.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
npx.cmd vitest run src/components/atoms/JobuddyLogo/JobuddyLogo.test.tsx
```

Expected: FAIL because the current SVG uses `viewBox="0 0 48 48"`, the old smile geometry, and the old `jobuddy-smile-mark` test id.

- [ ] **Step 3: Implement the new geometry and mark-only motion**

Replace the existing logo motion constants and component body with the following structure. Update the motion import to `import { motion, useAnimationControls, useReducedMotion } from "motion/react";` while retaining the existing props and `cn` import:

```tsx
const MARK_TRANSITION = {
  duration: 0.56,
  ease: "easeOut" as const,
  times: [0, 0.34, 0.64, 0.82, 1],
};

export function JobuddyLogo({ className, compact = false }: JobuddyLogoProps) {
  const reduce = useReducedMotion() ?? false;
  const markControls = useAnimationControls();

  const animateMark = () => {
    if (reduce) return;

    void markControls.start({
      rotate: [0, 30, -4, 2, 0],
      transition: MARK_TRANSITION,
    });
  };

  return (
    <span
      aria-label="Jobuddy"
      className={cn("inline-flex items-center gap-2", className)}
      onMouseEnter={animateMark}
    >
      <motion.svg
        aria-hidden="true"
        data-testid="jobuddy-mark"
        viewBox="0 0 256 256"
        className="size-6 shrink-0 overflow-visible text-primary"
        fill="none"
        animate={markControls}
        initial={{ rotate: 0 }}
        style={{ transformOrigin: "center" }}
      >
        <path
          data-testid="jobuddy-mark-path"
          d="M 192 0 C 227.346 0 256 28.654 256 64 C 256 99.346 227.346 128 192 128 C 227.346 128 256 156.654 256 192 C 256 227.346 227.346 256 192 256 C 156.654 256 128 227.346 128 192 C 128 227.346 99.346 256 64 256 C 28.654 256 0 227.346 0 192 C 0 156.654 28.654 128 64 128 C 28.654 128 0 99.346 0 64 C 0 28.654 28.654 0 64 0 C 99.346 0 128 28.654 128 64 C 128 28.654 156.654 0 192 0 Z M 128 100 C 112.536 100 100 112.536 100 128 C 100 143.464 112.536 156 128 156 C 143.464 156 156 143.464 156 128 C 156 112.536 143.464 100 128 100 Z"
          fill="currentColor"
        />
      </motion.svg>

      {!compact ? (
        <span
          aria-hidden="true"
          className="font-display text-base font-semibold tracking-[-0.03em] text-ink"
        >
          Jobuddy
        </span>
      ) : null}
    </span>
  );
}
```

Do not add variants, transforms, transitions, or layout animation to the outer wrapper or wordmark. The plain wrapper only detects hover entry; `markControls` targets the SVG child exclusively.

- [ ] **Step 4: Run the focused and navigation tests and confirm GREEN**

Run:

```powershell
npx.cmd vitest run src/components/atoms/JobuddyLogo/JobuddyLogo.test.tsx src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx
```

Expected: both test files pass. The logo tests confirm geometry and composition; the navigation tests confirm default and compact sidebar integration.

- [ ] **Step 5: Run repository verification**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
```

Expected: all commands exit with code 0. Existing unrelated worktree changes must remain untouched.

- [ ] **Step 6: Verify the authenticated UI in the browser**

On `http://localhost:5173/`, hover the sidebar logo and confirm:

- The four-lobed mark rotates clockwise by approximately 30 degrees.
- It performs a short counter-motion and settles at 0 degrees in roughly 560 ms.
- The `Jobuddy` text has an unchanged bounding box and computed transform throughout the animation.
- Compact sidebar mode shows the same animated mark without the wordmark.
- With reduced motion enabled, the mark remains at 0 degrees.

- [ ] **Step 7: Commit the focused implementation**

```powershell
git add -- src/components/atoms/JobuddyLogo/JobuddyLogo.tsx src/components/atoms/JobuddyLogo/JobuddyLogo.test.tsx
git commit -m "feat: animate the Jobuddy logo mark"
```
