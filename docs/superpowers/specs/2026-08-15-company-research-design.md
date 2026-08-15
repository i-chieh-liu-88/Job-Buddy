# Company Research Design

## Goal

Add a dedicated, collapsible company-research area to each job application drawer. Research is independent from the general application `notes` field and has its own save lifecycle. Interviewer information is a repeatable list belonging to the application.

## Data Model

Create `public.company_research` with:

- `id uuid primary key default gen_random_uuid()`
- `user_id text not null`
- `job_application_id uuid not null references public.job_applications(id) on delete cascade`
- `culture_notes text nullable`
- `salary_min numeric nullable`
- `salary_max numeric nullable`
- `salary_currency text nullable`
- `salary_source text nullable`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `unique(job_application_id)`

Create `public.interviewers` with:

- `id uuid primary key default gen_random_uuid()`
- `user_id text not null`
- `job_application_id uuid not null references public.job_applications(id) on delete cascade`
- `name text not null`
- `role text nullable`
- `linkedin_url text nullable`
- `notes text nullable`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Both tables index `(user_id, job_application_id)`. Research salary values must be non-negative, and when both bounds are present `salary_min <= salary_max`. A database check constraint and the UI validation restrict currency to `EUR`, `USD`, `GBP`, `CHF`, `CAD`, or `AUD` in this phase.

## Ownership and RLS

Both tables duplicate the Clerk subject in `user_id`, matching the existing ownership pattern. Enable RLS before creating policies. Select, insert, update, and delete policies for `authenticated` require `(select auth.jwt() ->> 'sub') = user_id`.

A validation trigger for inserts and changes to `user_id` or `job_application_id` verifies that the referenced application exists and has the same owner. This prevents attaching research or an interviewer to another user's application. Application deletion cascades only its own research and interviewers.

## UI and Interaction

Place a `Company Research` section in the application detail drawer after the main application fields and before Interview rounds. It is a semantic disclosure control with keyboard support and an accessible expanded state.

- Empty research defaults to collapsed; any culture note, salary value, or interviewer causes the initial state to be expanded.
- The user's manual expand/collapse choice is retained for the current drawer session and is recalculated when another application is opened.
- Research fields are culture notes, salary min/max, fixed currency select, and source/note.
- The section has an independent `SAVE RESEARCH` action. It upserts the one research row and does not depend on the drawer's application Save/Cancel controls.
- A blank section does not create a row; clearing all fields and saving deletes the existing research row.
- Each interviewer is independently added, edited, saved, cancelled, or deleted. Name is required; LinkedIn, when present, must be an `http` or `https` URL. Delete requires confirmation.
- Only the active interviewer mutation is disabled while pending. Failed mutations preserve the entered draft and show an inline error.

## Data Flow

Use TanStack Query hooks `useCompanyResearch(applicationId)`, `useUpsertCompanyResearch()`, `useInterviewers(applicationId)`, `useCreateInterviewer()`, `useUpdateInterviewer()`, and `useDeleteInterviewer()`.

Research and interviewer queries load independently so a failure in either does not block the application drawer. Successful mutations invalidate only the relevant application-scoped query keys; they do not refetch applications, resumes, or calendar data. Closing the drawer discards unsaved local drafts while persisted research remains available on the next open.

## Validation, Accessibility, and Testing

Use Zod for salary bounds, supported currency, required interviewer name, and LinkedIn URL validation. Test schema constraints, cascade behavior, RLS, hook payloads and invalidation, smart disclosure defaults, independent saves, interviewer CRUD, pending/error states, keyboard disclosure behavior, and regression of application Save/Cancel, resume picker, and interview-round flows.

## Non-goals

- No company-wide research shared across applications.
- No automatic Glassdoor, Levels.fyi, or web scraping integration.
- No interviewer association to a specific interview round in this phase; interviewers belong to the application.
- No analytics based on salary or culture notes.
