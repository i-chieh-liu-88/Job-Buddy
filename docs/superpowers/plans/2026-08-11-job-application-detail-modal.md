# Job Application Detail Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users open a Kanban card, edit all application details, save or cancel, and delete only after inline confirmation.

**Architecture:** Separate each card's open action from its dnd-kit drag activator. Add a native-dialog organism that owns draft and validation state, while `KanbanBoardPage` owns selection and connects the existing TanStack Query update/delete mutations.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, dnd-kit, Tailwind CSS, Vitest, Testing Library

## Global Constraints

- Work directly on the user-approved `dev` branch.
- Do not add dependencies or modify Clerk, Supabase client configuration, migrations, environment files, or generated routes.
- Preserve existing drag ordering, optimistic reorder, RLS, authentication, and development diagnostics.
- Use the existing `JobApplication`, `JobApplicationStatus`, and `UpdateJobApplicationInput` types.
- Empty optional values become `null`; company and position are required and trimmed.
- Update/delete failures keep the dialog open; successful operations close it.
- A status-edited card moves to the end of its destination column.

---

### Task 1: Separate card selection from dragging

**Files:**
- Modify: `src/components/molecules/JobApplicationCard/JobApplicationCard.tsx`
- Modify: `src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanColumn.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.test.tsx`

**Interfaces:**
- `JobApplicationCard` consumes `onSelect: (application: JobApplication) => void`.
- `KanbanColumn` consumes `onSelectApplication: (application: JobApplication) => void`.
- `KanbanBoard` consumes `onSelectApplication: (application: JobApplication) => void`.
- The card content button calls selection; the drag-handle button alone receives dnd-kit attributes/listeners and `setActivatorNodeRef`.

- [ ] **Step 1: Write failing card interaction tests**

Mock `useSortable` in `JobApplicationCard.test.tsx` so the test can inspect the activator and click behavior:

```tsx
const { listeners, setActivatorNodeRef } = vi.hoisted(() => ({
  listeners: { onPointerDown: vi.fn() },
  setActivatorNodeRef: vi.fn(),
}));

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: { "aria-describedby": "sortable-description" },
    isDragging: false,
    listeners,
    setActivatorNodeRef,
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  }),
}));
```

Add a test using `userEvent.setup()` that renders the real `JobApplicationCard`, clicks the button named `Open Frontend Engineer at Acme`, expects `onSelect(application)`, and asserts that `Drag Frontend Engineer at Acme` exists and received the activator ref.

- [ ] **Step 2: Run the card test and verify RED**

Run:

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx
```

Expected: FAIL because `JobApplicationCard` does not accept `onSelect` and has no separate open or drag controls.

- [ ] **Step 3: Implement separate open and drag controls**

Extend the card props and destructure `setActivatorNodeRef` from `useSortable`:

```tsx
type JobApplicationCardProps = {
  application: JobApplication;
  isDisabled?: boolean;
  onSelect: (application: JobApplication) => void;
};
```

Keep the sortable node on `<article>`, remove listeners/attributes from the article, and render two sibling buttons:

```tsx
<article ref={setNodeRef} style={dragStyle} className={cardClassName}>
  <button
    type="button"
    className="min-w-0 flex-1 p-4 text-left"
    aria-label={`Open ${application.position} at ${application.company}`}
    disabled={isDisabled}
    onClick={() => onSelect(application)}
  >
    <JobApplicationCardContent application={application} />
  </button>
  <button
    ref={setActivatorNodeRef}
    type="button"
    className="m-2 shrink-0 cursor-grab rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
    aria-label={`Drag ${application.position} at ${application.company}`}
    disabled={isDisabled}
    {...attributes}
    {...listeners}
  >
    <span aria-hidden="true">⋮⋮</span>
  </button>
</article>
```

Retain the preview as a non-interactive article. Update card layout classes from a padded article to `flex items-center overflow-hidden` so the content button owns its padding.

- [ ] **Step 4: Propagate selection through column and board**

Add the required callback to `KanbanColumnProps` and pass it to every card:

```tsx
onSelectApplication: (application: JobApplication) => void;

<JobApplicationCard
  application={application}
  isDisabled={isDisabled}
  onSelect={onSelectApplication}
/>
```

Add the same callback to `KanbanBoardProps`, destructure it, and pass it into each `KanbanColumn`.

- [ ] **Step 5: Add and run board selection coverage**

Update existing board renders to include `onSelectApplication={vi.fn()}`. Add a test that clicks `Open Frontend Engineer at Acme` and expects the board callback to receive `applications[0]`.

Run:

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

```powershell
git add src/components/molecules/JobApplicationCard/JobApplicationCard.tsx src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx src/components/organisms/KanbanBoard/KanbanColumn.tsx src/components/organisms/KanbanBoard/KanbanBoard.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx
git commit -m "feat: separate card selection and drag controls"
```

---

### Task 2: Build the detail dialog organism

**Files:**
- Create: `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.tsx`
- Create: `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx`
- Modify: `src/test/setup.ts`

**Interfaces:**
- `onSave(input: UpdateJobApplicationInput): Promise<unknown>` resolves on success and rejects on failure.
- `onDelete(id: string): Promise<unknown>` resolves on success and rejects on failure.
- `onClose(): void` runs from the native dialog close event.
- Boolean props: `isSaving`, `isDeleting`, `hasSaveError`, and `hasDeleteError`.

- [ ] **Step 1: Add a minimal dialog test polyfill**

In `src/test/setup.ts`, define missing jsdom methods without replacing native implementations:

```tsx
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
}

if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
```

- [ ] **Step 2: Write failing prefill and cancel tests**

Create the modal test with a complete application fixture. Render with resolved `onSave`/`onDelete` mocks and assert:

```tsx
expect(screen.getByRole("dialog", { name: "Edit Frontend Engineer" })).toBeVisible();
expect(screen.getByLabelText("Company")).toHaveValue("Acme");
expect(screen.getByLabelText("Position")).toHaveValue("Frontend Engineer");
expect(screen.getByLabelText("Job URL")).toHaveValue("https://acme.example/jobs/1");
expect(screen.getByLabelText("Status")).toHaveValue("applied");
expect(screen.getByLabelText("Applied date")).toHaveValue("2026-08-10");
expect(screen.getByLabelText("Notes")).toHaveValue("Follow up next week");
expect(screen.getByLabelText("Resume version")).toHaveValue("frontend-v2");
```

Click Cancel and expect `onClose` but no save/delete calls. Dispatch `fireEvent.cancel(dialog)` in a separate test and assert the same behavior.

- [ ] **Step 3: Run modal tests and verify RED**

```powershell
npx.cmd vitest run src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
```

Expected: FAIL because the organism does not exist.

- [ ] **Step 4: Implement dialog lifecycle and labeled fields**

Create the component with this prop contract:

```tsx
type JobApplicationDetailModalProps = {
  application: JobApplication;
  hasDeleteError: boolean;
  hasSaveError: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<unknown>;
  onSave: (input: UpdateJobApplicationInput) => Promise<unknown>;
};
```

Initialize local strings from the application, call `dialogRef.current?.showModal()` in `useEffect`, and implement:

```tsx
function requestClose() {
  dialogRef.current?.close();
}

function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
  event.preventDefault();
  if (!isBusy) requestClose();
}
```

Render `<dialog aria-labelledby="application-detail-title" aria-describedby="application-detail-description" onCancel={handleCancel} onClose={onClose}>`. Use a form with `method="dialog"` prevented by React submit handling. Label every input, set `autoFocus` on Company, and render the five exact status options. Keep native form validation enabled. Mark Company and Position `required`, use their `onInvalid` handlers to set the same field-level errors, and clear each error from its `onChange`; this preserves native `type="url"` and date validation.

- [ ] **Step 5: Write failing validation and normalization tests**

Add tests that:

- Clear Company and Position, submit, expect `Company is required.` and `Position is required.`, and expect no save call.
- Fill required fields with surrounding spaces; clear URL, date, and resume; set Notes to whitespace; choose Interview; submit; expect:

```tsx
expect(onSave).toHaveBeenCalledWith({
  id: application.id,
  company: "Acme Updated",
  position: "Senior Engineer",
  job_url: null,
  status: "interview",
  applied_date: null,
  notes: null,
  resume_version: null,
});
```

The dialog closes after the resolved promise.

- [ ] **Step 6: Implement validation and save normalization**

Use page-local helpers inside the modal file:

```tsx
function optionalTrimmed(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNotes(value: string) {
  return value.trim().length > 0 ? value : null;
}
```

On submit, validate trimmed company/position, construct the exact update object, then:

```tsx
try {
  await onSave(input);
  requestClose();
} catch {
  // Mutation state supplies the friendly error while preserving the draft.
}
```

Disable fields and actions while `isSaving || isDeleting`. Render `The application could not be saved. Please try again.` when `hasSaveError` is true.

Add a rejected-save test that rerenders with `hasSaveError={true}`, verifies the friendly save error, and verifies the edited Company draft remains present.

- [ ] **Step 7: Write failing two-step delete tests**

Click Delete and assert no mutation occurred. Assert text naming Acme plus Cancel delete and Confirm delete controls. Cancel delete returns to the initial Delete button. Confirm delete calls `onDelete(application.id)` and closes after resolution. A rejected delete promise with `hasDeleteError` rerendered keeps the dialog open and shows `The application could not be deleted. Please try again.`.

- [ ] **Step 8: Implement inline delete confirmation**

Add `isConfirmingDelete` state. The initial Delete button only sets it true. Confirmation Cancel sets it false. Confirm calls:

```tsx
try {
  await onDelete(application.id);
  requestClose();
} catch {
  // Mutation state supplies the friendly error while preserving the dialog.
}
```

- [ ] **Step 9: Run focused modal tests and commit Task 2**

```powershell
npx.cmd vitest run src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
git add src/test/setup.ts src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
git commit -m "feat: add job application detail modal"
```

Expected: all modal tests PASS before commit.

---

### Task 3: Connect page selection, mutations, and destination ordering

**Files:**
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**
- The page passes `onSelectApplication={handleSelectApplication}` to `KanbanBoard`.
- The page renders `JobApplicationDetailModal` keyed by selected ID.
- `handleSave(input: UpdateJobApplicationInput)` returns the update mutation promise and adds destination `order_index` only when status changes.

- [ ] **Step 1: Expand hook mocks and add a page integration fixture**

Hoist `updateMutateAsync`, `deleteMutateAsync`, `updateReset`, `deleteReset`, `useUpdateJobApplicationMock`, and `useDeleteJobApplicationMock`. Extend the hooks mock:

```tsx
useUpdateJobApplication: useUpdateJobApplicationMock,
useDeleteJobApplication: useDeleteJobApplicationMock,
```

Reset the mocks before each test, resolve both async mutations by default, and configure the hook mocks to return the four fields shown below. Individual error tests can replace one return value and rerender the page.

```tsx
useUpdateJobApplicationMock.mockReturnValue({
  isError: false,
  isPending: false,
  mutateAsync: updateMutateAsync,
  reset: updateReset,
});
useDeleteJobApplicationMock.mockReturnValue({
  isError: false,
  isPending: false,
  mutateAsync: deleteMutateAsync,
  reset: deleteReset,
});
```

Add two applications, including one in Interview with `order_index: 2_000`, to the query result for integration tests.

- [ ] **Step 2: Write the failing open/save/order test**

Using `userEvent`, click `Open Frontend Engineer at Acme`, verify the dialog opens, change Status to Interview, click Save changes, and assert:

```tsx
expect(updateMutateAsync).toHaveBeenCalledWith(
  expect.objectContaining({
    id: "application-1",
    status: "interview",
    order_index: 3_000,
  }),
);
expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
```

- [ ] **Step 3: Run the page test and verify RED**

```powershell
npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: FAIL because the page does not manage selection or render the modal.

- [ ] **Step 4: Implement selection and mutation wiring**

Import `useState`, `JobApplication`, `UpdateJobApplicationInput`, the modal, and both hooks. Create:

```tsx
const [selectedApplication, setSelectedApplication] =
  useState<JobApplication | null>(null);
const updateApplication = useUpdateJobApplication();
const deleteApplication = useDeleteJobApplication();

function handleSelectApplication(application: JobApplication) {
  updateApplication.reset();
  deleteApplication.reset();
  setSelectedApplication(application);
}

function handleCloseDetails() {
  updateApplication.reset();
  deleteApplication.reset();
  setSelectedApplication(null);
}
```

For saving, compare the selected and submitted status. If changed, calculate:

```tsx
const destinationOrderIndexes = (applicationsQuery.data ?? [])
  .filter(({ id, status }) => id !== input.id && status === input.status)
  .map(({ order_index }) => order_index);
const order_index = Math.max(0, ...destinationOrderIndexes) + 1_000;
```

Then return `updateApplication.mutateAsync({ ...input, order_index })`. When status is unchanged, return `mutateAsync(input)` without changing order.

Render the modal after the board when selected, passing mutation pending/error flags, `handleCloseDetails`, `handleSave`, and `deleteApplication.mutateAsync`.

- [ ] **Step 5: Add cancel, same-status, delete, and error integration coverage**

Add page tests that verify:

- Cancel closes without update/delete calls and invokes both mutation resets.
- Saving without a status change does not add or overwrite `order_index`.
- Confirm delete calls `deleteMutateAsync("application-1")` and closes.
- A rejected update leaves the dialog visible; rerendered `isError: true` state shows the save error.

- [ ] **Step 6: Run focused feature tests**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: all focused tests PASS.

- [ ] **Step 7: Run full verification**

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
```

Expected: every command exits successfully with no test failures, lint errors, or TypeScript/build errors.

- [ ] **Step 8: Verify the browser flow**

Run the Vite app and verify at desktop and narrow mobile width:

1. Open a card using its content control.
2. Confirm all fields are prefilled and Company is focused.
3. Edit and save; confirm the modal closes and the card updates.
4. Change status; confirm the card appears last in the destination column.
5. Cancel a draft and confirm no changes persist.
6. Confirm Delete reaches the inline second action. Only confirm deletion when using a disposable test application; otherwise rely on the automated mutation test and cancel the confirmation.
7. Confirm the drag handle still reorders cards without opening the modal.
8. Confirm `Escape` closes, backdrop click does not, and focus returns to the opening card.

- [ ] **Step 9: Review scope and commit Task 3**

```powershell
git diff --check
git status --short
git add src/pages/KanbanBoardPage/KanbanBoardPage.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git commit -m "feat: connect application detail interactions"
```

Expected: implementation commits contain only the files named in this plan. Generated routes, environment files, migrations, authentication configuration, and dependencies remain unchanged.
