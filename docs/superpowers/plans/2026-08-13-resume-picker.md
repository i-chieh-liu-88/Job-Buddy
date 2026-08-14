# Resume Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users link, replace, or remove a private resume from an existing job application through its detail drawer.

**Architecture:** The existing `useResumes()` query supplies owned resume metadata to `KanbanBoardPage`, which passes it into the selected detail drawer. The reusable application form fields receive optional picker data, ensuring create forms remain untouched while the detail drawer serializes `resume_id` through its current Zod and update-mutation path.

**Tech Stack:** React, TypeScript, TanStack Query, Supabase, Clerk, Tailwind CSS, Vitest.

## Global Constraints

- Use a native select with `No resume linked` mapped to `null`.
- Only render the picker in the detail drawer; do not change the add-application dialog.
- Preserve an existing `resume_id` while the resume query is loading or failing.
- Do not add a migration, public URL, preview, or download behavior.
- Work in the existing `dev` checkout; the user explicitly declined a worktree.

---

### Task 1: Reusable resume select form field

**Files:**
- Modify: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx`
- Modify: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx`

**Interfaces:**
- Consumes optional `resumes: Resume[]`, `resumePickerDisabled`, and `showResumePicker` props.
- Produces a `Resume` select that calls `onChange("resume_id", selectedId)` and maps the empty value to `null` in the parent.

- [ ] **Step 1: Write failing field tests**

```tsx
expect(screen.getByLabelText("Resume")).toHaveValue("resume-1");
expect(screen.getByRole("option", { name: "No resume linked" })).toBeVisible();
```

Add a test that create-form props omit the picker entirely and a disabled picker preserves its selected ID.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx.cmd vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx --reporter=dot`

Expected: FAIL because no Resume select exists.

- [ ] **Step 3: Implement optional select rendering**

Render the select after Notes only when `showResumePicker` is true. Present `No resume linked` with empty string value and resume labels with UUID values. Apply existing control and focus/error styles.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npx.cmd vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx --reporter=dot`

Expected: all tests pass.

### Task 2: Detail drawer picker behavior

**Files:**
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.tsx`
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx`

**Interfaces:**
- Consumes `resumes: Resume[]`, `isResumesLoading`, and `hasResumesError`.
- Produces save requests with linked UUID or `resume_id: null` after unlinking.

- [ ] **Step 1: Write failing drawer behavior tests**

```tsx
await user.selectOptions(screen.getByLabelText("Resume"), "resume-2");
await user.click(screen.getByRole("button", { name: "Save changes" }));
expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ resume_id: "resume-2" }));
```

Add tests for selecting the empty option and disabled/error states that preserve an existing selection.

- [ ] **Step 2: Run the focused drawer test and verify RED**

Run: `npx.cmd vitest run src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx --reporter=dot`

Expected: FAIL because drawer props and picker behavior do not exist.

- [ ] **Step 3: Implement drawer data plumbing**

Add the props, normalize empty select value to `null`, and render a non-destructive resume-load error. Disable the select only while query loading/error or current save/delete mutation is pending.

- [ ] **Step 4: Run the drawer tests and verify GREEN**

Run: `npx.cmd vitest run src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx --reporter=dot`

Expected: all drawer tests pass.

### Task 3: Page query integration and verification

**Files:**
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**
- Consumes `useResumes()`.
- Produces a selected drawer supplied with query data/loading/error state.

- [ ] **Step 1: Write a failing page integration test**

```tsx
expect(screen.getByLabelText("Resume")).toHaveValue("resume-1");
```

Mock `useResumes()` with two records and assert selection reaches `updateMutateAsync`.

- [ ] **Step 2: Run page test and verify RED**

Run: `npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx --reporter=dot`

Expected: FAIL because the page does not load or pass resume query data.

- [ ] **Step 3: Implement page wiring**

Call `useResumes()` once beside application queries and pass its data/state only to `JobApplicationDetailDrawer`.

- [ ] **Step 4: Run full verification and pause**

Run: `npm.cmd run lint; npx.cmd vitest run --reporter=dot; npm.cmd run build; git diff --check`

Expected: all checks pass. Manually select, replace, save, reopen, and unlink a resume on a signed-in card. Stop before preview/open implementation.
