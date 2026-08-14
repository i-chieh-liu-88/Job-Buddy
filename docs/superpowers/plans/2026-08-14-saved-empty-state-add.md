# Saved Empty-State Add Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the empty Saved Kanban state into an `Add application` button that opens the existing creation modal and restores focus when the modal closes.

**Architecture:** Keep modal ownership and focus restoration in `KanbanBoardPage`. Add a narrowly scoped callback and disabled flag through `KanbanBoard` to `KanbanColumn`; only an empty Saved column consumes them and renders a semantic button. Existing create mutation, form defaults, ordering, other empty states, and drag-and-drop remain unchanged.

**Tech Stack:** React, TypeScript, Tailwind CSS, Testing Library, Vitest, TanStack Query integration already present in the page.

## Global Constraints

- Only the Saved column empty state is interactive.
- The visible and accessible button name is exactly `Add application`.
- The existing Add application modal and its default `saved` status are reused.
- Other columns keep the text `No applications yet` and remain non-interactive.
- The exact empty-state opener regains focus after the form closes.
- No dependency, route, database, authentication, or drag-and-drop changes.

---

### Task 1: Saved Empty-State Add Action

**Files:**
- Modify: `src/components/organisms/KanbanBoard/KanbanColumn.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.test.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**
- Consumes: existing `handleOpenAddApplication(opener: HTMLButtonElement): void` in `KanbanBoardPage`.
- Produces: optional `onAddApplication?: (opener: HTMLButtonElement) => void` and `isAddDisabled?: boolean` props on `KanbanBoard`, forwarded to `KanbanColumn`.
- Produces: an empty Saved button with accessible name `Add application`.

- [ ] **Step 1: Write failing board tests for the Saved empty-state contract**

Add tests to `KanbanBoard.test.tsx` that render a board without Saved applications and verify the real UI behavior:

```tsx
it("offers the add action only from an empty Saved column", async () => {
  const onAddApplication = vi.fn();
  const user = userEvent.setup();
  render(
    <KanbanBoard
      applications={applications.filter(({ status }) => status !== "saved")}
      onAddApplication={onAddApplication}
      onReorder={vi.fn()}
    />,
  );

  const savedColumn = screen.getByRole("region", { name: "Saved (0)" });
  const addButton = within(savedColumn).getByRole("button", {
    name: "Add application",
  });

  await user.click(addButton);
  expect(onAddApplication).toHaveBeenCalledWith(addButton);
  expect(
    within(screen.getByRole("region", { name: "Applied (0)" })).queryByRole(
      "button",
      { name: "Add application" },
    ),
  ).not.toBeInTheDocument();
});

it("disables the Saved empty-state add action when creation is disabled", () => {
  render(
    <KanbanBoard
      applications={applications.filter(({ status }) => status !== "saved")}
      isAddDisabled
      onAddApplication={vi.fn()}
      onReorder={vi.fn()}
    />,
  );

  expect(screen.getByRole("button", { name: "Add application" })).toBeDisabled();
});
```

- [ ] **Step 2: Run the board tests and verify RED**

Run:

```powershell
npx.cmd vitest run src/components/organisms/KanbanBoard/KanbanBoard.test.tsx
```

Expected: TypeScript or assertion failure because `KanbanBoard` does not yet accept or render the Saved empty-state add action.

- [ ] **Step 3: Write a failing page integration test for modal opening and focus restoration**

Add this behavior test to `KanbanBoardPage.test.tsx`:

```tsx
it("opens Add application from the empty Saved state and restores its focus", async () => {
  const user = userEvent.setup();
  useJobApplicationsMock.mockReturnValue({
    data: applications.filter(({ status }) => status !== "saved"),
    error: null,
    isError: false,
    isPending: false,
  });
  render(<KanbanBoardPage />);

  const savedColumn = screen.getByRole("region", { name: "Saved (0)" });
  const emptyStateButton = within(savedColumn).getByRole("button", {
    name: "Add application",
  });

  await user.click(emptyStateButton);
  expect(screen.getByRole("dialog", { name: "Add application" })).toBeVisible();
  expect(screen.getByLabelText("Status")).toHaveValue("saved");

  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(emptyStateButton).toHaveFocus());
});
```

- [ ] **Step 4: Run the page test and verify RED**

Run:

```powershell
npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: FAIL because the empty Saved state is not a button and has no callback to the page.

- [ ] **Step 5: Implement the callback and visual button**

In `KanbanBoard.tsx`, extend the props and forward the add action only to the Saved column:

```tsx
type OpenAddApplication = (opener: HTMLButtonElement) => void;

type KanbanBoardProps = {
  applications: JobApplication[];
  isAddDisabled?: boolean;
  isUpdating?: boolean;
  onAddApplication?: OpenAddApplication;
  onReorder: (result: ReorderResult) => void;
  onSelectApplication?: SelectJobApplication;
};

<KanbanColumn
  applications={columnApplications}
  isAddDisabled={isAddDisabled}
  isDisabled={isUpdating}
  label={label}
  onAddApplication={status === "saved" ? onAddApplication : undefined}
  onSelectApplication={onSelectApplication}
  status={status}
/>
```

In `KanbanColumn.tsx`, accept the callback and replace only the empty Saved state with this semantic button:

```tsx
{applications.length === 0 && status === "saved" && onAddApplication ? (
  <button
    type="button"
    className="group grid min-h-24 w-full place-items-center rounded-lg border border-dashed border-primary/45 bg-primary/[0.03] p-4 text-center text-sm text-muted transition-[background-color,border-color,color] hover:border-primary/80 hover:bg-primary/[0.08] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
    disabled={isAddDisabled}
    onClick={(event) => onAddApplication(event.currentTarget)}
  >
    <span className="flex flex-col items-center gap-2">
      <span aria-hidden="true" className="text-2xl leading-none text-primary">+</span>
      <span>Add application</span>
    </span>
  </button>
) : applications.length === 0 ? (
  <p className="grid min-h-24 place-items-center rounded-lg border border-dashed border-line bg-canvas/45 p-4 text-center text-sm text-muted">
    No applications yet
  </p>
) : (
  applications.map((application) => (
    <JobApplicationCard
      key={application.id}
      application={application}
      isDisabled={isDisabled}
      onSelect={onSelectApplication}
    />
  ))
)}
```

In `KanbanBoardPage.tsx`, reuse the existing opener-aware callback:

```tsx
<KanbanBoard
  applications={applications}
  isAddDisabled={createApplication.isPending}
  isUpdating={reorderApplications.isPending}
  onAddApplication={handleOpenAddApplication}
  onReorder={handleReorder}
  onSelectApplication={handleSelectApplication}
/>
```

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```powershell
npx.cmd vitest run src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: both files pass with zero failures and no React warnings.

- [ ] **Step 7: Run repository verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
git diff --check
```

Expected: the focused feature tests, ESLint, build, and diff check pass. If the existing `MonthInterviewCalendar` hover-versus-click test remains red, report it separately without changing calendar behavior in this task.

- [ ] **Step 8: Verify the user flow in the browser**

On `http://localhost:5173/`, verify:

1. Saved has no cards and renders the dashed `Add application` button with a plus icon.
2. Other empty columns still show `No applications yet` and are not clickable.
3. Clicking the Saved button opens the existing modal with Status set to Saved.
4. Cancel closes the modal and returns keyboard focus to the Saved empty-state button.
5. Existing card drag handles and drop targets still work.

- [ ] **Step 9: Commit the focused implementation**

```powershell
git add -- src/components/organisms/KanbanBoard/KanbanColumn.tsx src/components/organisms/KanbanBoard/KanbanBoard.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx docs/superpowers/plans/2026-08-14-saved-empty-state-add.md
git commit -m "feat: add application from saved empty state"
```
