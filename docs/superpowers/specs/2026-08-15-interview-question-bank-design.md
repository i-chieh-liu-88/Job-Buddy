# Interview Question Bank Design

## Goal

Allow questions asked during an interview round to be recorded in the application drawer and reviewed later in a global, searchable Question Bank.

## Data Model

Create `public.interview_questions` with:

- `id uuid primary key default gen_random_uuid()`
- `user_id text not null`
- `interview_id uuid not null references public.interviews(id) on delete cascade`
- `question_text text not null`
- `my_answer_notes text nullable`
- `tags text[] not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Question text must contain non-whitespace content. Tags are normalized by the client and validation layer: trim whitespace, lowercase, remove blanks, and deduplicate. Add indexes on `(user_id, interview_id)` and a GIN index on `tags`.

## Ownership and RLS

Duplicate the Clerk subject in `user_id` for direct, readable RLS. Enable RLS and require `(select auth.jwt() ->> 'sub') = user_id` for select, insert, update, and delete policies.

A validation trigger verifies that `interview_id` belongs to an interview whose job application has the same `user_id`. This prevents cross-user attachment through a tampered interview ID. Deleting an interview cascades its questions.

## Interview Round UI

Each Interview round in the application drawer gets a `Questions asked` subsection. It displays an empty state and `ADD QUESTION` when no questions exist, or a count and compact list when questions have been logged.

Every question has independent CRUD. The editor contains required question text, optional answer notes, and a free-form tag input with suggestions from previously used tags. Enter or comma creates a chip. Save and cancel apply to one question only; delete requires confirmation. The interview ID comes from the current round and cannot be changed in the editor.

Question mutations disable only the active item's controls, preserve drafts on error, and keep the drawer and round expanded after success. Question query invalidation is scoped to the current interview and the global bank.

## Global Question Bank Route

Add a `/questions` route and a `Question Bank` item to Application navigation. The page contains a debounced keyword field, multi-select tag filter, clear action, and result count.

- Keyword search matches `question_text` or `my_answer_notes`.
- Multiple selected tags match with OR semantics; no selected tags means all tags.
- Each result shows question text, answer-note summary, tags, company, position, round label, and interview date.
- `OPEN APPLICATION` navigates to Applications, opens the target application drawer, and expands or focuses the target interview round. It is click-only.
- Loading uses the existing Newton loader without visible caption. Empty, filtered-empty, and error states are distinct and retryable.
- On small screens, filters stack above a single-column result list.

## Data Flow and Querying

Use `useInterviewsForApplication`-scoped question hooks plus `useQuestionBank({ search, tags })`, `useQuestionBankTags()`, `useCreateInterviewQuestion()`, `useUpdateInterviewQuestion()`, and `useDeleteInterviewQuestion()`.

The global query joins `interview_questions` through `interviews` to `job_applications` so company, position, and round context always reflects current records. The initial implementation uses safe `ilike` predicates for keyword search and the tags GIN index for tag filtering. Debounce keyword input by approximately 250–300ms. Query keys include search and selected tags, and successful mutations invalidate only question-related keys.

## Validation, Accessibility, and Testing

Use Zod for non-empty question text and normalized tags. Test migration constraints, cascade behavior, RLS, tag entry and suggestions, independent round CRUD, mutation pending/error states, debounced search, OR filtering, empty/error states, responsive layout, and cross-page navigation into the correct application drawer and interview round. Preserve existing calendar, resume, application, and interview functionality.

## Non-goals

- No external interview question imports.
- No shared team question banks.
- No automatic answer generation or AI scoring.
- No separate tags table or tag administration page in this phase.
