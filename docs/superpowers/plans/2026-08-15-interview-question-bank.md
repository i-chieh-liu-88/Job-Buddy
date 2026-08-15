# Interview Question Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record questions per interview round and provide a searchable, tag-filtered global Question Bank with links back to the source round.

**Architecture:** Add a normalized `interview_questions` table owned by Clerk `user_id` and linked to `interviews` with cascade deletion. Use application-scoped hooks inside InterviewRounds and a separate `/questions` page with joined context from interviews and job applications.

**Tech Stack:** Supabase SQL migrations, PostgreSQL RLS/Gin indexes, React + TypeScript, TanStack Query, Zod, TanStack Router, Tailwind, Testing Library, Vitest.

## Global Constraints

- Start only after Company Research is complete and verified.
- Work directly on the existing `dev` branch; do not create a worktree.
- Preserve current interview, calendar, application, resume, and drawer behavior.
- Tags are a normalized lowercase `text[]`; selected tag filters use OR semantics.
- Search matches question text or answer notes; context fields are display-only.
- Use click-only navigation from Question Bank to the application drawer and target interview round.
- Use the existing Newton loader for Question Bank loading without visible caption.
- Run focused tests, `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check` for each completed task.
- Never stage unrelated dirty files.

### Task 1: Interview Questions migration and RLS

**Files:**
- Create: `supabase/migrations/20260815010000_create_interview_questions.sql`
- Test/verification: Supabase SQL Editor checks documented in the task.

**Interfaces:**
- Produces `public.interview_questions` consumed by all later tasks.
- Produces direct owner policies and an interview/application ownership validation trigger.

- [ ] Write the table with UUID key, owner, interview FK with cascade, question/answer fields, tags default, timestamps, `(user_id, interview_id)` index, tags GIN index, and non-blank question check.
- [ ] Add RLS select/insert/update/delete policies and verify the interview's application owner on insert/update.
- [ ] Run the migration and verify schema, RLS, indexes, cascade behavior, same-owner access, and cross-owner rejection in Supabase SQL Editor.
- [ ] Run `git diff --check` and commit only the migration with `git add -- supabase/migrations/20260815010000_create_interview_questions.sql` and `git commit -m "feat: add interview questions schema"`.

### Task 2: Question hooks and normalized tag utilities

**Files:**
- Create: `src/hooks/useInterviewQuestions.ts`
- Create: `src/hooks/useInterviewQuestions.test.tsx`
- Create: `src/lib/normalizeQuestionTags.ts`
- Create: `src/lib/normalizeQuestionTags.test.ts`
- Modify: `src/types/database.ts`

**Interfaces:**
- Produces `useQuestionsForInterview(interviewId)`, `useQuestionBank({ search, tags })`, `useQuestionBankTags()`, `useCreateInterviewQuestion()`, `useUpdateInterviewQuestion()`, and `useDeleteInterviewQuestion()`.
- `normalizeQuestionTags(tags: string[]): string[]` trims, lowercases, removes blanks, and deduplicates.

- [ ] Add RED tests for tag normalization, query joins/context, keyword OR answer search, selected-tags OR filtering, payload owner injection, and scoped invalidation.
- [ ] Run focused tests and verify failure before implementation.
- [ ] Add database types and implement hooks using nested Supabase relations for company, position, round label, and interview date.
- [ ] Use `ilike` for question/answer search and `&&` for tags; return a stable typed row shape for cards.
- [ ] Run focused tests, lint/build/diff check, and commit `feat: add interview question hooks`.

### Task 3: Question CRUD inside InterviewRounds

**Files:**
- Create: `src/components/molecules/InterviewQuestionList/InterviewQuestionList.tsx`
- Create: `src/components/molecules/InterviewQuestionList/InterviewQuestionList.test.tsx`
- Modify: `src/components/organisms/InterviewRounds/InterviewRounds.tsx`
- Modify: `src/components/organisms/InterviewRounds/InterviewRounds.test.tsx`

**Interfaces:**
- `InterviewQuestionList` accepts `{ interviewId: string }` and keeps one independent question editor active.
- InterviewRounds passes each interview ID and keeps round expansion state.

- [ ] Add RED tests for empty state, add/edit/cancel/save/delete, required question, tags Enter/comma/suggestions, pending controls, error draft preservation, and delete confirmation.
- [ ] Implement the question list and editor with answer notes, normalized tag chips, existing tag suggestions, and independent CRUD.
- [ ] Keep the interview ID fixed from the containing round and preserve round/drawer state after mutations.
- [ ] Run focused InterviewQuestionList and InterviewRounds tests, then lint/build/diff check and commit `feat: add interview question round controls`.

### Task 4: Global Question Bank route and navigation

**Files:**
- Create: `src/pages/QuestionBankPage/QuestionBankPage.tsx`
- Create: `src/pages/QuestionBankPage/QuestionBankPage.test.tsx`
- Create: `src/routes/questions.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`

**Interfaces:**
- Route path is `/questions`.
- Page consumes `useQuestionBank`, `useQuestionBankTags`, and the existing navigation/application-opening contract.

- [ ] Add RED tests for route rendering, navigation item, debounced search, OR tag filters, clear filters, result count, context fields, Newton loading, empty/filtered-empty/error states, and responsive filter structure.
- [ ] Implement the page with search and tag controls, result cards showing company/position/round/date, and click-only `OPEN APPLICATION`.
- [ ] Add the route without editing generated `src/routeTree.gen.ts` by hand; use the repository's TanStack Router generation workflow if required.
- [ ] Ensure opening a result navigates to Applications with the application ID and round target, then expands/focuses that round.
- [ ] Run focused page/navigation tests, lint/build/diff check, and commit `feat: add global interview question bank`.

### Task 5: Question Bank integration verification

**Files:**
- Modify: `docs/superpowers/specs/2026-08-15-interview-question-bank-design.md` only if implementation decisions materially change the approved contract.

- [ ] Run `npm.cmd run test:run` and record any unrelated pre-existing failures without changing them silently.
- [ ] Browser-test: add a question in an interview round, see it in `/questions`, search it, filter by one or more tags, and open the source application/round.
- [ ] Verify deleting the source interview removes the question from the global bank and that another user's data is inaccessible.
- [ ] Run `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.
- [ ] Review `git status --short` and confirm no unrelated files are staged.
