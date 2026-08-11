# Add Job Application Form Design

## Goal

Allow a signed-in user with an empty or populated board to create a job application manually, including every editable application field, and place the new card at the end of its selected Kanban column.

## Scope

This phase adds the Add Application workflow and extracts shared Add/Edit form fields and validation. It does not include the broader visual styling pass, URL extraction, stats, reminders, or export features.

Existing Clerk authentication, Supabase RLS, drag-and-drop ordering, Card Detail Modal update/delete behavior, focus restoration, and development query diagnostics must continue to work.

## Entry Point and Ownership

Add a `+ Add Application` button to the right side of the page header, grouped with Clerk's `UserButton`.

`KanbanBoardPage` owns whether the Add modal is open and connects it to the existing `useCreateJobApplication()` mutation. The page passes current application data into its create handler so it can calculate the destination column order.

Opening captures the Add button as the dialog opener. Closing the native dialog clears Add modal state and explicitly restores focus to the same button.

## Shared Form Architecture

Extract a reusable `JobApplicationFormFields` molecule used by both `AddJobApplicationModal` and `JobApplicationDetailModal`.

The shared form exposes these fields:

- Company
- Position
- Job URL
- Status
- Applied Date
- Notes
- Resume Version

The molecule renders labels, inputs, field errors, invalid ARIA state, descriptions, disabled state, and refs needed to focus the first invalid field. It does not call Supabase mutations or own dialog lifecycle.

Add and Detail modal organisms continue to own their own draft state, submission lifecycle, pending/error messages, and close behavior. Detail retains its existing delete confirmation and post-close focus restoration.

## Zod Schema

Add `zod` as a runtime dependency. Create one shared `jobApplicationFormSchema` as the sole validation and normalization source for both Add and Edit forms.

The form holds raw string values. Submitting calls `schema.safeParse()` and consumes the parsed output only on success.

Schema behavior:

- `company`: trim surrounding whitespace; require at least one character.
- `position`: trim surrounding whitespace; require at least one character.
- `job_url`: convert an empty or whitespace-only string to `null`; otherwise trim and require a valid URL.
- `status`: accept only `saved`, `applied`, `interview`, `offer`, or `rejected`.
- `applied_date`: convert an empty string to `null`; otherwise require `YYYY-MM-DD` and a real calendar date.
- `notes`: convert an all-whitespace string to `null`; preserve the original text when non-empty.
- `resume_version`: convert an empty or whitespace-only string to `null`; otherwise trim.

Use `noValidate` on both forms so Zod consistently produces field errors instead of native constraint messages intercepting submission. Zod issues map to the first error for each field. The modal focuses the first invalid field in visual form order.

The existing field error copy remains concise, including `Company is required.`, `Position is required.`, `Enter a valid URL.`, and `Enter a valid date.`.

## Add Modal Behavior

Create `AddJobApplicationModal` as a native `<dialog>` organism consistent with the Detail modal.

Initial values:

- Company: empty
- Position: empty
- Job URL: empty
- Status: `saved`
- Applied Date: empty
- Notes: empty
- Resume Version: empty

The user may select any status. Applied Date remains optional and is never automatically populated from status.

Controls:

- Primary action: `Add application`
- Secondary action: `Cancel`
- Header close button

Cancel, close, and `Escape` discard the draft. Clicking the backdrop does not close the dialog. While create is pending, fields and close actions are disabled to prevent duplicate requests.

On create failure, the dialog and draft remain visible and show `The application could not be created. Please try again.` No raw Supabase error object, token, key, or request header is rendered.

On success, the dialog closes. TanStack Query invalidation from the existing create hook refreshes the board and the new card appears.

## Create Payload and Ordering

The page builds the create input from the parsed Zod output and adds an `order_index`.

For the selected status:

1. Read the current applications from `applicationsQuery.data ?? []`.
2. Collect `order_index` values for cards in that status.
3. Set the new order to `Math.max(0, ...columnOrderIndexes) + 1_000`.

An empty column therefore starts at `1_000`. The status defaults to `saved`, but the same ordering rule applies to every selectable status.

The create hook continues to add the signed-in Clerk `user_id` and invalidate the current user's application query.

## Accessibility

- The Add button has a clear accessible name.
- The dialog has an accessible title and description.
- Company receives initial focus.
- Zod errors use stable IDs, `aria-invalid`, and `aria-describedby`.
- The first invalid field receives focus after a failed submission.
- `Escape`, Cancel, and close discard the draft when not pending.
- Focus returns to `+ Add Application` after close.
- Pending and error states are announced without relying on color alone.

## Testing

Schema unit tests cover:

- Required company and position.
- Trimming required and optional values.
- Valid and invalid URLs.
- Valid, malformed, and impossible dates.
- The five accepted statuses and rejection of unknown values.
- Empty optional values becoming `null`.
- Non-empty notes preserving whitespace.

Component and page tests cover:

- Shared fields rendering and ARIA error linkage in both Add and Detail forms.
- Detail Modal regression tests remaining green after extraction.
- Opening Add from the header and Company receiving focus.
- Complete initial values, including Saved status and blank Applied Date.
- Successful creation with the parsed payload.
- Destination `order_index` for empty and populated columns.
- Closing and focus restoration after success or cancellation.
- Rejected create preserving the draft and showing the friendly error.
- Pending create disabling controls and preventing Escape closure.
- Existing Card Detail Modal, drag-and-drop, Clerk, RLS, and board tests remaining green.

The phase is complete only after focused tests, the full test suite, ESLint, the production build, and the signed-in browser flow pass.
