# Company Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure, independently saved company research and repeatable interviewer notes to each application drawer.

**Architecture:** Use normalized `company_research` and `interviewers` tables with duplicated Clerk `user_id`, direct RLS policies, and ownership validation triggers. Expose application-scoped TanStack Query hooks and a focused drawer section that saves research and each interviewer independently.

**Tech Stack:** Supabase SQL migrations, PostgreSQL RLS/triggers, React + TypeScript, TanStack Query, Zod, Tailwind, Testing Library, Vitest.

## Global Constraints

- Work directly on the existing `dev` branch; do not create a worktree.
- Preserve current application, resume, interview, and calendar behavior.
- Use Atomic Design locations under `src/components` for reusable UI.
- Clerk JWT subject is the ownership key; never trust a client-provided owner.
- Use Zod for salary and interviewer validation.
- Run focused tests, `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check` for each completed task.
- Never stage unrelated dirty files.

### Task 1: Company Research migration and RLS

**Files:**
- Create: `supabase/migrations/20260815000000_create_company_research.sql`
- Test/verification: Supabase SQL Editor checks documented in the task; no local SQL test harness exists.

**Interfaces:**
- Produces tables `public.company_research` and `public.interviewers` consumed by Task 2 hooks.
- Produces direct ownership policies and validation triggers compatible with the existing Clerk/Supabase setup.

- [ ] Write the migration with UUID keys, timestamps, unique research-per-application, cascade FKs, `(user_id, job_application_id)` indexes, salary checks, currency check, RLS policies, and owner-validation triggers.
- [ ] Run the migration in Supabase SQL Editor and verify both tables exist, RLS is enabled, policies exist, cascade FKs exist, and the indexes/check constraints are present.
- [ ] Verify with an authenticated Clerk session that same-owner rows can be read/written and a cross-owner application ID is rejected.
- [ ] Run `git diff --check` and commit only the migration with `git add -- supabase/migrations/20260815000000_create_company_research.sql` and `git commit -m "feat: add company research schema"`.

### Task 2: Research and interviewer hooks

**Files:**
- Create: `src/hooks/useCompanyResearch.ts`
- Create: `src/hooks/useCompanyResearch.test.tsx`
- Modify: `src/types/database.ts`

**Interfaces:**
- Produces `useCompanyResearch(applicationId)`, `useUpsertCompanyResearch()`, `useInterviewers(applicationId)`, `useCreateInterviewer()`, `useUpdateInterviewer()`, and `useDeleteInterviewer()`.
- Query keys are application-scoped and include the current Clerk user ID.

- [ ] Add RED tests for select, upsert, independent interviewer CRUD, owner payloads, and scoped invalidation.
- [ ] Run `npx.cmd vitest run src/hooks/useCompanyResearch.test.tsx` and verify the new tests fail because the hooks/types do not exist.
- [ ] Add database types for research and interviewer rows/inserts/updates and implement Supabase queries following `useInterviews.ts` patterns.
- [ ] Ensure upsert uses `onConflict: "job_application_id"`; create mutations inject `user_id`; update/delete filter by row ID; success invalidates only application-scoped research/interviewer keys.
- [ ] Run the focused hook tests until GREEN, then lint/build/diff check and commit `feat: add company research query hooks`.

### Task 3: Research section UI

**Files:**
- Create: `src/components/organisms/CompanyResearch/CompanyResearch.tsx`
- Create: `src/components/organisms/CompanyResearch/CompanyResearch.test.tsx`
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.tsx`
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx`

**Interfaces:**
- `CompanyResearch` accepts `{ jobApplicationId: string }` and owns its local research/interviewer drafts.
- Drawer renders Company Research after application fields and before InterviewRounds.

- [ ] Add RED tests for smart collapsed/expanded defaults, accessible disclosure state, independent research Save, salary validation, and query error isolation.
- [ ] Implement the semantic disclosure section, culture/salary/source fields, fixed currency select, Zod validation, blank-save deletion behavior, pending/error states, and independent Save action.
- [ ] Add the interviewer list shell with empty state and an `ADD INTERVIEWER` entry point; keep one active editor at a time.
- [ ] Wire the section into the drawer without changing the drawer's application Save/Cancel lifecycle.
- [ ] Run focused CompanyResearch and drawer tests, then lint/build/diff check and commit `feat: add company research drawer section`.

### Task 4: Interviewer independent CRUD

**Files:**
- Modify: `src/components/organisms/CompanyResearch/CompanyResearch.tsx`
- Modify: `src/components/organisms/CompanyResearch/CompanyResearch.test.tsx`

**Interfaces:**
- Uses Task 2 interviewer hooks and preserves the Task 3 `CompanyResearch` props.

- [ ] Add RED tests for add/edit/save/cancel/delete confirmation, required name, valid LinkedIn URL, pending controls, and mutation error draft preservation.
- [ ] Implement independent interviewer editor rows with per-row Save/Cancel/Delete and confirmation, using the hook mutations.
- [ ] Keep drawer and research disclosure open after successful interviewer operations; invalidate only interviewer queries.
- [ ] Run focused tests, full relevant regression tests, lint/build/diff check, and commit `feat: add interviewer research controls`.

### Task 5: Company Research verification handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-08-15-company-research-design.md` only if implementation decisions materially change the approved contract.

- [ ] Run `npm.cmd run test:run` and record any pre-existing unrelated failures without changing them silently.
- [ ] Verify the browser flow with an authenticated user: empty section collapsed, save research, reopen expanded, add/edit/delete interviewer, and confirm application Cancel does not discard saved research.
- [ ] Run `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.
- [ ] Review `git status --short` and confirm no unrelated files are staged.
