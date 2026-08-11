# Job Application Detail Modal Design

## Goal

Let a signed-in user open a Kanban card, edit every job application field, save changes, cancel without persisting, or delete the application after an explicit confirmation.

## Scope

This phase adds the card detail modal only. The add-application form and broader styling pass remain separate later phases. Existing drag-and-drop ordering, Clerk authentication, Supabase RLS, and query diagnostics must continue to work.

## Architecture and Data Flow

`KanbanBoardPage` owns the selected `JobApplication` and connects the modal to the existing `useUpdateJobApplication()` and `useDeleteJobApplication()` hooks. Selection flows through `KanbanBoard` and `KanbanColumn` to `JobApplicationCard` via an `onSelectApplication` callback.

Each card has two distinct controls:

- A primary content button opens the application details.
- A dedicated drag handle receives the dnd-kit activator listeners and attributes.

This separation prevents a completed drag from accidentally opening the modal and gives click, keyboard, and drag interactions distinct accessible targets.

Create `JobApplicationDetailModal` as a feature-level organism. It receives the selected application, update/delete pending and error states, and save/delete/close callbacks. It owns draft form state and inline delete-confirmation state. Unmounting the modal discards its draft.

The modal uses the native HTML `<dialog>` element. When mounted it calls `showModal()`. The native cancel event handles `Escape`; clicking the backdrop does not close it. The close flow calls `dialog.close()` first and clears the selected application from the dialog's close event, allowing the browser to restore focus to the card control that opened it. Closing also resets prior update and delete mutation errors so a later selection starts cleanly.

## Editable Fields

The form exposes every editable database field:

- `company`: required text.
- `position`: required text.
- `job_url`: optional URL.
- `status`: select containing `saved`, `applied`, `interview`, `offer`, and `rejected`.
- `applied_date`: optional date.
- `notes`: optional multiline text.
- `resume_version`: optional text.

`id`, `user_id`, `order_index`, `created_at`, and `updated_at` are not editable in the modal.

## Validation and Normalization

Company and position are trimmed before submission. A blank trimmed value shows a field-level error and does not call the update mutation.

Optional text and date fields convert an empty string to `null`. Non-empty optional text is trimmed except for notes, whose surrounding whitespace is preserved unless it is entirely empty. The browser's URL and date input validation remains active.

Saving calls the existing update mutation with the application ID and normalized editable fields. A successful mutation closes the modal; a failed mutation keeps the current draft visible and displays a friendly error.

If status changes, the page assigns the card an `order_index` after the current last card in the destination column. If status does not change, the existing `order_index` is preserved.

## Delete Flow

The initial Delete action does not mutate data. It reveals an inline confirmation area naming the company and offering Cancel and Confirm delete controls. Confirm delete calls the existing delete mutation with the application ID. Success closes the modal; failure keeps it open and displays a friendly error.

All form controls and destructive actions are disabled while either mutation is pending to prevent duplicate submissions.

## Accessibility and Interaction

- The dialog has an accessible title and description.
- Company receives initial focus when the dialog opens.
- `Escape`, Cancel, and the close button discard changes.
- Backdrop clicks do not close the dialog.
- Every form control has a visible label.
- The card content control opens with pointer, Enter, or Space.
- The drag handle has an application-specific accessible label and retains dnd-kit's keyboard drag behavior.
- The delete confirmation uses explicit text and controls rather than color alone.
- Focus returns to the opening card after the dialog closes.

## Error Handling

Update and delete failures are presented inside the dialog without exposing raw credentials, tokens, headers, or arbitrary serialized error objects. The user can revise and retry an update, cancel the delete confirmation, or close the dialog.

## Testing

Component and page tests cover:

- Selecting the correct application from a card.
- A separate accessible drag handle with dnd-kit activator behavior.
- Opening the dialog with all editable fields prefilled.
- Cancel and `Escape` without mutation calls.
- Required company and position validation.
- Normalization of empty optional values to `null` on save.
- Moving a status-edited card to the end of its destination column.
- Closing after a successful update.
- Two-step delete confirmation and closing after success.
- Keeping the dialog and draft open on update or delete errors.
- Existing drag-and-drop, authentication, and board tests remaining green.

The phase is complete only after focused tests, the full test suite, ESLint, the production build, and the affected browser flow pass.
