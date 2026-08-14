# Interview Round Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manage multiple scheduled interview rounds for an application from its existing detail drawer.

**Architecture:** Extend the database types and add application-scoped TanStack Query CRUD hooks. A new `InterviewRounds` organism owns its list, inline add/edit forms, validation, and delete confirmation; the existing detail drawer renders it without merging interview actions into application Save changes.

**Tech Stack:** React, TypeScript, TanStack Query, Supabase, Clerk, Tailwind CSS, Vitest.

## Global Constraints

- Use the deployed `public.interviews` table with direct `user_id` ownership.
- Query interview rounds by application and order by `scheduled_at` ascending.
- Store the native `datetime-local` input as `new Date(value).toISOString()`.
- Add/edit requires a non-whitespace round label and date/time; location/link and notes are optional.
- Interview mutations must not save, close, or reset application fields.
- Work in the existing `dev` checkout; the user explicitly declined a worktree.

---

### Task 1: Interview types and scoped query hooks

**Files:**
- Modify: `src/types/database.ts`
- Create: `src/hooks/useInterviews.ts`
- Create: `src/hooks/useInterviews.test.tsx`

**Interfaces:**
- Produces `Interview`, `InterviewInsert`, `InterviewUpdate` and the `interviews` Database mapping.
- Produces `useInterviewsForApplication(jobApplicationId)`, `useCreateInterview()`, `useUpdateInterview()`, and `useDeleteInterview()`.

- [ ] **Step 1: Write failing hook tests**

```tsx
const { result } = renderHook(() => useCreateInterview(), { wrapper });
await act(async () => {
  await result.current.mutateAsync({
    job_application_id: "application-1",
    round_label: "Technical",
    scheduled_at: "2026-08-20T09:00:00.000Z",
    location_or_link: null,
    notes: null,
  });
});

expect(insert).toHaveBeenCalledWith(expect.objectContaining({
  user_id: "user-1",
  job_application_id: "application-1",
}));
```

Test that all successful mutations invalidate `interviewKeys.application("application-1", "user-1")`, and the application query orders by `scheduled_at` ascending.

- [ ] **Step 2: Run hooks test and verify RED**

Run: `npx.cmd vitest run src/hooks/useInterviews.test.tsx --reporter=dot`

Expected: FAIL because the Interview mapping and hooks do not exist.

- [ ] **Step 3: Implement types and hooks**

```ts
export const interviewKeys = {
  all: ["interviews"] as const,
  application: (applicationId: string, userId: string) =>
    [...interviewKeys.all, "application", applicationId, userId] as const,
};

export function useInterviewsForApplication(jobApplicationId: string) {
  // enabled only for a loaded signed-in user and a non-empty application ID
  // select('*').eq('job_application_id', jobApplicationId).order('scheduled_at')
}
```

Create/update mutation inputs omit `user_id`; create supplies the Clerk ID. Each success invalidates only that application key.

- [ ] **Step 4: Run hooks test and verify GREEN**

Run: `npx.cmd vitest run src/hooks/useInterviews.test.tsx --reporter=dot`

Expected: all interview-hook tests pass.

### Task 2: Interview rounds organism

**Files:**
- Create: `src/components/organisms/InterviewRounds/InterviewRounds.tsx`
- Create: `src/components/organisms/InterviewRounds/InterviewRounds.test.tsx`

**Interfaces:**
- Consumes `jobApplicationId: string` and the hooks from Task 1.
- Produces the accessible `Interview rounds` section, its inline form, and separate mutation feedback.

- [ ] **Step 1: Write failing component tests**

```tsx
render(<InterviewRounds jobApplicationId="application-1" />);
await user.click(screen.getByRole("button", { name: "Add interview round" }));
await user.type(screen.getByLabelText("Round label"), "Technical");
await user.type(screen.getByLabelText("Date and time"), "2026-08-20T11:30");
await user.click(screen.getByRole("button", { name: "Save interview round" }));

expect(createMutateAsync).toHaveBeenCalledWith(expect.objectContaining({
  round_label: "Technical",
  scheduled_at: "2026-08-20T09:30:00.000Z",
}));
```

Add tests for empty/loading/error states, blank label and missing date errors, edit payload, two-step delete, mutation error retention, and local formatted timestamp display.

- [ ] **Step 2: Run component test and verify RED**

Run: `npx.cmd vitest run src/components/organisms/InterviewRounds/InterviewRounds.test.tsx --reporter=dot`

Expected: FAIL because the organism does not exist.

- [ ] **Step 3: Implement the organism**

Render a semantic `section` headed `Interview rounds`. Keep the draft in component state. Use native `datetime-local`; validate before mutations; convert values only at mutation boundaries. Render inline edit forms per active ID. Require confirmation before calling delete. Show query and mutation errors within the section; do not disable unrelated drawer controls.

- [ ] **Step 4: Run component test and verify GREEN**

Run: `npx.cmd vitest run src/components/organisms/InterviewRounds/InterviewRounds.test.tsx --reporter=dot`

Expected: all InterviewRounds tests pass.

### Task 3: Detail drawer integration and regression check

**Files:**
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.tsx`
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx`

**Interfaces:**
- Consumes `InterviewRounds` from Task 2.
- Produces a drawer where application Save changes and interview round mutations remain independent.

- [ ] **Step 1: Write a failing integration test**

```tsx
await user.clear(screen.getByLabelText("Company"));
await user.type(screen.getByLabelText("Company"), "Unsaved Acme");
await user.click(screen.getByRole("button", { name: "Add interview round" }));
// create the round
expect(screen.getByLabelText("Company")).toHaveValue("Unsaved Acme");
expect(onSave).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run drawer test and verify RED**

Run: `npx.cmd vitest run src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx --reporter=dot`

Expected: FAIL because the drawer does not render InterviewRounds.

- [ ] **Step 3: Render InterviewRounds below application fields**

```tsx
<InterviewRounds jobApplicationId={application.id} />
```

Place it after resume controls and before existing drawer errors. Do not alter application form state, footer actions, or drawer close behavior.

- [ ] **Step 4: Run verification and pause**

Run: `npm.cmd run lint; npx.cmd vitest run --reporter=dot; npm.cmd run build; git diff --check`

Expected: lint, test suite, build, and diff check finish successfully. Then manually create, edit, and delete a round from a signed-in card before moving to the calendar page.
