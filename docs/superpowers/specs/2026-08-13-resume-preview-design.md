# Resume Preview Design

## Goal

Let a user open the resume linked to an application without leaving its detail drawer or exposing private Storage objects.

## User Experience

When a card has a linked resume, the detail drawer shows an `Open resume` action beneath the Resume picker. Selecting it opens the file in a new browser tab. PDFs use the browser's native preview. Word documents use the browser's normal download or associated viewer behavior.

When no resume is linked, no open action is shown. Opening a resume never changes the application record or resume selection. If the Storage URL request fails, the drawer remains open and shows an actionable error beside the control; the user can select the action again to retry.

## Data Flow and Security

The drawer identifies the selected resume from the already-loaded `Resume[]` list. A focused hook creates a short-lived Supabase Storage signed URL for that resume's private `file_path`, using the existing `resumes` bucket. The click immediately opens a blank tab so browser popup protection recognizes the direct user action. When the signed URL request succeeds, that tab navigates to the URL. On failure, the blank tab is closed. The URL is never persisted to the database or cached as application data.

Storage RLS remains the authorization boundary: the current user's browser can only sign a URL for a file their existing Storage policy permits. The component treats a missing selected record as unavailable and does not show an open action.

## Components

- Add `useOpenResume()` to the existing resume hook module. It opens a blank tab immediately, sets its `opener` to `null`, then requests a signed URL and navigates that isolated tab.
- Extend `JobApplicationDetailDrawer` with the open action, pending feedback, and retryable failure message.
- `KanbanBoardPage` continues to query the user's resumes once and supplies them to the drawer; no route, schema, or picker behavior changes.

## Validation

Tests cover: no action without a linked resume; action for a linked resume; signed URL creation with the exact private path; opening the returned URL in a separate tab; disabled/pending feedback during the request; and a visible retryable error on failure. Existing picker, save, delete, and page tests remain green.

## Non-goals

- No inline document preview.
- No public bucket or public URLs.
- No changes to resume uploads, the Resume Library, or job-application schema.
