# Interview Round Management Design

## Goal

Let a user manage multiple scheduled interview rounds for a job application from its existing detail drawer, without coupling interview changes to unsaved application-field edits.

## User Experience

The detail drawer adds an `Interview rounds` section below the application fields. It lists every saved round in scheduled-time order with its label, local date/time, and optional location/link. Each row has Edit and Delete actions. Delete requires an inline confirmation before removal.

`Add interview round` opens a compact inline form. The form requires Round label and date/time, and offers optional Location or link and Notes. Saving a new or edited round closes only that form and refreshes the list. The application’s existing Save changes button remains responsible only for application fields.

Loading, empty, and query-error states appear inside the section. Create, update, and delete errors leave the form/list in place with a retryable message. No interview action closes the detail drawer or overwrites the application form draft.

## Data Flow

Add `Interview` types and hooks in `useInterviews.ts`:

- `useInterviewsForApplication(jobApplicationId)` reads rounds ordered by `scheduled_at`.
- `useCreateInterview()`, `useUpdateInterview()`, and `useDeleteInterview()` use the current Clerk `userId` and invalidate only that application’s interview query after success.

The drawer receives the selected application ID, while a new `InterviewRounds` organism owns list, draft, and mutation UI state. It serializes a `datetime-local` control as `new Date(localValue).toISOString()` for the `timestamptz` column. Dates displayed in the list use the browser’s local time zone.

## Validation and Safety

Client validation rejects blank/whitespace round labels and missing date/time before a mutation. The database remains authoritative through the deployed interviews RLS policies and ownership trigger. Delete uses an explicit confirmation state. Query and mutation errors retain visible data or draft state instead of resetting it.

## Components

- `src/types/database.ts`: `Interview`, insert, and update types; database table mapping.
- `src/hooks/useInterviews.ts`: application-scoped query and CRUD hooks.
- `src/components/organisms/InterviewRounds/InterviewRounds.tsx`: add/edit/delete presentation and state, using a focused `InterviewRoundForm` molecule if it reduces complexity.
- `JobApplicationDetailDrawer`: renders the organism and does not own interview mutation state.

## Testing

Tests cover query/mutation payloads and scoped invalidation; empty/loading/error states; validation; add, edit, and delete confirmation flows; local datetime to ISO serialization; and preservation of the application draft while interview actions occur.

## Non-goals

- No calendar route, calendar event detail, or upcoming widget.
- No external calendar sync, reminders, or notifications.
- No automatic status transition when an interview is created.
