# Tailwind Styling Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the signed-in Job Buddy workspace as a calm, Asana-inspired application board with a reusable light color system, clear information hierarchy, and purpose-built desktop and mobile navigation.

**Architecture:** `KanbanBoardPage` remains the data and workflow coordinator. A new `ApplicationShell` layout and `ApplicationNavigation` organism provide the workspace chrome, while a shared typed status-presentation map supplies labels and accents to navigation, columns, and cards. Existing board, card, shared fields, and dialog components retain their behavior and receive focused semantic and Tailwind changes.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Clerk, TanStack Query, TanStack Router, dnd-kit, Vitest, Testing Library

## Global Constraints

- Work directly on the user-approved `dev` branch and preserve all unrelated modified and untracked files.
- Follow test-driven development for every behavior or semantic change: add a focused failing test, verify RED for the intended reason, implement the minimum change, then verify GREEN.
- Do not add dependencies or modify Clerk configuration, Supabase code, database migrations, environment files, API contracts, mutation logic, reorder calculations, or `src/routeTree.gen.ts`.
- Preserve Add, Detail, save, cancel, delete confirmation, optimistic drag-and-drop, pending/error states, and opener focus restoration.
- Use Tailwind CSS v4 utilities and semantic CSS tokens in `src/index.css`; do not add a Tailwind configuration file.
- Primary text is `#1E1F21`; secondary text is `#6D6E6F`; hover is `#EDEAE9`; surface is `#F9F8F8`; border is `#E3E0DF`; canvas is `#FFFFFF`.
- Primary action is `#FF584A` with `#1E1F21` text and `#EE4E42` hover. Focus/link/active is `#4573D2`; danger is `#C92F54`; success is `#0D7F56`.
- Status colors are Saved `#6A67CE`, Applied `#1AAFD0`, Interview `#FFB900`, Offer `#3BE8B0`, and Rejected `#FC636B`.
- Do not communicate state by color alone. Keep status, error, pending, and unavailable states available as text or accessible names.
- At widths below 768px, hide the desktop rail/sidebar and stack all five status sections vertically. At 768px and wider, show the 64px rail, 224px sidebar, and horizontally scrolling 304px columns.
- Pause for user review after each of the four pass checkpoints. Do not start the next pass until the user approves the current pass.
- Tests may assert a single breakpoint-critical class or semantic token, but must not snapshot or assert long Tailwind class strings.

---

## Pass 1 — Board and Column Layout

### Task 1: Define semantic color tokens and status presentation

**Files:**
- Create: `src/lib/jobApplicationStatusPresentation.ts`
- Create: `src/lib/jobApplicationStatusPresentation.test.ts`
- Modify: `src/index.css`

**Interfaces:**

```ts
import type { JobApplicationStatus } from "../types/database";

export type JobApplicationStatusPresentation = {
  label: string;
  indicatorClassName: string;
};

export const JOB_APPLICATION_STATUS_ORDER: readonly JobApplicationStatus[];
export const JOB_APPLICATION_STATUS_PRESENTATION: Readonly<
  Record<JobApplicationStatus, JobApplicationStatusPresentation>
>;
```

- [ ] **Step 1: Write the failing presentation-map test**

```ts
import { describe, expect, it } from "vitest";
import {
  JOB_APPLICATION_STATUS_ORDER,
  JOB_APPLICATION_STATUS_PRESENTATION,
} from "./jobApplicationStatusPresentation";

describe("job application status presentation", () => {
  it("defines every stage in workflow order with a visible label and accent", () => {
    expect(JOB_APPLICATION_STATUS_ORDER).toEqual([
      "saved",
      "applied",
      "interview",
      "offer",
      "rejected",
    ]);
    expect(
      JOB_APPLICATION_STATUS_ORDER.map(
        (status) => JOB_APPLICATION_STATUS_PRESENTATION[status].label,
      ),
    ).toEqual(["Saved", "Applied", "Interview", "Offer", "Rejected"]);
    expect(
      JOB_APPLICATION_STATUS_ORDER.every(
        (status) =>
          JOB_APPLICATION_STATUS_PRESENTATION[status].indicatorClassName.length > 0,
      ),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npx.cmd vitest run src/lib/jobApplicationStatusPresentation.test.ts
```

Expected: FAIL because the presentation module does not exist.

- [ ] **Step 3: Implement the typed map and Tailwind theme tokens**

Use static class strings so Tailwind discovers every status utility:

```ts
export const JOB_APPLICATION_STATUS_ORDER = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const satisfies readonly JobApplicationStatus[];

export const JOB_APPLICATION_STATUS_PRESENTATION = {
  saved: { label: "Saved", indicatorClassName: "bg-status-saved" },
  applied: { label: "Applied", indicatorClassName: "bg-status-applied" },
  interview: { label: "Interview", indicatorClassName: "bg-status-interview" },
  offer: { label: "Offer", indicatorClassName: "bg-status-offer" },
  rejected: { label: "Rejected", indicatorClassName: "bg-status-rejected" },
} as const satisfies Readonly<
  Record<JobApplicationStatus, JobApplicationStatusPresentation>
>;
```

Extend `src/index.css` without adding component-specific CSS:

```css
@import "tailwindcss";

@theme {
  --color-ink: #1e1f21;
  --color-muted: #6d6e6f;
  --color-hover: #edeae9;
  --color-surface: #f9f8f8;
  --color-line: #e3e0df;
  --color-canvas: #ffffff;
  --color-primary: #ff584a;
  --color-primary-hover: #ee4e42;
  --color-focus: #4573d2;
  --color-danger: #c92f54;
  --color-success: #0d7f56;
  --color-status-saved: #6a67ce;
  --color-status-applied: #1aafd0;
  --color-status-interview: #ffb900;
  --color-status-offer: #3be8b0;
  --color-status-rejected: #fc636b;
}

:root {
  color: var(--color-ink);
  background: var(--color-canvas);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

- [ ] **Step 4: Verify GREEN and commit Task 1**

```powershell
npx.cmd vitest run src/lib/jobApplicationStatusPresentation.test.ts
git diff --check
git add src/index.css src/lib/jobApplicationStatusPresentation.ts src/lib/jobApplicationStatusPresentation.test.ts
git commit -m "style: define Job Buddy design tokens"
```

Expected: the focused test passes and only the token/map files are committed.

---

### Task 2: Build the desktop application shell and navigation

**Files:**
- Create: `src/layouts/ApplicationShell/ApplicationShell.tsx`
- Create: `src/layouts/ApplicationShell/ApplicationShell.test.tsx`
- Create: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`
- Create: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**

```ts
export type ApplicationStageCounts = Record<JobApplicationStatus, number>;

type ApplicationNavigationProps = {
  accountMenu: ReactNode;
  isAddDisabled: boolean;
  onAddApplication: (opener: HTMLButtonElement) => void;
  stageCounts: ApplicationStageCounts;
};

type ApplicationShellProps = PropsWithChildren<{
  navigation: ReactNode;
}>;
```

- [ ] **Step 1: Write failing navigation and shell tests**

Test the organism with a count fixture and assert:

```ts
expect(screen.getByRole("navigation", { name: "Applications" })).toBeVisible();
expect(screen.getByText("Saved").closest("li")).toHaveTextContent("2");
expect(screen.getByText("Interview").closest("li")).toHaveTextContent("1");
expect(screen.getByRole("link", { name: "Applications" })).toHaveAttribute(
  "aria-current",
  "page",
);
for (const name of ["Stats — Soon", "Reminders — Soon", "Export — Soon"]) {
  expect(screen.getByRole("button", { name })).toBeDisabled();
}
```

Click the desktop `Add application` button and assert that `onAddApplication` receives `event.currentTarget`. Render `ApplicationShell` and assert that its `navigation` and `<main>` child are both present.

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/layouts/ApplicationShell/ApplicationShell.test.tsx
```

Expected: FAIL because both components are missing.

- [ ] **Step 3: Implement the desktop shell and sidebar**

`ApplicationShell` renders a flex workspace with the navigation sibling and a flexible `<main>` region. `ApplicationNavigation` renders:

- A desktop-only 64px rail with a text or CSS `JB` mark, `aria-label="Job Buddy workspace"`, and one non-interactive Applications workspace indicator marked as current. Do not add fake controls for unsupported workspaces.
- A desktop-only 224px sidebar with Job Buddy branding, the coral Add action, active Applications link, disabled future controls, stage summary, and the supplied Clerk account menu at the bottom.
- Semantic `<nav aria-label="Applications">`, `<ul>`, buttons, and `aria-current="page"`.
- No functional links for Stats, Reminders, or Export.

Use a small internal `StageSummary` renderer rather than duplicating count markup. Read labels and accents from `JOB_APPLICATION_STATUS_PRESENTATION` and order from `JOB_APPLICATION_STATUS_ORDER`.

- [ ] **Step 4: Add failing page integration tests**

Extend the page suite to assert:

```ts
const navigation = screen.getByRole("navigation", { name: "Applications" });
expect(navigation).toBeVisible();
expect(within(navigation).getByRole("link", { name: "Applications" })).toHaveAttribute(
  "aria-current",
  "page",
);
expect(within(navigation).getByText("Saved").closest("li")).toHaveTextContent("1");
expect(within(navigation).getByText("Interview").closest("li")).toHaveTextContent("1");
```

Replace the single fixed Add-button ref assumption with an opener-based test: click the sidebar Add button, cancel the modal, and expect that exact button to regain focus.

- [ ] **Step 5: Run the page test and verify RED**

```powershell
npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
```

Expected: the new shell/sidebar/count assertions fail against the current page header.

- [ ] **Step 6: Wire the shell without changing data ownership**

In `KanbanBoardPage` derive counts from `applicationsQuery.data ?? []`:

```ts
const stageCounts = JOB_APPLICATION_STATUS_ORDER.reduce<ApplicationStageCounts>(
  (counts, status) => ({
    ...counts,
    [status]: applications.filter(
      (application) => application.status === status,
    ).length,
  }),
  { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 },
);
```

Replace `addApplicationButtonRef` with `addApplicationOpenerRef`. `handleOpenAddApplication(opener)` stores the exact button, resets stale create state, and opens the modal. The existing animation-frame close effect focuses `addApplicationOpenerRef.current`. Pass `<UserButton />`, counts, pending state, and the opener callback into `ApplicationNavigation`; wrap the page content in `ApplicationShell`.

Import `ApplicationStageCounts` as a type from `ApplicationNavigation` so the page reducer and organism prop use the same exact count contract.

Keep the page heading and description in a compact main-workspace header. Do not move query/mutation logic into either new component.

- [ ] **Step 7: Verify focused suites and commit Task 2**

```powershell
npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/layouts/ApplicationShell/ApplicationShell.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git diff --check
git add src/layouts/ApplicationShell/ApplicationShell.tsx src/layouts/ApplicationShell/ApplicationShell.test.tsx src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git commit -m "style: add application workspace shell"
```

Expected: the new structure and every existing Add/Detail page workflow pass.

---

### Task 3: Restyle the board columns, counts, and empty states

**Files:**
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanColumn.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.test.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`

**Interfaces:** no public prop changes. `KanbanBoard` consumes the shared status order/presentation map instead of its local `KANBAN_COLUMNS` constant.

- [ ] **Step 1: Write failing column-copy and grouping tests**

Update the board test to require inline count headings and the new empty copy:

```ts
expect(screen.getByRole("heading", { name: "Saved (1)" })).toBeVisible();
expect(screen.getByRole("heading", { name: "Interview (1)" })).toBeVisible();
expect(screen.getByRole("region", { name: "Offer (0)" })).toHaveTextContent(
  "No applications yet",
);
```

Keep the existing assertions that cards are grouped under the correct regions and their open callbacks work.

- [ ] **Step 2: Run the board suite and verify RED**

```powershell
npx.cmd vitest run src/components/organisms/KanbanBoard/KanbanBoard.test.tsx
```

Expected: FAIL because headings use separate count pills and empty columns say `Drop a card here`.

- [ ] **Step 3: Implement the desktop board and column surfaces**

- Render the board as a horizontal flex row with 16px gaps and an intrinsic minimum width.
- Wrap each column in a 304px (`w-[19rem]`) non-shrinking container.
- Give the board canvas horizontal overflow in the page and quiet bottom padding.
- Render each heading as `${label} (${applications.length})` with a supplemental status dot.
- Use `bg-surface`, `border-line`, `text-ink`, and `text-muted` tokens.
- Replace the empty copy with `No applications yet` in a neutral dashed target.
- Use focus blue for the active drop target and keep the column's minimum drop height.
- Add `motion-reduce:transition-none` to column drop-state transitions.
- Preserve `SortableContext`, droppable IDs, sorting strategy, active overlay, and all callbacks unchanged.

- [ ] **Step 4: Verify Pass 1 behavior and commit Task 3**

```powershell
npx.cmd vitest run src/lib/jobApplicationStatusPresentation.test.ts src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/layouts/ApplicationShell/ApplicationShell.test.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
npm.cmd run lint
npm.cmd run build
git diff --check
git add src/components/organisms/KanbanBoard/KanbanBoard.tsx src/components/organisms/KanbanBoard/KanbanColumn.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.tsx
git commit -m "style: refine Kanban column layout"
```

- [ ] **Step 5: Browser-review checkpoint — pause after Pass 1**

Start Vite with `npm.cmd run dev`. At a 1440px signed-in viewport, confirm the 64px rail, 224px sidebar, stage counts, fixed-width columns, inline column counts, calm surfaces, horizontal board scrolling, and `No applications yet` empty state. Confirm the console has no errors.

**STOP. Report changed files and verification results, then wait for explicit user approval before Pass 2.**

---

## Pass 2 — Card Styling

### Task 4: Add card hierarchy, date metadata, and URL indicator

**Files:**
- Modify: `src/components/molecules/JobApplicationCard/JobApplicationCard.tsx`
- Modify: `src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx`

**Interfaces:** no prop changes. Add a local pure helper:

```ts
function formatAppliedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}
```

- [ ] **Step 1: Write failing metadata tests**

Create a card fixture with `applied_date: "2026-08-10"` and a non-null `job_url`, then assert:

```ts
expect(screen.getByText("Applied Aug 10, 2026")).toBeVisible();
expect(screen.getByLabelText("Job URL available")).toBeVisible();
expect(screen.queryByRole("link")).not.toBeInTheDocument();
```

Render the null-metadata fixture and assert neither the Applied line nor URL indicator is present. Keep the existing open-button, drag-handle, disabled, and preview tests.

- [ ] **Step 2: Run the card suite and verify RED**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx
```

Expected: metadata assertions fail because the card currently renders only position, company, and a generic dot.

- [ ] **Step 3: Implement the approved card anatomy**

- Keep span-only phrasing content inside the open button so the existing semantic regression remains valid.
- Render Position first with stronger size/weight, Company second, then a muted metadata row only when date or URL exists.
- Render `Applied {formattedDate}` only for a non-null date.
- Render a small inline SVG external-link indicator inside a non-interactive span with `aria-label="Job URL available"`; do not create a nested anchor or expose the raw URL.
- Use the shared status indicator class and an accessible `Status: {label}` name.
- Keep the drag handle a separate full-height button with a visible glyph, 44px minimum target, `touch-none`, and blue focus ring.
- Use restrained border/elevation, hover surface, dragging opacity, and a small rotated overlay without changing sortable listeners or transforms.
- Apply `motion-reduce:transition-none` to card movement and hover transitions.

- [ ] **Step 4: Verify Pass 2 and commit**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
npm.cmd run lint
npm.cmd run build
git diff --check
git add src/components/molecules/JobApplicationCard/JobApplicationCard.tsx src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx
git commit -m "style: refine application cards"
```

- [ ] **Step 5: Browser-review checkpoint — pause after Pass 2**

At 1440px, inspect cards with and without dates/URLs. Confirm Position is primary, Company is secondary, metadata is quiet, the URL indicator is not clickable, open and drag controls remain distinct, focus is blue, and dragging/reordering still works without opening the Detail dialog.

**STOP. Report changed files and verification results, then wait for explicit user approval before Pass 3.**

---

## Pass 3 — Modal and Form Styling

### Task 5: Create the shared responsive field layout

**Files:**
- Modify: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx`
- Modify: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx`

**Interfaces:** existing props remain unchanged. The molecule gains one semantic wrapper with `role="group"`, `aria-label="Application details"`, and the responsive grid classes described in Step 3.

- [ ] **Step 1: Write the failing semantic-layout test**

```ts
const details = screen.getByRole("group", { name: "Application details" });
for (const label of [
  "Company",
  "Position",
  "Job URL",
  "Status",
  "Applied date",
  "Notes",
  "Resume version",
]) {
  expect(within(details).getByLabelText(label)).toBeVisible();
}
```

Retain every value, option, disabled, change callback, ref callback, and ARIA error test.

- [ ] **Step 2: Run the field suite and verify RED**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx
```

Expected: FAIL because there is no named Application details group.

- [ ] **Step 3: Implement shared control styling and responsive spans**

- Wrap fields in a one-column grid that becomes two columns at `md`.
- Company/Position and Status/Applied Date each occupy paired columns at `md`.
- Job URL, Notes, and Resume Version span both columns at `md`.
- Keep the exact existing DOM/focus order.
- Give single-line controls a 40px height, subtle border, white background, blue focus ring, neutral disabled surface, and danger border/error text when invalid.
- Give Notes a comfortable minimum height and vertical resize.
- Keep stable IDs, `aria-invalid`, `aria-describedby`, controlled values, and ref callbacks unchanged.

- [ ] **Step 4: Verify GREEN and commit Task 5**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
git diff --check
git add src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx
git commit -m "style: arrange application form fields"
```

---

### Task 6: Style Add and Detail dialog frames and action hierarchy

**Files:**
- Modify: `src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.tsx`
- Modify: `src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx`
- Modify: `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.tsx`
- Modify: `src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx`

**Interfaces:** public props remain unchanged. Add exact named groups: `Add application actions` for Add footer controls, `Application actions` for the normal Detail footer, and `Delete confirmation` for the confirmation controls.

- [ ] **Step 1: Write failing action-hierarchy tests**

In Add tests, assert Cancel and Add application are inside `Add application actions`. In Detail tests, assert Delete, Cancel, and Save changes are inside `Application actions`; after clicking Delete, assert Cancel delete and Confirm delete are inside `Delete confirmation` and focus still moves to Confirm delete.

- [ ] **Step 2: Run both dialog suites and verify RED**

```powershell
npx.cmd vitest run src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
```

Expected: named action-group assertions fail; existing functional tests remain green.

- [ ] **Step 3: Style the Add dialog**

- Use a near-full viewport width below `md`, `max-w-2xl` at larger sizes, `max-h-[calc(100dvh-1rem)]`, quiet border, restrained shadow, and neutral backdrop.
- Keep header, independently scrolling form body, and visible footer as separate regions.
- Style the close control as a 40px neutral icon button with blue focus.
- Keep Company initial focus and all native dialog lifecycle behavior.
- Style Cancel as neutral outline and Add application as coral with dark text; both retain disabled states.
- Render create errors in danger color with their existing friendly copy.

- [ ] **Step 4: Style the Detail dialog**

- Match Add spacing, width, scroll body, backdrop, close button, fields, and sticky/visible footer.
- Keep Delete isolated on the left as a danger-outline action.
- Keep Cancel and coral Save changes together on the right.
- Give delete confirmation a quiet danger-tinted container while retaining alert text, Confirm focus, Cancel-delete focus restoration, and pending disabling.
- Render save/delete errors in danger color without changing their copy.

- [ ] **Step 5: Verify Pass 3 and commit**

```powershell
npx.cmd vitest run src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
npm.cmd run lint
npm.cmd run build
git diff --check
git add src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.tsx src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.tsx src/components/organisms/JobApplicationDetailModal/JobApplicationDetailModal.test.tsx
git commit -m "style: refine application dialogs"
```

- [ ] **Step 6: Browser-review checkpoint — pause after Pass 3**

At 1440px, open Add and Detail dialogs. Confirm field pairing, clear labels, 40px controls, scrollable body, visible footer, Company focus, validation focus, coral Add/Save hierarchy, neutral Cancel, isolated Delete, confirmation focus, and pending/error presentation. Exercise create, edit, cancel, and delete-confirmation cancellation.

**STOP. Report changed files and verification results, then wait for explicit user approval before Pass 4.**

---

## Pass 4 — Responsive Navigation and Final Check

### Task 7: Add the mobile top bar and accessible navigation drawer

**Files:**
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:** keep `ApplicationNavigationProps` unchanged. The same `onAddApplication(opener)` contract supports both the desktop sidebar button and mobile top-bar button.

- [ ] **Step 1: Write failing mobile navigation tests**

Test these behaviors:

```ts
const menuButton = screen.getByRole("button", { name: "Open navigation" });
await user.click(menuButton);
expect(screen.getByRole("dialog", { name: "Job Buddy navigation" })).toBeVisible();
expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
```

Dispatch a cancel event and assert the drawer closes and focus returns to `menuButton`. Reopen, click Close navigation, and assert the same restoration. Click the mobile `Add application` action and assert the exact button is passed to `onAddApplication`. Verify drawer future controls remain disabled and the stage summary contains the supplied counts.

- [ ] **Step 2: Run navigation tests and verify RED**

```powershell
npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx
```

Expected: mobile top-bar and drawer queries fail because Pass 1 implemented desktop navigation only.

- [ ] **Step 3: Implement the responsive navigation organism**

- Keep the desktop rail/sidebar at `hidden md:flex`.
- Add a `md:hidden` top bar containing brand, `Open navigation`, and coral `Add application` controls.
- Render the drawer as a native `<dialog aria-label="Job Buddy navigation">` with neutral backdrop, close button, active Applications item, disabled future items, stage summary, and account menu.
- On menu activation, call `showModal()` and focus Close navigation.
- On Close or native cancel/Escape, call `close()`; after its close event, restore focus to Open navigation on the next animation frame.
- Keep the mobile Add action outside the drawer so focus restoration after the Add dialog closes returns to a connected top-bar button.
- Respect reduced motion on any drawer transition; do not add JS animation timers.

- [ ] **Step 4: Extend page focus regression for both Add entry points**

In the page test, collect the two Add buttons, open/cancel once from each, and assert that the button used for that opening regains focus. Retain all existing create ordering and modal lifecycle assertions.

- [ ] **Step 5: Verify GREEN and commit Task 7**

```powershell
npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git diff --check
git add src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx
git commit -m "feat: add responsive application navigation"
```

---

### Task 8: Stack mobile stages and complete responsive verification

**Files:**
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanColumn.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.test.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Modify only if browser verification exposes an in-scope defect: files already listed in Tasks 1–7

**Responsive class contract:**

```ts
const boardClassName =
  "flex w-full flex-col gap-4 md:min-w-max md:flex-row";
const columnWrapperClassName = "w-full md:w-[19rem] md:shrink-0";
```

- [ ] **Step 1: Write the failing breakpoint-contract test**

In `KanbanBoard.test.tsx`, locate a status region's immediate width wrapper and assert only the critical classes:

```ts
expect(savedColumn?.parentElement).toHaveClass("w-full");
expect(savedColumn?.parentElement).toHaveClass("md:w-[19rem]");
```

Keep all semantic headings, grouping, empty copy, select, and reorder-related tests unchanged.

- [ ] **Step 2: Run the board suite and verify RED**

```powershell
npx.cmd vitest run src/components/organisms/KanbanBoard/KanbanBoard.test.tsx
```

Expected: the mobile-full-width assertion fails against the desktop-only fixed-width wrapper.

- [ ] **Step 3: Implement the mobile vertical board contract**

- Below `md`, use a full-width vertical flex stack in workflow order.
- At `md` and above, switch to a horizontal intrinsic-width row with 304px non-shrinking wrappers.
- Make the page's board container full-width without horizontal overflow below `md`; enable horizontal overflow only from `md` upward.
- Reduce mobile page padding while retaining comfortable card and column spacing.
- Keep column headings, drop targets, sortable strategy, IDs, card order, and drag logic unchanged.
- Confirm dialogs already use one-column fields and near-full-screen width below `md`; fix only responsive defects found during browser verification.

- [ ] **Step 4: Run all automated verification**

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
git diff --check
git status --short
```

Expected: all tests pass, lint and production build exit successfully, no whitespace errors appear, and only known unrelated skill files plus current in-scope files are present. Do not stage unrelated changes.

- [ ] **Step 5: Verify the signed-in 1440px desktop flow**

Start Vite with `npm.cmd run dev`, then use the signed-in browser session:

1. Confirm the 64px rail, 224px sidebar, stage summary, coral Add action, fixed 304px columns, inline counts, and horizontal board scrolling.
2. Confirm empty columns show `No applications yet`.
3. Open, create, cancel, edit, save, and cancel delete confirmation.
4. Drag a card within and between columns; confirm immediate movement and persisted order after refresh.
5. Confirm keyboard focus is visible and blue, Rejected uses only a small pastel accent, and no console errors occur.

- [ ] **Step 6: Verify the signed-in 390px mobile flow**

At a 390px viewport:

1. Confirm no page-level horizontal scrollbar.
2. Confirm the desktop rail/sidebar are absent and the top bar is usable.
3. Open the drawer, verify close focus, counts, disabled Soon items, account menu, Escape close, and opener focus restoration.
4. Confirm Saved, Applied, Interview, Offer, and Rejected stack vertically at full width in that order.
5. Open Add and Detail; confirm single-column fields, reachable footer actions, correct focus, validation messages, and no viewport clipping.
6. Confirm card open and drag controls remain distinct and all tap targets are usable.

- [ ] **Step 7: Commit responsive implementation**

```powershell
git diff --check
git add src/components/organisms/KanbanBoard/KanbanBoard.tsx src/components/organisms/KanbanBoard/KanbanColumn.tsx src/components/organisms/KanbanBoard/KanbanBoard.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.tsx
git commit -m "style: complete responsive Kanban workspace"
```

If browser verification required a fix in another already-listed component, include only that in-scope file and its focused test in this commit after rerunning the relevant focused test and the full verification commands.

- [ ] **Step 8: Final review checkpoint — pause after Pass 4**

Compare the result against `docs/superpowers/specs/2026-08-12-tailwind-styling-pass-design.md`. Report every changed file, commit, automated check, desktop/mobile browser result, and any remaining visual risk.

**STOP. Wait for explicit user acceptance of the completed styling pass.**
