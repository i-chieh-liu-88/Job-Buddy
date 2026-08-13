# Workspace Grid Hover Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the workspace engineering-grid hover hatch originate at grid intersections, render without a frame, and mirror direction in neighbouring cells.

**Architecture:** Keep `WorkspaceEngineeringGrid` as the sole decorative background component. Extend its hover-cell state with a parity-derived direction and provide the visual change through a dynamic repeating-linear-gradient, leaving the page integration unchanged.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Preserve the existing 124px grid, `aria-hidden`, pointer-event transparency, touch guard, and reduced-motion guard.
- Do not change Kanban data, drag-and-drop behavior, routing, or authentication.

---

### Task 1: Refine the hover hatch

**Files:**
- Modify: `src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.tsx`
- Modify: `src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.test.tsx`

**Interfaces:**
- Consumes: window `pointermove` events and the current 124px grid bounds.
- Produces: `WorkspaceEngineeringGrid`, retaining `data-testid="workspace-grid-hover-cell"` for the integration test.

- [ ] **Step 1: Write the failing test**

```tsx
fireEvent.pointerMove(window, { clientX: 180, clientY: 140 });

const hoverCell = screen.getByTestId("workspace-grid-hover-cell");
expect(hoverCell).toHaveAttribute("data-pattern-direction", "mirrored");
expect(hoverCell).not.toHaveClass("border");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.test.tsx`

Expected: FAIL because the hover layer has no mirrored-direction attribute and still has a border class.

- [ ] **Step 3: Write minimal implementation**

```tsx
const column = Math.floor(localX / GRID_SIZE);
const row = Math.floor(localY / GRID_SIZE);
const patternDirection = (column + row) % 2 === 0 ? "forward" : "mirrored";
```

Store the direction with the selected cell. Use a borderless, higher-opacity repeating linear gradient whose angle switches between `45deg` and `-45deg`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx --reporter=dot`

Expected: PASS.

- [ ] **Step 5: Verify static checks**

Run: `npm.cmd run lint` and `npm.cmd run build`

Expected: both commands exit successfully.
