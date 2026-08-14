# Resume Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user open an application’s linked private resume in a new browser tab from its detail drawer.

**Architecture:** `useOpenResume()` remains in the existing resume hook module and owns the private Storage signed-URL request. It opens a blank tab synchronously before requesting the URL, then navigates it on success or closes it on failure. The detail drawer resolves its linked `Resume` record from the already queried list, invokes this mutation, and exposes pending and retryable-error feedback without changing the application record.

**Tech Stack:** React, TypeScript, TanStack Query, Supabase Storage, Clerk, Tailwind CSS, Vitest.

## Global Constraints

- Use the existing private `resumes` Storage bucket and create a short-lived signed URL at click time.
- PDFs and Word documents both open in a separate tab; browser-native preview/download behavior decides presentation.
- Do not persist, cache, or make public a signed URL.
- Do not change the database schema, Resume Library, application picker, upload UI, or application-save behavior.
- Work in the existing `dev` checkout; the user explicitly declined a worktree.

---

### Task 1: Private signed-URL open mutation

**Files:**
- Modify: `src/hooks/useResumes.ts`
- Modify: `src/hooks/useResumes.test.tsx`

**Interfaces:**
- Consumes `Resume.file_path` and the current Supabase client.
- Produces `useOpenResume()` with `mutateAsync(resume: Pick<Resume, "file_path">): Promise<void>`.

- [ ] **Step 1: Write failing hook tests**

```tsx
const { result } = renderHook(() => useOpenResume(), { wrapper });
await act(async () => {
  await result.current.mutateAsync({ file_path: "user-1/resume-1/frontend-v2.pdf" });
});

expect(createSignedUrl).toHaveBeenCalledWith(
  "user-1/resume-1/frontend-v2.pdf",
  60,
);
expect(window.open).toHaveBeenCalledWith(
  "",
  "_blank",
);
expect(openedWindow.opener).toBeNull();
expect(openedWindow.location.assign).toHaveBeenCalledWith(
  "https://signed.example/resume.pdf",
);
```

Add one test where `createSignedUrl` returns an error, the synchronous blank tab closes, and `mutateAsync` rejects.

- [ ] **Step 2: Run focused hook tests and verify RED**

Run: `npx.cmd vitest run src/hooks/useResumes.test.tsx --reporter=dot`

Expected: FAIL because `useOpenResume` and `createSignedUrl` behavior do not exist.

- [ ] **Step 3: Implement the smallest signed-URL mutation**

```ts
export function useOpenResume() {
  const supabase = useSupabaseClient();

  return useMutation({
    mutationFn: async ({ file_path }: Pick<Resume, "file_path">) => {
      const openedWindow = window.open("", "_blank", "noopener,noreferrer");
      const { data, error } = await supabase.storage
        .from(RESUME_BUCKET)
        .createSignedUrl(file_path, 60);
      if (error || !data?.signedUrl) {
        openedWindow?.close();
        throw error ?? new Error("Signed URL missing");
      }
      openedWindow?.location.assign(data.signedUrl);
    },
  });
}
```

Treat a missing `data.signedUrl` as an error before calling `window.open`.

- [ ] **Step 4: Run hook tests and verify GREEN**

Run: `npx.cmd vitest run src/hooks/useResumes.test.tsx --reporter=dot`

Expected: all resume-hook tests pass.

### Task 2: Detail-drawer open action and feedback

**Files:**
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.tsx`
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx`

**Interfaces:**
- Consumes `resumes: Resume[]` and `useOpenResume()`.
- Produces an `Open resume` button only when `values.resume_id` resolves to a `Resume` record.

- [ ] **Step 1: Write failing drawer tests**

```tsx
renderDrawer();
await user.click(screen.getByRole("button", { name: "Open resume" }));
expect(openResumeMutateAsync).toHaveBeenCalledWith(resumes[0]);
```

Add tests that an unlinked application has no Open resume button, the button is disabled and labelled `Opening…` while pending, and a rejected open action displays `The resume could not be opened. Please try again.` without closing the drawer.

- [ ] **Step 2: Run focused drawer tests and verify RED**

Run: `npx.cmd vitest run src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx --reporter=dot`

Expected: FAIL because the action and error feedback do not exist.

- [ ] **Step 3: Implement the drawer action**

Resolve `linkedResume` using `values.resume_id` and `resumes`. Render the action beneath the Resume picker only for a matched record. Invoke `openResume.mutateAsync(linkedResume)` and retain local form state, open drawer state, and selection on rejection. Use the existing `StatefulButton` for pending state and the project’s error-alert pattern for failures.

- [ ] **Step 4: Run drawer tests and verify GREEN**

Run: `npx.cmd vitest run src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx --reporter=dot`

Expected: all drawer tests pass.

### Task 3: Regression verification and manual review

**Files:**
- No production files beyond Tasks 1–2.

**Interfaces:**
- The existing board query still passes resumes into the drawer and requires no additional request or route wiring.

- [ ] **Step 1: Run relevant integration suites**

Run: `npx.cmd vitest run src/hooks/useResumes.test.tsx src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx --reporter=dot`

Expected: all focused suites pass.

- [ ] **Step 2: Run project verification**

Run: `npm.cmd run lint; npx.cmd vitest run --reporter=dot; npm.cmd run build; git diff --check`

Expected: lint, tests, production build, and diff check all finish successfully. The known Vite large-chunk warning may remain non-fatal.

- [ ] **Step 3: Pause for signed-in manual verification**

Open a card with a linked PDF, choose `Open resume`, and confirm a new tab displays it. Repeat with a Word document and confirm browser download/open behavior. Disconnect the network or use a blocked Storage request and confirm the retryable error leaves the drawer and selection intact.
