# Add Job Application Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user create a complete job application from the page header and append it to the end of the selected Kanban column.

**Architecture:** Add one shared Zod schema and one shared form-fields molecule for both Add and Detail workflows. A native-dialog Add organism owns its draft, validation, and create lifecycle; `KanbanBoardPage` owns open state, destination ordering, TanStack Query mutation wiring, and focus restoration.

**Tech Stack:** React 19, TypeScript, Vite, Zod 4, TanStack Query, Supabase, Clerk, Tailwind CSS, Vitest, Testing Library

## Global Constraints

- Work directly on the user-approved `dev` branch.
- Use test-driven development: add a failing behavior test, confirm RED for the intended reason, implement the smallest change, then confirm GREEN.
- Add only `zod` as a runtime dependency and keep `package-lock.json` synchronized.
- Do not modify Clerk configuration, Supabase client configuration, migrations, environment files, generated routes, or database contracts.
- Preserve existing drag ordering, optimistic reorder, Card Detail update/delete behavior, dialog focus restoration, RLS boundaries, authentication, and development query diagnostics.
- The shared Zod schema is the sole validation and normalization source for Add and Edit submissions; both forms use `noValidate`.
- Company and Position are trimmed and required. Empty optional fields become `null`; non-empty Notes retain their original whitespace.
- Every field error uses a stable ID, `aria-invalid`, and `aria-describedby`; submission focuses the first invalid field in visual order.
- Add failures preserve the draft. Pending create disables fields and all close paths, including `Escape`.
- New applications receive `Math.max(0, ...destinationOrderIndexes) + 1_000` for their selected status.

---

### Task 1: Add Zod and define the shared form contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.ts`
- Create: `src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts`

**Interfaces:**

```ts
export const jobApplicationStatuses = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export const jobApplicationFormSchema = z.object({
  company: /* trimmed required string */,
  position: /* trimmed required string */,
  job_url: /* trimmed valid URL or null */,
  status: z.enum(jobApplicationStatuses),
  applied_date: /* real YYYY-MM-DD date or null */,
  notes: /* original non-empty text or null */,
  resume_version: /* trimmed string or null */,
});

export type JobApplicationFormValues = z.input<
  typeof jobApplicationFormSchema
>;
export type JobApplicationFormData = z.output<
  typeof jobApplicationFormSchema
>;
export type JobApplicationFormErrors = Partial<
  Record<keyof JobApplicationFormValues, string>
>;
```

- [ ] **Step 1: Record the baseline and preserve unrelated work**

Run:

```powershell
git status --short
npm.cmd run test:run
```

Expected: note every pre-existing worktree change and leave it untouched; the existing suite passes before dependency or form changes. In particular, do not stage unrelated skill/plugin files with this feature.

- [ ] **Step 2: Install Zod as a runtime dependency**

Run:

```powershell
npm.cmd install zod
```

Expected: `zod` appears in `dependencies`; only `package.json` and `package-lock.json` change.

- [ ] **Step 3: Write failing schema tests**

Create table-driven tests covering:

- Empty and whitespace-only Company produce `Company is required.`.
- Empty and whitespace-only Position produce `Position is required.`.
- Company and Position are trimmed on success.
- Empty/whitespace URL becomes `null`; a valid URL is trimmed; malformed URL produces `Enter a valid URL.`.
- Every supported status parses and an unknown status fails.
- Empty Applied Date becomes `null`; valid leap-day input parses; malformed and impossible dates produce `Enter a valid date.`.
- Empty/whitespace Notes become `null`; non-empty Notes preserve their original leading/trailing whitespace.
- Empty/whitespace Resume Version becomes `null`; non-empty input is trimmed.

Use a complete valid raw fixture and override one field per test so failures identify one contract at a time.

- [ ] **Step 4: Run schema tests and verify RED**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts
```

Expected: FAIL because the shared schema module does not exist or does not yet satisfy the cases.

- [ ] **Step 5: Implement validation and normalization**

Create the schema plus small local helpers:

```ts
function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isRealIsoDate(value: string) {
  // Require exactly YYYY-MM-DD, construct a UTC date, and compare all parts.
}
```

Keep raw form inputs as strings. Transform only after validation so the output type matches Supabase nullable fields. Export:

```ts
export const emptyJobApplicationFormValues: JobApplicationFormValues = {
  company: "",
  position: "",
  job_url: "",
  status: "saved",
  applied_date: "",
  notes: "",
  resume_version: "",
};

export function jobApplicationToFormValues(
  application: JobApplication,
): JobApplicationFormValues;

export function issuesToFieldErrors(
  issues: z.core.$ZodIssue[],
): JobApplicationFormErrors;
```

`issuesToFieldErrors` retains only the first issue for each recognized field and never exposes non-field/raw error details.

- [ ] **Step 6: Run focused tests and commit Task 1**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts
git diff --check
git add package.json package-lock.json src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.ts src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts
git commit -m "feat: add application form schema"
```

Expected: schema tests pass and the commit contains only the dependency and shared schema contract.

---

### Task 2: Extract reusable, accessible form fields

**Files:**
- Create: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx`
- Create: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx`

**Interfaces:**

```ts
export type JobApplicationFormField = keyof JobApplicationFormValues;
export type JobApplicationFormControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

type JobApplicationFormFieldsProps = {
  disabled: boolean;
  errors: JobApplicationFormErrors;
  idPrefix: string;
  onChange: (field: JobApplicationFormField, value: string) => void;
  setFieldRef: (
    field: JobApplicationFormField,
    element: JobApplicationFormControl | null,
  ) => void;
  values: JobApplicationFormValues;
};
```

- [ ] **Step 1: Write failing shared-field rendering tests**

Render the molecule with controlled values and assert:

- All seven labels resolve to their controls.
- Status contains exactly Saved, Applied, Interview, Offer, and Rejected.
- The supplied values are visible and every control is disabled when `disabled` is true.
- Company and Applied Date errors render with stable `${idPrefix}-{field}-error` IDs, connect via `aria-describedby`, and set `aria-invalid="true"`.
- `onChange("notes", value)` and the field-ref callback receive the expected field/control.

- [ ] **Step 2: Run component tests and verify RED**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx
```

Expected: FAIL because the molecule does not exist.

- [ ] **Step 3: Implement the controlled field molecule**

Render fields in this exact visual/focus order:

1. Company
2. Position
3. Job URL
4. Status
5. Applied Date
6. Notes
7. Resume Version

For each field, derive stable control/error IDs from `idPrefix`, render the first provided error with `role="alert"`, and clear no state internally. Use semantic labels, `type="url"`, `type="date"`, and a textarea for Notes. Use humanized status option labels while retaining lowercase database values.

- [ ] **Step 4: Run focused tests and commit Task 2**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts
git diff --check
git add src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx
git commit -m "feat: add shared application form fields"
```

Expected: molecule and schema tests pass.

---

### Task 3: Migrate Detail Modal to the shared Zod form

**Files:**
- Modify: `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.tsx`
- Modify: `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx`

**Required regressions:**

- Existing prefill, native cancel, Save, mutation failure, Delete confirmation, pending controls, and dialog focus behavior stay intact.
- `onSave` still receives `UpdateJobApplicationInput` with the selected application ID.
- Successful status changes remain page-owned; this organism does not calculate `order_index`.

- [ ] **Step 1: Add failing Detail Zod regression tests**

Extend the existing suite to assert:

- Invalid URL renders `Enter a valid URL.`, associates the error with Job URL, focuses Job URL when required fields are valid, and never calls `onSave`.
- The shared field molecule's date-error test proves `Enter a valid date.` is associated with Applied Date. Impossible-date rejection itself remains a schema unit test because browsers sanitize invalid `input[type="date"]` values before form submission.
- The form has `noValidate`.
- Correcting a field clears only that field's error.
- The normalized payload still trims Company, Position, URL, and Resume Version, converts empty optionals to `null`, and preserves non-empty Notes whitespace.

- [ ] **Step 2: Run Detail tests and verify RED**

```powershell
npx.cmd vitest run src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
```

Expected: new URL/date/Zod assertions fail against the current manual required-field validation.

- [ ] **Step 3: Replace duplicated fields and manual normalization**

In the Detail organism:

- Replace seven individual state variables with `JobApplicationFormValues` initialized by `jobApplicationToFormValues(application)`.
- Store field elements in one ref map keyed by visual field name.
- On change, immutably update the draft and remove only the changed field's error.
- On submit, call `jobApplicationFormSchema.safeParse(values)`.
- On failure, map issues, set errors, and focus the first invalid field according to the shared visual order.
- On success, call `onSave({ id: application.id, ...result.data })` and close only after resolution.
- Render `<JobApplicationFormFields>` and add `noValidate` to the form.

Do not change the existing native dialog lifecycle, busy-state Cancel/Escape guards, error messages, Delete confirmation focus transitions, or close callback.

- [ ] **Step 4: Run Detail plus shared tests**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
```

Expected: all focused tests pass, including every pre-existing Detail test.

- [ ] **Step 5: Review and commit Task 3**

```powershell
git diff --check
git add src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
git commit -m "refactor: share application form validation"
```

Expected: only the Detail organism/tests change in this commit; delete and focus-restoration behavior remains covered.

---

### Task 4: Build the Add Application dialog organism

**Files:**
- Create: `src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.tsx`
- Create: `src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx`

**Interface:**

```ts
type AddJobApplicationModalProps = {
  hasCreateError: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (input: JobApplicationFormData) => Promise<unknown>;
};
```

- [ ] **Step 1: Write failing initial-state and cancel tests**

Assert that the native dialog:

- Opens with title `Add application` and an accessible description.
- Initially shows blank Company, Position, Job URL, Applied Date, Notes, and Resume Version.
- Defaults Status to `saved` and allows all five options.
- Initially focuses Company.
- Closes through Cancel, header close, or native `cancel`/Escape while idle without calling `onCreate`.

- [ ] **Step 2: Run Add modal tests and verify RED**

```powershell
npx.cmd vitest run src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx
```

Expected: FAIL because the Add organism does not exist.

- [ ] **Step 3: Implement dialog lifecycle and shared draft fields**

Use the same native `<dialog>` pattern as Detail:

- Initialize draft from `emptyJobApplicationFormValues`.
- Call `showModal()` once on mount.
- Render the shared field molecule with an Add-specific ID prefix.
- Add `noValidate` to the form.
- Use `jobApplicationFormSchema.safeParse`, field-error mapping, and first-invalid-field focus.
- Call `onCreate(result.data)` and close only after the promise resolves.
- Catch rejected mutation promises without replacing the draft.
- Render `The application could not be created. Please try again.` when `hasCreateError` is true.

- [ ] **Step 4: Add failing submit, error, and pending tests**

Cover:

- Required and URL validation plus first-invalid focus; date validation remains covered at schema level and date error semantics at molecule level because native date inputs sanitize impossible values.
- Successful submission sends the complete parsed `JobApplicationFormData`, including nullable optionals and preserved non-empty Notes.
- A rejected create followed by `hasCreateError={true}` rerender keeps the edited draft and dialog open.
- While `isCreating`, all fields, header close, Cancel, and `Add application` are disabled.
- A native cancel event while pending is prevented and does not close the dialog.

- [ ] **Step 5: Complete async and busy behavior, then verify GREEN**

```powershell
npx.cmd vitest run src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts
```

Expected: all Add/shared tests pass.

- [ ] **Step 6: Commit Task 4**

```powershell
git diff --check
git add src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx
git commit -m "feat: add application create dialog"
```

---

### Task 5: Connect the header action, create mutation, ordering, and focus

**Files:**
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Page state and handler:**

```ts
const addApplicationButtonRef = useRef<HTMLButtonElement>(null);
const [isAddOpen, setIsAddOpen] = useState(false);
const createApplication = useCreateJobApplication();

async function handleCreateApplication(input: JobApplicationFormData) {
  const destinationOrderIndexes = (applicationsQuery.data ?? [])
    .filter((application) => application.status === input.status)
    .map((application) => application.order_index);

  return createApplication.mutateAsync({
    ...input,
    order_index: Math.max(0, ...destinationOrderIndexes) + 1_000,
  });
}
```

- [ ] **Step 1: Extend page hook mocks and write the failing open test**

Hoist and configure `useCreateJobApplicationMock`, `createMutateAsync`, and `createReset`. Render the page, click `+ Add Application`, and assert:

- The Add dialog opens.
- Company receives focus.
- The existing account menu remains available beside the Add button.
- Opening resets stale create mutation state.

- [ ] **Step 2: Run page tests and verify RED**

```powershell
npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: new tests fail because no Add button/modal is connected.

- [ ] **Step 3: Implement header and page wiring**

- Import `AddJobApplicationModal`, `JobApplicationFormData`, and `useCreateJobApplication`.
- Group `+ Add Application` and Clerk `UserButton` in the header's right-side action container.
- Reset create mutation state before opening and after closing.
- Render the Add modal when `isAddOpen` and pass pending/error/mutation props.
- Calculate the destination order from the submitted status, not always Saved.
- After a close event removes the modal, restore focus to the Add button on the next animation frame.
- Keep the existing independent Detail focus-restoration effect unchanged.

- [ ] **Step 4: Add ordering, success, cancellation, error, and pending coverage**

Add page tests proving:

- Creating in Saved with an existing `1_000` card sends `order_index: 2_000`.
- Creating in an empty Offer column sends `order_index: 1_000`.
- Creating in Interview with an existing `2_000` card sends `order_index: 3_000`.
- The payload includes all parsed form fields and does not include `user_id` (the hook owns it).
- A resolved create closes the dialog and restores focus to `+ Add Application`.
- Cancel closes without a mutation, resets create state, and restores focus.
- A rejected mutation rerendered with `isError: true` keeps the dialog/draft visible and shows only the friendly error.
- Pending state disables controls and prevents native cancel closure.
- Existing card Detail open/save/delete/focus tests still pass.

- [ ] **Step 5: Run the focused interaction suite**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: all shared form, Add, Detail, card, board, and page interaction tests pass.

- [ ] **Step 6: Review and commit Task 5**

```powershell
git diff --check
git add src/pages/KanbanBoardPage/KanbanBoardPage.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git commit -m "feat: connect application creation workflow"
```

Expected: page integration is isolated to these two files.

---

### Task 6: Full verification and signed-in browser acceptance

**Files:**
- Modify only if a verification failure exposes an in-scope defect in files already listed above.

- [ ] **Step 1: Run repository checks from a fresh command**

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
git diff --check
git status --short
```

Expected: every command exits successfully; there are no failing tests, lint errors, TypeScript/build errors, whitespace errors, secrets, generated-route edits, environment edits, or unrelated changes.

- [ ] **Step 2: Start Vite and verify the signed-in desktop flow**

Run:

```powershell
npm.cmd run dev
```

At the URL printed by Vite, while signed in:

1. Confirm `+ Add Application` is visible beside the account menu.
2. Open it and confirm Company is focused, Status is Saved, and Applied Date is blank.
3. Trigger required and malformed URL errors; confirm focus and inline ARIA-linked messages. Use the native date picker for a valid date; rely on the schema test for impossible dates because the browser sanitizes them before submit.
4. Correct the fields and create a disposable application; confirm the dialog closes, focus returns to Add, and the card appears last in the selected column.
5. Reopen Add, enter a draft, Cancel, and confirm nothing is created.
6. Open the new card's Detail modal, confirm all fields are present, save an edit, then cancel delete confirmation.
7. Confirm the drag handle still reorders without opening either modal.
8. Confirm no console errors or raw Supabase/auth details appear.

- [ ] **Step 3: Verify a narrow mobile viewport**

At approximately 390px width, confirm the header actions remain usable, the dialog stays within the viewport and scrolls when needed, and the Kanban columns continue to scroll horizontally.

- [ ] **Step 4: Final scope review**

Compare the implementation against `docs/superpowers/specs/2026-08-11-add-job-application-form-design.md`. Confirm no styling-pass, URL extraction, stats, reminders, CSV, schema migration, or authentication work entered this phase.

- [ ] **Step 5: Commit any verified in-scope follow-up fix separately**

Only if Step 1-3 revealed a defect, rerun the failing check plus the full suite, then commit the smallest relevant files with a descriptive `fix:` message. Otherwise create no extra commit.
