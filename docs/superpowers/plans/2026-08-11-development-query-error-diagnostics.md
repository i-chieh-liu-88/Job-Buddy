# Development Query Error Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show safe Supabase query error metadata beneath the existing applications error message in Vite development mode.

**Architecture:** Keep error-state selection in `KanbanBoardPage`. Add a page-local formatter that accepts `unknown` and reads only string-valued `name`, `message`, and `code` properties; render its output only behind `import.meta.env.DEV`.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, Vitest, Testing Library, Tailwind CSS

## Global Constraints

- Keep `Could not load applications. Please try again.` unchanged.
- Never render Clerk tokens, Supabase keys, authorization headers, request headers, or arbitrary serialized error objects.
- Production builds must not render diagnostic details.
- Do not change authentication configuration, Supabase client construction, migrations, dependencies, or environment files.

---

### Task 1: Render safe query diagnostics in development

**Files:**
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`

**Interfaces:**
- Consumes: `applicationsQuery.error: unknown` from `useJobApplications()` and `import.meta.env.DEV` from Vite.
- Produces: page-local `formatQueryError(error: unknown): string` and a development-only `<code>` diagnostic block.

- [ ] **Step 1: Make the applications query mock configurable**

Replace the fixed query mock in `KanbanBoardPage.test.tsx` with a hoisted function and reset its success-state return value before each test:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useJobApplicationsMock } = vi.hoisted(() => ({
  useJobApplicationsMock: vi.fn(),
}));

vi.mock("../../hooks/useJobApplications", () => ({
  useJobApplications: useJobApplicationsMock,
  useReorderJobApplications: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
}));

beforeEach(() => {
  useJobApplicationsMock.mockReturnValue({
    data: [],
    error: null,
    isError: false,
    isPending: false,
  });
});
```

- [ ] **Step 2: Write the failing development diagnostics test**

Add this test to the existing `KanbanBoardPage` describe block:

```tsx
it("shows allow-listed query error details during development", () => {
  useJobApplicationsMock.mockReturnValue({
    data: undefined,
    error: {
      authorization: "Bearer must-not-render",
      code: "PGRST301",
      message: "JWT verification failed",
      name: "PostgrestError",
    },
    isError: true,
    isPending: false,
  });

  render(<KanbanBoardPage />);

  expect(
    screen.getByText("Could not load applications. Please try again."),
  ).toBeVisible();
  expect(screen.getByText(/PostgrestError/)).toHaveTextContent("PGRST301");
  expect(screen.getByText(/PostgrestError/)).toHaveTextContent(
    "JWT verification failed",
  );
  expect(screen.queryByText(/must-not-render/)).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```powershell
npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: FAIL because no element contains `PostgrestError` or `PGRST301`.

- [ ] **Step 4: Implement the allow-list formatter and development-only rendering**

Add the formatter above `KanbanBoardPage`:

```tsx
const QUERY_ERROR_FIELDS = ["name", "code", "message"] as const;

function formatQueryError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "Unknown query error";
  }

  const errorRecord = error as Record<string, unknown>;
  const details = QUERY_ERROR_FIELDS.flatMap((field) => {
    const value = errorRecord[field];
    return typeof value === "string" && value.length > 0 ? [value] : [];
  });

  return details.length > 0 ? details.join(" · ") : "Unknown query error";
}
```

Replace the error paragraph with one alert container that preserves the friendly text and conditionally renders safe details:

```tsx
<div role="alert" className="text-red-700">
  <p>Could not load applications. Please try again.</p>
  {import.meta.env.DEV ? (
    <code className="mt-2 block whitespace-pre-wrap text-xs text-slate-600">
      {formatQueryError(applicationsQuery.error)}
    </code>
  ) : null}
</div>
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```powershell
npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: both page tests PASS, and the sensitive `authorization` value is absent.

- [ ] **Step 6: Run full verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
```

Expected: all commands exit successfully. The production build replaces `import.meta.env.DEV` with `false`, so diagnostic markup is excluded from production behavior.

- [ ] **Step 7: Review scope and commit**

Run:

```powershell
git diff --check
git status --short
git add src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.tsx
git commit -m "chore: show development query diagnostics"
```

Expected: only the page and its test are included in the implementation commit; environment files, migrations, generated routes, dependencies, and authentication setup remain unchanged.
