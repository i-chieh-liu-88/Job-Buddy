# Resume Picker Design

## Goal

Replace the temporary hidden `resume_id` form value in the job application detail drawer with an accessible picker backed by the signed-in user's private Resume Library.

## User Experience

The detail drawer shows a `Resume` field below Notes. Its native select contains `No resume linked` as the first choice followed by the user's uploaded resume labels. Selecting a value updates only local form state; pressing Save changes persists `resume_id`. Selecting the empty option unlinks the current resume.

The create-application dialog remains unchanged in this phase: newly created cards have no linked resume. Resume preview and download remain phase four.

## Data Flow

`JobApplicationDetailDrawer` receives the current user's `Resume[]` plus the state of `useResumes()`. It initializes the select from `application.resume_id`, maps the empty choice to `null`, and includes the selected ID in its existing Zod-validated `UpdateJobApplicationInput` request.

The drawer does not trust arbitrary IDs: the deployed `validate_job_application_resume_owner` trigger remains the final database enforcement. While the resume query loads, the select is disabled and labelled as loading. On query failure, the drawer preserves the existing `resume_id` and presents a clear error without allowing accidental unlinking.

## Components

- Extend `JobApplicationFormFields` with optional resume-picker props so only the detail drawer renders it.
- Extend `JobApplicationDetailDrawer` with resumes/query state props.
- Connect `KanbanBoardPage` to `useResumes()` and pass results to the selected drawer.

## Validation

Tests cover an unlinked card, a pre-linked card, choosing a resume, choosing No resume linked, loading/failed query protection, and the exact save payload. Existing create-form tests assert that no picker is rendered there.

## Non-goals

- No resume picker on new applications.
- No preview/open action or signed URL generation.
- No new schema migration.
