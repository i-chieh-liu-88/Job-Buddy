# Resume Library Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private resume upload and library page backed by the deployed Supabase Storage bucket and `resumes` table.

**Architecture:** A dedicated `useResumes` hook owns all resume data and Storage mutations. An atomic upload dialog and library organism render the interaction, while a file-based `/resumes` route connects the page to the existing workspace shell and navigation.

**Tech Stack:** React, TypeScript, TanStack Router, TanStack Query, Clerk, Supabase Storage/Postgres, Tailwind CSS, Vitest.

## Global Constraints

- Use the existing private `resumes` bucket and `resumes` table; do not create public URLs.
- Apply `20260813000001_add_resume_file_size.sql` before testing upload so each metadata row can persist the file's byte size.
- Object paths must be `{Clerk user_id}/{resume UUID}/{safe filename}`.
- Allowed upload types are PDF, DOC, and DOCX, with a 10 MB maximum file size.
- The Library is available at `/resumes` through Workspace navigation.
- This phase does not implement resume selection in job applications or preview/download URLs.
- Work in the existing `dev` checkout; the user explicitly declined a worktree.

---

### Task 1: Resume data hook

**Files:**
- Create: `src/hooks/useResumes.ts`
- Create: `src/hooks/useResumes.test.tsx`

**Interfaces:**
- Produces `useResumes()`, `useUploadResume()`, `useDeleteResume()`, `buildResumeStoragePath()`, and resume upload validation constants.

- [ ] **Step 1: Write failing hook/utility tests**

```ts
expect(buildResumeStoragePath("user_1", "resume-1", "Frontend CV.pdf"))
  .toBe("user_1/resume-1/frontend-cv.pdf");
```

Add a mutation test that asserts an allowed PDF uploads to `resumes`, inserts a metadata row, and invalidates the current user query. Add a failed-insert test that asserts the uploaded object is removed.

- [ ] **Step 2: Run the new hook test and verify RED**

Run: `npx.cmd vitest run src/hooks/useResumes.test.tsx --reporter=dot`

Expected: FAIL because `useResumes` does not exist.

- [ ] **Step 3: Implement the typed query and mutations**

```ts
export function useResumes() { /* list current user's metadata by uploaded_at */ }
export function useUploadResume() { /* upload, insert, compensate insert failure */ }
export function useDeleteResume() { /* remove object, then metadata row */ }
```

Use `crypto.randomUUID()`, the Clerk `userId`, and `useSupabaseClient()`; write `file.size` to `resumes.file_size` and invalidate only `resumeKeys.list(userId)`.

- [ ] **Step 4: Run hook tests and confirm GREEN**

Run: `npx.cmd vitest run src/hooks/useResumes.test.tsx --reporter=dot`

Expected: all new tests pass.

### Task 2: Upload modal and resume library organism

**Files:**
- Create: `src/components/organisms/ResumeUploadModal/ResumeUploadModal.tsx`
- Create: `src/components/organisms/ResumeUploadModal/ResumeUploadModal.test.tsx`
- Create: `src/components/organisms/ResumeLibrary/ResumeLibrary.tsx`
- Create: `src/components/organisms/ResumeLibrary/ResumeLibrary.test.tsx`

**Interfaces:**
- Consumes `Resume`, upload validation constants, and `mutateAsync` callbacks from Task 1.
- Produces an accessible upload flow and a resume list with confirmed delete action.

- [ ] **Step 1: Write failing UI tests**

```tsx
expect(screen.getByText("No resumes yet")).toBeVisible();
await user.click(screen.getByRole("button", { name: "Upload resume" }));
await user.click(screen.getByRole("button", { name: "Upload resume" }));
expect(screen.getByText("Choose a PDF, DOC, or DOCX file.")).toBeVisible();
```

Add assertions for rendering label, filename, type, size, upload date, confirmation before delete, and controls disabled during pending mutations.

- [ ] **Step 2: Run UI tests and verify RED**

Run: `npx.cmd vitest run src/components/organisms/ResumeUploadModal/ResumeUploadModal.test.tsx src/components/organisms/ResumeLibrary/ResumeLibrary.test.tsx --reporter=dot`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the focused organisms**

Build the modal using the project's existing modal action hierarchy and the library with semantic `section`, `ul`, and list item markup. Use the existing dark design tokens, Tailwind responsive classes, and accessible labels.

- [ ] **Step 4: Run UI tests and confirm GREEN**

Run: `npx.cmd vitest run src/components/organisms/ResumeUploadModal/ResumeUploadModal.test.tsx src/components/organisms/ResumeLibrary/ResumeLibrary.test.tsx --reporter=dot`

Expected: all modal and library tests pass.

### Task 3: Route and Workspace navigation

**Files:**
- Create: `src/pages/ResumeLibraryPage/ResumeLibraryPage.tsx`
- Create: `src/pages/ResumeLibraryPage/ResumeLibraryPage.test.tsx`
- Create: `src/routes/resumes.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`

**Interfaces:**
- Consumes Task 1 hooks and Task 2 library organism.
- Produces a signed-in `/resumes` route and matching responsive navigation item.

- [ ] **Step 1: Write failing route/navigation tests**

```tsx
expect(screen.getByRole("link", { name: "Resumes" }))
  .toHaveAttribute("href", "/resumes");
```

Add page states covering loading, query error, empty library, and an upload action delegated to the hook.

- [ ] **Step 2: Run route/navigation tests and verify RED**

Run: `npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/ResumeLibraryPage/ResumeLibraryPage.test.tsx --reporter=dot`

Expected: FAIL because the route and page do not exist.

- [ ] **Step 3: Implement page and navigation integration**

Add `/resumes` with `createFileRoute`, reuse `ApplicationShell` and `ApplicationNavigation`, and add a `Resumes` link alongside `Applications` in desktop and mobile navigation.

- [ ] **Step 4: Run route/navigation tests and confirm GREEN**

Run: `npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/ResumeLibraryPage/ResumeLibraryPage.test.tsx --reporter=dot`

Expected: route and navigation tests pass.

### Task 4: Integration verification and handoff

**Files:**
- Modify: no production files unless a test reveals a scoped defect.

- [ ] **Step 1: Run complete verification**

Run: `npm.cmd run lint; npx.cmd vitest run --reporter=dot; npm.cmd run build; git diff --check`

Expected: lint, test suite, production build, and diff check succeed.

- [ ] **Step 2: Manual signed-in check**

Open `/resumes`, upload a small PDF with a label, verify the row appears, refresh to confirm it persists, then delete it and confirm it disappears. Verify the Storage object lives under the current Clerk user id prefix.

- [ ] **Step 3: Pause before phase three**

Report the changed files, verification results, and any manual check that still needs the user's signed-in browser session. Do not implement the job-card picker or preview action.
