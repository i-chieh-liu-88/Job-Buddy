# Clerk Auth Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the signed-out infinite application-loading state with Clerk modal authentication and mount the protected Kanban only for signed-in users.

**Architecture:** A focused `AuthGate` organism renders Clerk loading, signed-out, and signed-in branches. `main.tsx` places the existing Router application behind that gate, while the Kanban header exposes Clerk's account control for sign-out.

**Tech Stack:** React 19, TypeScript 6, Clerk React 5, TanStack Router, TanStack Query, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Use Clerk-hosted sign-in and sign-up modals; do not build custom credential forms.
- Add no authentication routes and no runtime dependencies.
- Do not mount Router, Kanban, or Supabase hooks for signed-out users.
- Retain the existing `enabled: isLoaded && Boolean(userId)` query guard.
- Do not modify Clerk or Supabase environment values.
- Keep visual changes limited to the small authentication shell and account control.
- Follow Atomic Design and do not edit `src/routeTree.gen.ts` manually.

---

## File Structure

- `src/components/organisms/AuthGate/AuthGate.tsx`: Clerk state composition and signed-out welcome UI.
- `src/components/organisms/AuthGate/AuthGate.test.tsx`: loading, signed-out, and signed-in behavior tests.
- `src/main.tsx`: wraps the protected application in `AuthGate` inside `ClerkProvider`.
- `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`: adds the Clerk account control to the signed-in header.
- `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`: verifies the account control appears in the protected page header.

---

### Task 1: Auth Gate State Machine

**Files:**
- Create: `src/components/organisms/AuthGate/AuthGate.tsx`
- Create: `src/components/organisms/AuthGate/AuthGate.test.tsx`

**Interfaces:**
- Consumes `PropsWithChildren`.
- Produces `AuthGate({ children }: PropsWithChildren)`.
- Uses Clerk's `ClerkLoading`, `ClerkLoaded`, `SignedIn`, `SignedOut`, `SignInButton`, and `SignUpButton` boundaries.

- [ ] **Step 1: Write failing Clerk-loading test**

Mock only Clerk's external state components with a mutable state of `"loading" | "signed-out" | "signed-in"`. Render `<AuthGate><p>Protected board</p></AuthGate>` in the loading state. Assert `role="status"` contains `Loading Job Buddy…` and `Protected board` is absent.

The production break caught by this test is mounting protected children before Clerk initialization completes.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx`

Expected: FAIL because `AuthGate.tsx` does not exist. If module resolution prevents the assertion from running, add only the exported component signature returning `null`, rerun, and confirm the status assertion fails.

- [ ] **Step 3: Implement the minimum loading branch**

Compose:

```tsx
<ClerkLoading>
  <main className="grid min-h-screen place-items-center bg-slate-50">
    <p role="status" className="text-slate-600">Loading Job Buddy…</p>
  </main>
</ClerkLoading>
```

Do not render `children` outside Clerk state boundaries.

- [ ] **Step 4: Run the loading test and confirm GREEN**

Run: `npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx`

Expected: loading test PASS.

- [ ] **Step 5: Write failing signed-out and signed-in tests**

In the signed-out state, assert:

- the `Sign in` and `Create account` buttons are visible;
- a Job Buddy heading and job-tracking description are visible;
- `Protected board` is absent.

In the signed-in state, assert `Protected board` is visible and both authentication buttons are absent. These tests catch swapped or overlapping Clerk state branches.

- [ ] **Step 6: Run the state tests and confirm RED**

Run: `npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx`

Expected: signed-out and signed-in tests FAIL because only loading is implemented.

- [ ] **Step 7: Implement signed-out and signed-in branches**

Inside `ClerkLoaded`, render:

```tsx
<SignedIn>{children}</SignedIn>
<SignedOut>
  <main>{/* welcome copy and modal triggers */}</main>
</SignedOut>
```

Wrap native buttons with `SignInButton mode="modal"` and `SignUpButton mode="modal"`. Use the existing slate/blue palette, visible `focus-visible` rings, responsive padding, and no custom authentication form state.

- [ ] **Step 8: Run all AuthGate tests and confirm GREEN**

Run: `npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx`

Expected: all three authentication-state tests PASS.

- [ ] **Step 9: Commit**

```powershell
git add src/components/organisms/AuthGate
git commit -m "feat: add Clerk authentication gate"
```

---

### Task 2: Application and Account-Control Integration

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Create: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**
- `main.tsx` renders `AuthGate` around `App` within `ClerkProvider` and `QueryClientProvider`.
- `KanbanBoardPage` renders Clerk `UserButton` in its header with an accessible account-menu label supplied through Clerk appearance/elements only if supported by the installed API.

- [ ] **Step 1: Write a failing protected-page account test**

Mock the existing data hooks at their external server-state boundary with a successful empty board result and a non-pending reorder mutation. Mock Clerk's external `UserButton` with an accessible `Account menu` button. Render the real `KanbanBoardPage` and assert the page heading and account-menu control both appear.

The production break caught is omitting the user's only in-app sign-out/account entry point.

- [ ] **Step 2: Run the page test and confirm RED**

Run: `npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

Expected: FAIL because `KanbanBoardPage` does not render `UserButton`.

- [ ] **Step 3: Add the Clerk account control**

Import `UserButton` directly from `@clerk/clerk-react`. Restructure the existing page header as a flex row: title/copy on the left and `UserButton` on the right. Preserve all existing board states and mutation error behavior.

- [ ] **Step 4: Run the page test and confirm GREEN**

Run: `npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

Expected: account-menu test PASS.

- [ ] **Step 5: Write the application wiring change**

In `main.tsx`, keep `ClerkProvider` outermost and `QueryClientProvider` unchanged, then wrap only `<App />`:

```tsx
<AuthGate>
  <App />
</AuthGate>
```

No route or query-hook changes are required because protected children no longer mount for signed-out users.

- [ ] **Step 6: Verify TypeScript integration**

Run: `npm.cmd run build`

Expected: PASS with the installed Clerk component APIs and no generated route edits staged.

- [ ] **Step 7: Run focused authentication tests**

Run: `npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

Expected: all authentication and account-control tests PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/main.tsx src/pages/KanbanBoardPage/KanbanBoardPage.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git commit -m "feat: protect Job Buddy with Clerk"
```

---

### Task 3: Full Verification and Review Gate

**Files:**
- Verify all Task 1-2 changes.

**Interfaces:**
- Produces a testable signed-out → modal authentication → protected Kanban → sign-out flow.

- [ ] **Step 1: Run all automated checks**

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
```

Expected: every test passes, ESLint reports zero errors, and Vite completes the production build.

- [ ] **Step 2: Inspect the final changed-file set**

Confirm there are no new routes, dependencies, environment edits, custom credential handlers, Supabase changes, generated route-tree edits, or unrelated UI refactors.

- [ ] **Step 3: Manually verify with configured Clerk credentials**

Start `npm.cmd run dev` and verify:

- signed out shows the welcome screen rather than `Loading applications...`;
- `Sign in` opens Clerk's sign-in modal;
- `Create account` opens Clerk's sign-up modal;
- successful authentication mounts the Kanban board;
- `UserButton` opens the account menu;
- signing out returns immediately to the welcome screen;
- keyboard focus and mobile-width layout remain usable.

- [ ] **Step 4: Report and pause**

Report changed files, commands and results, any manual checks that could not run, and pause before starting the card detail modal.
