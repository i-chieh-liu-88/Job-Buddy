# Kanban Drag-and-Drop Design

## Scope

This phase adds sortable job-application cards, atomic persistence, optimistic movement, and rollback. It covers reordering within a column and moving between columns. Card modals, creation forms, and the full styling pass remain outside this phase.

## Interaction Model

Each card is a sortable item and each status column is a droppable container. A card can be dropped before or after another card in the same column, onto a card in another column, or into an empty column. Dropping outside the board makes no change. Dropping a card in its existing position is a no-op.

Pointer dragging uses a small activation distance to preserve card clicks for the upcoming detail modal. Keyboard dragging uses dnd-kit keyboard coordinates. A drag overlay displays the active card so layout remains stable while dragging.

## Ordering Rules

The client calculates the complete board result before persistence. Cards in every affected column receive normalized integer indices in increments of 1,000, starting at 1,000.

- A same-column reorder normalizes that column.
- A cross-column move removes the card from its source, inserts it at the target position, updates its status, and normalizes both source and destination columns.
- Only rows whose `status` or `order_index` changed are sent to the server.
- Existing sort ties use the current array order, which originates from the database query's `order_index` and `created_at` ordering.

A pure reorder utility owns these calculations. It returns the complete optimistic application array and the minimal list of changed rows. UI components do not calculate persistence payloads.

## Components

`KanbanBoard` owns the dnd-kit context, sensors, collision handling, drag overlay, and translation of a completed drag into a reorder request. It receives applications and a reorder callback through props.

`KanbanColumn` is extracted into its own component module and owns its droppable container plus sortable context. It renders an empty-column target when there are no cards.

`JobApplicationCard` switches from `useDraggable` to `useSortable`. It continues to receive a complete `JobApplication` and applies dnd-kit transform and transition values to its outer element.

`KanbanBoardPage` connects the board to the query and reorder mutation. It does not keep a duplicate local copy of server data; the TanStack Query cache is the optimistic source of truth.

## Persistence

A new `public.reorder_job_applications(jsonb)` Postgres function accepts a JSON array containing `id`, `status`, and `order_index`. The function:

1. Rejects unauthenticated requests.
2. Rejects malformed statuses or negative indices.
3. Confirms every supplied ID belongs to the JWT `sub` user.
4. Updates all supplied rows in one transaction.
5. Returns the updated rows.

Execution is granted only to the `authenticated` role. Ownership checks are explicit inside the function in addition to the table's RLS policies. A mismatch between supplied row count and owned row count raises an exception, so no partial update occurs.

The generated TypeScript database type is extended with the RPC signature. A `useReorderJobApplications()` hook calls the function.

## Optimistic Data Flow

When a valid drag ends:

1. The board calls the reorder mutation with the calculated optimistic array and changed-row payload.
2. `onMutate` cancels the current user's board query, snapshots its data, and writes the optimistic array to the cache immediately.
3. The RPC persists all changed rows atomically.
4. On error, `onError` restores the exact cache snapshot.
5. On settlement, the hook invalidates the current user's board query to reconcile with Supabase.

Only one reorder mutation is allowed in flight. Dragging is disabled while persistence is pending, preventing overlapping optimistic snapshots.

## Error Handling

RPC failures retain the existing page-level movement error message after rollback. Authentication failures, ownership mismatches, invalid data, and network errors all follow the same rollback path. No success notification is added in this phase because the immediate card movement is sufficient feedback.

## Testing

Pure utility tests cover:

- moving a card earlier and later within one column;
- moving a card into a populated column;
- moving a card into an empty column;
- normalization of the source and destination columns;
- minimal changed-row payloads;
- outside-board and same-position no-ops.

Hook tests use a real TanStack `QueryClient` with mocked Supabase transport to verify the observable cache behavior: immediate optimistic movement, exact rollback after rejection, and invalidation after settlement.

Component tests retain column/card grouping coverage and add sortable-context coverage where it provides observable behavior. SQL is reviewed for authentication, ownership-count validation, status validation, and transactional updates. The final verification commands are `npm.cmd run test:run`, `npm.cmd run lint`, and `npm.cmd run build`.

## Dependencies

Add `@dnd-kit/sortable` and `@dnd-kit/utilities`. Continue using the installed `@dnd-kit/core`, TanStack Query, Clerk, Supabase, React, TypeScript, and Tailwind CSS versions.
