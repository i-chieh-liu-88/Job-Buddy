# Magnetic Add Application Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the workspace Add application control a dark translucent, rounded, subtle-pull magnetic beUI button without changing its existing open-form behavior.

**Architecture:** Keep the existing beUI `Button` as the press interaction primitive. Add a local `MagneticAddApplicationButton` atom that uses Motion values and springs for pointer-following translation only on hover-capable, non-reduced-motion devices; `AddApplicationButton` composes it with the existing accessible Add action.

**Tech Stack:** React, TypeScript, Tailwind CSS, Motion for React, Vitest, Testing Library.

## Global Constraints

- Preserve the existing Add application callback, disabled behavior, collapsed icon-only mode, and accessible name.
- Use `Button` with `variant="outline"` so the existing beUI spring press is retained.
- Expanded copy is exactly `Add application`; it is JetBrains Mono, `11px`, title case, and tight letter spacing.
- Render subtle magnetic movement only for fine-pointer hover devices and disable it for `prefers-reduced-motion`.
- The visual treatment is a dark translucent fill, light outline, rounded control, blue-violet circular plus icon, pointer cursor, brighter fill and outline on hover.

---

### Task 1: Magnetic motion atom

**Files:**
- Create: `src/components/atoms/MagneticAddApplicationButton/MagneticAddApplicationButton.tsx`
- Create: `src/components/atoms/MagneticAddApplicationButton/MagneticAddApplicationButton.test.tsx`
- Modify: `src/components/atoms/AddApplicationButton/AddApplicationButton.tsx`
- Modify: `src/components/atoms/AddApplicationButton/AddApplicationButton.test.tsx`

**Interfaces:**
- Consumes: `ButtonProps` from `src/components/atoms/StatefulButton/base.tsx`, `SPRING_MOUSE` from `src/lib/ease.ts`, and `useHoverCapable` from `src/lib/use-hover-capable.ts`.
- Produces: `MagneticAddApplicationButton`, an accessible button wrapper that accepts normal `ButtonProps` and uses a strong pointer-following pull only on supported devices.

- [ ] **Step 1: Write the failing tests**

```tsx
expect(screen.getByRole("button", { name: "Add application" })).toHaveClass(
  "rounded-full",
  "cursor-pointer",
  "bg-[#0A0A0A]/80",
);
expect(screen.getByTestId("add-application-plus")).toHaveClass("size-7");
expect(screen.getByText("Add application")).toHaveClass("font-mono", "text-[11px]");
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npx.cmd vitest run src/components/atoms/AddApplicationButton/AddApplicationButton.test.tsx --reporter=dot`

Expected: FAIL because the existing button is square, named `Add`, and has no magnetic wrapper.

- [ ] **Step 3: Write the minimal implementation**

```tsx
const x = useMotionValue(0);
const y = useMotionValue(0);
const springX = useSpring(x, SPRING_MOUSE);
const springY = useSpring(y, SPRING_MOUSE);

function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
  if (!enabled) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 20);
  y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 20);
}
```

Use the magnetic atom in `AddApplicationButton`, retain `variant="outline"`, and style the expanded label plus icon according to the global constraints. Reset both Motion values on pointer leave.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npx.cmd vitest run src/components/atoms/AddApplicationButton/AddApplicationButton.test.tsx --reporter=dot`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/components/atoms/MagneticAddApplicationButton src/components/atoms/AddApplicationButton
git commit -m "feat: add magnetic application action"
```

### Task 2: Integration regression and verification

**Files:**
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx` only if the accessible name expectations require the new exact copy.
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx` only if the accessible name expectations require the new exact copy.

**Interfaces:**
- Consumes: `AddApplicationButton` with its existing `collapsed`, `disabled`, and `onClick` props.
- Produces: unchanged form-opening behavior for desktop, collapsed desktop, and mobile navigation actions.

- [ ] **Step 1: Update only affected accessible-name expectations**

```tsx
screen.getByRole("button", { name: "Add application" });
```

- [ ] **Step 2: Run integration tests**

Run: `npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx --reporter=dot`

Expected: PASS; the Add action opens the form and focus behavior remains unchanged.

- [ ] **Step 3: Run project verification**

Run: `npm.cmd run lint; npx.cmd vitest run --reporter=dot; npm.cmd run build; git diff --check`

Expected: lint, all tests, production build, and diff check pass.

- [ ] **Step 4: Commit**

```powershell
git add -- src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git commit -m "test: cover magnetic application action"
```
