# Add Application Outline Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a beUI outline-style Add control in workspace navigation with a large plus circle and `Add` label.

**Architecture:** Create an `AddApplicationButton` atom that wraps the existing beUI `Button` base with its `outline` variant. ApplicationNavigation uses the atom in desktop and mobile locations, retaining the existing handler contract.

**Tech Stack:** React, TypeScript, motion/react, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Use the existing beUI Button `outline` variant and preserve its spring hover/press interaction.
- Expanded label is exactly `Add`; collapsed control remains icon-only with accessible name `Add`.
- Minimum interactive target is 44px; no navigation behavior changes.

---

### Task 1: Add the shared control and wire navigation

**Files:**
- Create: `src/components/atoms/AddApplicationButton/AddApplicationButton.tsx`
- Create: `src/components/atoms/AddApplicationButton/AddApplicationButton.test.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`

**Interfaces:**
- Produces: `AddApplicationButton({ collapsed?: boolean; disabled?: boolean; onClick: MouseEventHandler<HTMLButtonElement> })`.
- Consumed by: desktop expanded/collapsed and mobile workspace navigation.

- [ ] **Step 1: Write the failing atom test**

```tsx
render(<AddApplicationButton onClick={vi.fn()} />);
expect(screen.getByRole("button", { name: "Add" })).toHaveClass("rounded-none");
expect(screen.getByTestId("add-application-plus")).toHaveClass("rounded-full");
```

- [ ] **Step 2: Verify RED**

Run: `npx.cmd vitest run src/components/atoms/AddApplicationButton/AddApplicationButton.test.tsx --reporter=dot`

Expected: FAIL because the atom is absent.

- [ ] **Step 3: Implement the beUI outline control**

```tsx
<Button variant="outline" className="min-h-11 rounded-none ...">
  <span className="grid size-6 rounded-full bg-primary ..."><Plus /></span>
  {!collapsed ? <span>Add</span> : null}
</Button>
```

- [ ] **Step 4: Replace the navigation-specific Add buttons**

Render the atom for desktop and mobile, retaining `event.currentTarget` in the callback. Use `collapsed` for the icon-only desktop state.

- [ ] **Step 5: Verify**

Run: `npx.cmd vitest run src/components/atoms/AddApplicationButton/AddApplicationButton.test.tsx src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx --reporter=dot`, `npm.cmd run lint`, `npx.cmd vitest run --reporter=dot`, and `npm.cmd run build`.
