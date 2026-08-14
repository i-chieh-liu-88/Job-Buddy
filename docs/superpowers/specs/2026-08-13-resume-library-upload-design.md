# Resume Library Upload Design

## Goal

Provide a private, personal resume library at `/resumes` where an authenticated user can upload, label, view, and delete their PDF, DOC, or DOCX resume files. This phase deliberately stops before selecting or previewing a resume from a job application.

## User Experience

The Workspace sidebar receives a new `Resumes` destination. Its page has an `Upload resume` action, an empty state when no records exist, and a compact list of uploaded resumes.

The upload modal asks for a user-controlled label and a local file. It accepts `application/pdf`, Microsoft Word `.doc`, and `.docx` files. The selected file's original name, format, size, and upload date appear in the resulting list.

Each row has a Delete action with confirmation. Removing a resume removes both the Storage object and its metadata row. The deployed `on delete set null` foreign key unlinks any job applications automatically. A non-destructive follow-up migration adds `file_size bigint not null default 0` to the already deployed `resumes` table, so new uploads can display their byte size reliably.

## Data Flow

`useResumes()` lists the authenticated user's `resumes` metadata records, newest first. `useUploadResume()` generates a client UUID, normalizes the original filename, uploads to the private `resumes` bucket under `{userId}/{uuid}/{safeFilename}`, then inserts the matching metadata row. If metadata insertion fails after upload, it removes the just-uploaded object before surfacing the error.

`useDeleteResume()` first removes the private Storage object and then deletes the metadata row. If storage deletion fails, the metadata remains intact and the user sees an error. If metadata deletion fails after a successful object deletion, the UI reports an error and the user can retry after refresh; the phase does not attempt to reconstruct the original binary.

All mutations invalidate the per-user resumes query. The existing private bucket and RLS policies remain the authorization boundary; the browser uses the Clerk-authenticated Supabase client already used by job applications.

## Components and Routing

- `src/hooks/useResumes.ts`: query keys plus list, upload, and delete mutations.
- `src/components/organisms/ResumeLibrary/ResumeLibrary.tsx`: page content, list, empty/error/loading states, upload entry point, and delete confirmation.
- `src/components/organisms/ResumeUploadModal/ResumeUploadModal.tsx`: accessible label/file form with validation and pending state.
- `src/pages/ResumeLibraryPage/ResumeLibraryPage.tsx`: Clerk-aware page connector that passes mutations to the library organism.
- `src/routes/resumes.tsx`: file-based TanStack route.
- `ApplicationNavigation`: add the normal, responsive `Resumes` destination.

## Validation and Failure Handling

- Label is trimmed and required.
- File is required, limited to PDF/DOC/DOCX, and limited to 10 MB.
- Upload and delete actions disable their related controls while pending.
- The list shows clear query/mutation errors and preserves successful rows.
- File names are normalized to a conservative storage-safe name while keeping a non-empty fallback of `resume`.

## Non-goals

- No resume picker in job application forms; that is phase three.
- No preview or signed URL generation; that is phase four.
- No renaming an uploaded resume after creation.
- No bulk upload or resume analytics.

## Validation

Automated tests cover file/label validation, storage path creation, compensating cleanup after metadata insertion fails, list/empty states, route/sidebar navigation, and delete confirmation. Local lint and production build verify the TypeScript and UI integration. Manual testing verifies that a real signed-in user can upload and delete an allowed file in Supabase.
