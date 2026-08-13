# Workspace Engineering Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a decorative bklit-inspired engineering grid and cursor-responsive cell highlight behind the authenticated Job Buddy workspace.

**Architecture:** `WorkspaceEngineeringGrid` is an absolute, `aria-hidden` background atom. It observes global pointer movement, derives the hovered grid cell relative to its own bounds, and exposes the highlight through CSS custom properties while remaining non-interactive. `KanbanBoardPage` positions it behind the existing workspace content.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- The visual layer must use `pointer-events-none` and must not block card selection, drag-and-drop, modal, or drawer behavior.
- The pattern is decorative and must have `aria-hidden="true"`.
- Render a quiet dark grid, node intersections, and a single cursor-responsive hatched cell.
- Do not add packages, routes, data calls, or change Clerk/Supabase behavior.

---

### Task 1: Workspace Engineering Grid Atom

**Files:**
- Create: `src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.tsx`
- Test: `src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.test.tsx`

**Interfaces:**
- Produces: `WorkspaceEngineeringGrid`, a no-props visual component.
- Consumes: React `useEffect`, `useRef`, and `useState`.

- [ ] **Step 1: Write the failing test**

```tsx
render(<WorkspaceEngineeringGrid />);
const background = screen.getByTestId("workspace-engineering-grid");
expect(background).toHaveAttribute("aria-hidden", "true");
fireEvent.pointerMove(window, { clientX: 120, clientY: 140 });
expect(screen.getByTestId("workspace-grid-hover-cell")).toHaveStyle({ opacity: "1" });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function WorkspaceEngineeringGrid() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ visible: false, x: 0, y: 0 });
  useEffect(() => {
    const update = (event: PointerEvent) => setPointer({ visible: true, x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", update);
    return () => window.removeEventListener("pointermove", update);
  }, []);
  return <div ref={rootRef} aria-hidden="true" data-testid="workspace-engineering-grid">...</div>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.test.tsx`

Expected: PASS.

### Task 2: Workspace Page Integration

**Files:**
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**
- Consumes: `WorkspaceEngineeringGrid` from Task 1.
- Preserves: existing `KanbanBoardPage` data, action, focus restoration, drag-and-drop, modal, and drawer workflows.

- [ ] **Step 1: Write the failing test**

```tsx
render(<KanbanBoardPage />);
expect(screen.getByTestId("workspace-engineering-grid")).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "Applications" })).toBeVisible();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

Expected: FAIL because the page does not yet compose the grid atom.

- [ ] **Step 3: Write minimal implementation**

```tsx
<div className="relative min-h-screen ...">
  <WorkspaceEngineeringGrid />
  <div className="relative z-10">existing workspace</div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

Expected: PASS; all existing page behaviors remain green.

### Task 3: Regression Verification

**Files:**
- Verify: both new/modified component and page test files.

- [ ] **Step 1: Run focused tests**

Run: `npx.cmd vitest run src/components/backgrounds/WorkspaceEngineeringGrid/WorkspaceEngineeringGrid.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run project checks**

Run: `npm.cmd run lint; npm.cmd run build; npm.cmd run test:run`

Expected: all commands exit successfully.
