# Kanban Drag-and-Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sortable same-column and cross-column card movement with atomic Supabase persistence, immediate optimistic UI, and exact rollback on failure.

**Architecture:** A pure reorder utility calculates the final board and minimal changed-row payload. The board maps dnd-kit card/column targets into that utility, while a TanStack Query mutation owns optimistic cache updates and calls one authenticated Postgres RPC that commits every row atomically.

**Tech Stack:** React 19, TypeScript 6, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, TanStack Query 5, Supabase Postgres/RPC, Vitest, Testing Library.

## Global Constraints

- Implement only drag-and-drop; do not add card detail, creation, deletion UI, or the full styling pass.
- Support reordering within a column and movement between all five status columns.
- Normalize every affected column to `order_index` values `1000, 2000, 3000, ...`.
- Persist all changed rows atomically and verify every row belongs to the Clerk user ID in JWT `sub`.
- Apply optimistic movement immediately, restore the exact cache snapshot on failure, and reconcile after settlement.
- Disable additional drags while a reorder mutation is pending.
- Follow the existing Atomic Design boundaries and do not edit `src/routeTree.gen.ts`.

---

## File Structure

- `src/components/organisms/KanbanBoard/reorderApplications.ts`: pure reorder calculation and payload generation.
- `src/components/organisms/KanbanBoard/reorderApplications.test.ts`: same-column, cross-column, empty-column, normalization, minimal-payload, and no-op tests.
- `src/components/organisms/KanbanBoard/KanbanColumn.tsx`: droppable column and sortable context.
- `src/components/organisms/KanbanBoard/KanbanBoard.tsx`: sensors, collision targets, drag overlay, and reorder dispatch.
- `src/components/molecules/JobApplicationCard/JobApplicationCard.tsx`: sortable card transform and optional overlay presentation.
- `src/hooks/useJobApplications.ts`: reorder mutation and optimistic cache lifecycle.
- `src/hooks/useJobApplications.test.tsx`: observable optimistic cache and rollback integration tests.
- `src/types/database.ts`: JSON and RPC types.
- `supabase/migrations/20260811010000_add_reorder_job_applications.sql`: authenticated atomic reorder function.

---

### Task 1: Pure Reorder Calculation

**Files:**
- Create: `src/components/organisms/KanbanBoard/reorderApplications.ts`
- Create: `src/components/organisms/KanbanBoard/reorderApplications.test.ts`

**Interfaces:**
- Consumes: `JobApplication[]`, active card ID, and over target ID (`application id` or `column:<status>`).
- Produces:

```ts
export type ReorderUpdate = Pick<
  JobApplication,
  "id" | "status" | "order_index"
>;

export type ReorderResult = {
  applications: JobApplication[];
  updates: ReorderUpdate[];
};

export function reorderApplications(
  applications: JobApplication[],
  activeId: string,
  overId: string,
): ReorderResult | null;
```

- [ ] **Step 1: Write failing same-column tests**

Create three saved cards with literal indices `1000`, `2000`, and `3000`. Assert moving the first card over the third returns `[second, third, first]`, retains `saved`, normalizes indices to `[1000, 2000, 3000]`, and includes only rows whose persisted fields changed. Add the inverse later-to-earlier case with hand-derived expected IDs and indices.

```ts
const result = reorderApplications(applications, "saved-1", "saved-3");
expect(result?.applications.filter(({ status }) => status === "saved").map(
  ({ id, order_index }) => [id, order_index],
)).toEqual([
  ["saved-2", 1000],
  ["saved-3", 2000],
  ["saved-1", 3000],
]);
expect(result?.updates).toEqual([
  { id: "saved-2", status: "saved", order_index: 1000 },
  { id: "saved-3", status: "saved", order_index: 2000 },
  { id: "saved-1", status: "saved", order_index: 3000 },
]);
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx.cmd vitest run src/components/organisms/KanbanBoard/reorderApplications.test.ts`

Expected: FAIL because `reorderApplications.ts` does not exist.

- [ ] **Step 3: Implement the minimum same-column algorithm**

Sort cards by `order_index`, locate the active and over indices, use an immutable array move, normalize the affected column with `ORDER_STEP = 1000`, merge it back into the full array, and compare each result against an original `Map` to construct `updates`.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `npx.cmd vitest run src/components/organisms/KanbanBoard/reorderApplications.test.ts`

Expected: PASS for both same-column directions.

- [ ] **Step 5: Write failing cross-column and no-op tests**

Assert these literal outcomes:

- moving `saved-1` over `interview-2` removes it from Saved, inserts it at index 1 in Interview, changes status to `interview`, and normalizes both columns;
- moving onto `column:offer` appends to an empty Offer column at index `1000`;
- unknown active IDs, unknown targets, and an active ID equal to the over ID return `null`;
- moving the final card onto its own column container returns `null` when normalized data would not change.

- [ ] **Step 6: Run the focused test and confirm RED**

Run: `npx.cmd vitest run src/components/organisms/KanbanBoard/reorderApplications.test.ts`

Expected: FAIL on cross-column insertion because the minimum implementation only handles one column.

- [ ] **Step 7: Implement cross-column calculation**

Infer target status from the over card or `column:<status>`. Remove the active card from its source. Insert at the over card's destination index, or append for a column target. Normalize both affected lists, replace only those lists in the full board, preserve untouched applications, and return `null` when `updates` is empty.

- [ ] **Step 8: Run tests and confirm GREEN**

Run: `npx.cmd vitest run src/components/organisms/KanbanBoard/reorderApplications.test.ts`

Expected: all reorder utility tests PASS.

- [ ] **Step 9: Commit when Git metadata is available**

```powershell
git add src/components/organisms/KanbanBoard/reorderApplications.ts src/components/organisms/KanbanBoard/reorderApplications.test.ts
git commit -m "feat: calculate kanban card reorders"
```

If this workspace remains outside a Git repository, record that the commit step was skipped.

---

### Task 2: Atomic Supabase Reorder RPC

**Files:**
- Create: `supabase/migrations/20260811010000_add_reorder_job_applications.sql`
- Modify: `src/types/database.ts`

**Interfaces:**
- Consumes RPC argument `p_updates` as a JSON array of `{ id, status, order_index }`.
- Produces `public.reorder_job_applications(p_updates jsonb) returns setof public.job_applications`.
- Produces TypeScript function metadata:

```ts
reorder_job_applications: {
  Args: { p_updates: Json };
  Returns: JobApplication[];
};
```

- [ ] **Step 1: Add the recursive Supabase JSON type**

Add the standard recursive `Json` union to `src/types/database.ts`, then declare the RPC under `Database["public"]["Functions"]`. Run `npm.cmd run build` and confirm it passes before the hook begins consuming the RPC.

- [ ] **Step 2: Add the authenticated SQL function**

Create a `security invoker` PL/pgSQL function with `set search_path = ''`. It must:

```sql
v_user_id := auth.jwt() ->> 'sub';
if v_user_id is null then
  raise exception 'Authentication required';
end if;

if jsonb_typeof(p_updates) <> 'array' or jsonb_array_length(p_updates) = 0 then
  raise exception 'Updates must be a non-empty array';
end if;
```

Parse with `jsonb_to_recordset`, reject duplicate IDs, reject statuses outside `saved|applied|interview|offer|rejected`, reject negative/null indices, and verify the count of matching `public.job_applications` rows owned by `v_user_id` equals the JSON array length. Raise before any update when validation fails.

Perform one `UPDATE ... FROM parsed_updates`, assigning `status` and `order_index`, and `RETURN QUERY` the updated rows. Revoke default execution and grant only to `authenticated`:

```sql
revoke all on function public.reorder_job_applications(jsonb) from public;
grant execute on function public.reorder_job_applications(jsonb) to authenticated;
```

- [ ] **Step 3: Verify SQL and TypeScript boundaries**

Run: `npm.cmd run build`

Expected: PASS. Manually inspect that all table/function names are schema-qualified, ownership count is checked before `UPDATE`, the function is not `security definer`, and only `authenticated` receives execute permission.

- [ ] **Step 4: Commit when Git metadata is available**

```powershell
git add supabase/migrations/20260811010000_add_reorder_job_applications.sql src/types/database.ts
git commit -m "feat: add atomic application reorder RPC"
```

---

### Task 3: Optimistic Reorder Mutation

**Files:**
- Modify: `src/hooks/useJobApplications.ts`
- Create: `src/hooks/useJobApplications.test.tsx`

**Interfaces:**
- Consumes:

```ts
export type ReorderJobApplicationsInput = {
  applications: JobApplication[];
  updates: ReorderUpdate[];
};
```

- Produces `useReorderJobApplications()` returning a TanStack mutation.

- [ ] **Step 1: Write a failing optimistic-cache test**

Render the hook with a real `QueryClientProvider`, a fixed Clerk `userId`, and a Supabase transport double only at the external RPC boundary. Seed `["job-applications", "user-1"]` with the original complete rows. Call `mutate` with a hand-built reordered array and deferred RPC promise. Assert the query cache equals the reordered array before resolving the RPC.

The production change caught by this test is a missing or incorrectly keyed `onMutate` cache write.

- [ ] **Step 2: Run the hook test and confirm RED**

Run: `npx.cmd vitest run src/hooks/useJobApplications.test.tsx`

Expected: FAIL because `useReorderJobApplications` is not exported.

- [ ] **Step 3: Implement the optimistic mutation**

Expose a shared `jobApplicationKeys.list(userId)` from the hook module. In `onMutate`, require a signed-in user, cancel that exact query, read `JobApplication[] | undefined`, then set `input.applications`. Return `{ previousApplications, queryKey }`.

The mutation function calls:

```ts
const { data, error } = await supabase.rpc("reorder_job_applications", {
  p_updates: input.updates,
});
if (error) throw error;
return data;
```

- [ ] **Step 4: Run the optimistic test and confirm GREEN**

Run: `npx.cmd vitest run src/hooks/useJobApplications.test.tsx`

Expected: optimistic cache test PASS while the RPC promise is unresolved.

- [ ] **Step 5: Write a failing rollback test**

Seed original rows, mutate with reordered rows, reject the deferred RPC, and assert the cache returns exactly to the original row objects and ordering. Also assert the query becomes invalidated after settlement through its observable stale state, not through an assertion on the mock.

The production change caught is a missing snapshot restoration or missing settlement reconciliation.

- [ ] **Step 6: Run the rollback test and confirm RED**

Run: `npx.cmd vitest run src/hooks/useJobApplications.test.tsx`

Expected: FAIL because `onError` and `onSettled` are not implemented.

- [ ] **Step 7: Implement rollback and reconciliation**

In `onError`, restore `context.previousApplications` at `context.queryKey`. In `onSettled`, invalidate `context?.queryKey` or the current signed-in user's list key. Keep the existing create/update/delete hooks unchanged.

- [ ] **Step 8: Run hook and existing tests**

Run: `npx.cmd vitest run src/hooks/useJobApplications.test.tsx src/components/organisms/KanbanBoard/reorderApplications.test.ts`

Expected: all focused tests PASS without unhandled rejection warnings.

- [ ] **Step 9: Commit when Git metadata is available**

```powershell
git add src/hooks/useJobApplications.ts src/hooks/useJobApplications.test.tsx
git commit -m "feat: optimistically persist card reorders"
```

---

### Task 4: Sortable Board Integration

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/organisms/KanbanBoard/KanbanColumn.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.tsx`
- Modify: `src/components/molecules/JobApplicationCard/JobApplicationCard.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.test.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`

**Interfaces:**
- `KanbanBoard` consumes `applications`, `isUpdating`, and `onReorder(result: ReorderResult)`.
- `KanbanColumn` consumes `status`, `label`, and ordered applications.
- `JobApplicationCard` consumes `application` and optional `isOverlay`.

- [ ] **Step 1: Install sortable dependencies**

Run: `npm.cmd install @dnd-kit/sortable @dnd-kit/utilities`

Expected: package manifests contain versions compatible with installed `@dnd-kit/core@^6.3.1` and audit reports zero vulnerabilities.

- [ ] **Step 2: Write failing board behavior tests**

Extend `KanbanBoard.test.tsx` so the wished-for props use `onReorder`. Test that cards retain accessible labels, all column counts render, and an empty column exposes its droppable region. Keep reorder mathematics in the pure utility tests rather than reproducing dnd-kit's own tests.

Run: `npx.cmd vitest run src/components/organisms/KanbanBoard/KanbanBoard.test.tsx`

Expected: FAIL because the board still expects `onMove` and cards are not sortable.

- [ ] **Step 3: Convert cards to sortable items**

Replace `useDraggable` with `useSortable({ id: application.id, disabled: isOverlay })`. Apply `CSS.Transform.toString(transform)` and `transition` from `@dnd-kit/utilities`. Preserve the pointer activation behavior, accessible label, and a visible dragging state. For overlays, render the same card content without registering another sortable node.

- [ ] **Step 4: Extract the sortable column**

Move column markup into `KanbanColumn.tsx`. Call `useDroppable({ id: `column:${status}` })` and wrap cards in:

```tsx
<SortableContext
  items={applications.map(({ id }) => id)}
  strategy={verticalListSortingStrategy}
>
  {applications.map((application) => (
    <JobApplicationCard key={application.id} application={application} />
  ))}
</SortableContext>
```

- [ ] **Step 5: Wire DndContext to the pure utility**

Use `PointerSensor` with distance `6` and `KeyboardSensor` with `sortableKeyboardCoordinates`. Track only `activeId` for the overlay. On drag end, clear `activeId`, return when there is no `over`, call `reorderApplications(applications, String(active.id), String(over.id))`, and call `onReorder` only for a non-null result. Use card and column droppables so populated, empty, and whitespace drops resolve correctly.

- [ ] **Step 6: Connect the optimistic hook**

In `KanbanBoardPage`, replace `useUpdateJobApplication()` with `useReorderJobApplications()`. Pass `reorderMutation.mutate` to `onReorder`, pass `reorderMutation.isPending` to disable concurrent dragging, and retain the existing rollback error copy.

- [ ] **Step 7: Run focused tests and confirm GREEN**

Run: `npx.cmd vitest run src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/components/organisms/KanbanBoard/reorderApplications.test.ts src/hooks/useJobApplications.test.tsx`

Expected: all board, reorder, and optimistic-cache tests PASS.

- [ ] **Step 8: Commit when Git metadata is available**

```powershell
git add package.json package-lock.json src/components src/pages/KanbanBoardPage/KanbanBoardPage.tsx
git commit -m "feat: add sortable kanban interactions"
```

---

### Task 5: Full Verification

**Files:**
- Verify all files changed in Tasks 1-4.

**Interfaces:**
- Consumes the complete drag-and-drop feature.
- Produces a verified review gate for manual user testing.

- [ ] **Step 1: Run all automated checks**

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
```

Expected: every test passes, ESLint reports zero errors, and Vite completes a production build.

- [ ] **Step 2: Inspect the final diff or changed-file set**

Confirm no modal, add form, delete UI, broad styling refactor, generated route-tree edit, environment change, or unrelated refactor entered the change set.

- [ ] **Step 3: Manual acceptance check when configured credentials are available**

Apply both Supabase migrations, start with `npm.cmd run dev`, and verify:

- moving a card within a populated column updates immediately and survives refresh;
- moving between populated columns normalizes both columns and survives refresh;
- moving into an empty column works;
- a forced RPC failure visibly rolls the card back and shows the movement error;
- a pending mutation prevents a second overlapping drag;
- pointer and keyboard dragging both work;
- horizontal board scrolling remains usable at mobile width.

- [ ] **Step 4: Report the review gate**

Name every changed file, all commands run, results, any skipped manual checks, and the requirement that the new Supabase migration be applied before testing persistence. Pause for user approval before starting the card detail modal.
