# Month Interview Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Monday-first, read-only monthly interview calendar at `/calendar` with navigation and event rows.

**Architecture:** A new month-scoped interview hook reads one local calendar-month range. A reusable calendar organism calculates the stable six-week grid and renders event rows. The page combines it with the existing shell, navigation, and job-application query.

**Tech Stack:** React 19, TypeScript, TanStack Query, TanStack Router, Supabase, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

## Global Constraints

- Week starts on Monday; month grid always has 42 date cells.
- Do not add packages or copy Untitled UI licensed source code.
- Do not build event detail/link behavior; that is phase 4.
- Preserve unrelated dirty files and do not manually edit `src/routeTree.gen.ts`.
- Query uses inclusive local-month start and exclusive next-month start ISO timestamps.

---

## File Structure

- Modify `src/hooks/useInterviews.ts` and `.test.tsx`: month key and query.
- Create `src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.tsx` and `.test.tsx`: grid and controls.
- Modify `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx` and `.test.tsx`: Calendar destination.
- Create `src/pages/InterviewCalendarPage/InterviewCalendarPage.tsx` and `.test.tsx`: data composition and states.
- Create `src/routes/calendar.tsx`: file route.

## Task 1: Add the month-scoped interview query

**Files:**
- Modify: `src/hooks/useInterviews.ts`
- Modify: `src/hooks/useInterviews.test.tsx`

**Consumes:** Clerk `useAuth`, `useSupabaseClient`, `Interview`.

**Produces:**

```ts
interviewKeys.month(monthStartIso: string, userId: string)
useInterviewsForMonth(month: Date)
```

- [ ] **Step 1: Write a failing hook test**

Render `useInterviewsForMonth(new Date(2026, 7, 1))` and require the mocked Supabase chain to receive:

```tsx
expect(gte).toHaveBeenCalledWith("scheduled_at", "2026-08-01T00:00:00.000Z");
expect(lt).toHaveBeenCalledWith("scheduled_at", "2026-09-01T00:00:00.000Z");
expect(order).toHaveBeenCalledWith("scheduled_at", { ascending: true });
```

Set a stable UTC time zone or derive expected ISO values from matching local `Date` instances.

- [ ] **Step 2: Prove the test fails**

Run `npx.cmd vitest run src/hooks/useInterviews.test.tsx --reporter=dot`.

Expected: the missing `useInterviewsForMonth` export fails.

- [ ] **Step 3: Implement the smallest hook**

Add:

```ts
month: (monthStartIso: string, userId: string) =>
  [...interviewKeys.all, "month", monthStartIso, userId] as const,

function getMonthRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}
```

`useInterviewsForMonth` uses that key, checks `isLoaded && Boolean(userId)`, and calls `from("interviews").select("*").gte("scheduled_at", startIso).lt("scheduled_at", endIso).order("scheduled_at", { ascending: true })`.

- [ ] **Step 4: Extend mock chain and verify GREEN**

Add `gte` and `lt` to the existing mock; resolve `{ data: [], error: null }` after order. Run `npx.cmd vitest run src/hooks/useInterviews.test.tsx --reporter=dot`.

Expected: all existing and new hook tests pass.

- [ ] **Step 5: Commit Task 1**

```powershell
git add -- src/hooks/useInterviews.ts src/hooks/useInterviews.test.tsx
git commit -m "feat: query interviews by month"
```

## Task 2: Create the reusable monthly grid

**Files:**
- Create: `src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.tsx`
- Create: `src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.test.tsx`

**Consumes:** `Interview`, a `ReadonlyMap<string, { company: string; position: string }>`, selected month.

**Produces:**

```ts
type MonthInterviewCalendarProps = {
  interviews: Interview[];
  applicationLabels: ReadonlyMap<string, { company: string; position: string }>;
  month: Date;
  onMonthChange: (month: Date) => void;
};
```

- [ ] **Step 1: Write failing calendar tests**

Use August 2026 plus a `2026-08-11T09:30:00.000Z` interview. Assert `getAllByRole("gridcell")` has length 42, weekday headers begin with `Mon`, an event has `09:30 · Acme · Technical`, and controls labelled `Previous month`, `Next month`, and `Today` call `onMonthChange` with first-day month dates. Freeze `Date` and verify today has an accessible `Today` marker.

- [ ] **Step 2: Prove tests fail**

Run `npx.cmd vitest run src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.test.tsx --reporter=dot`.

Expected: module cannot be resolved.

- [ ] **Step 3: Implement grid calculation and controls**

Use:

```ts
function startOfCalendarGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return first;
}
const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
```

Render a `role="grid"`, weekday headings, and 42 `role="gridcell"` sections. The three buttons call `onMonthChange` with previous, next, or current first-of-month dates. Use `bg-canvas`, `bg-surface`, `border-line`, `text-ink`, `text-muted`, and visible focus tokens.

- [ ] **Step 4: Implement events and responsive container**

Group using a local `YYYY-MM-DD` key. Each cell shows at most two local-time event rows, calculated with `Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" })`; a third indicator displays `+N more`. Resolve absent applications as `Untitled application`. Each passive row receives an aria label with time, company, position, and round. Wrap the minimum-width seven-column grid in `overflow-x-auto` for small screens. Do not make events clickable.

- [ ] **Step 5: Verify GREEN and commit Task 2**

Run `npx.cmd vitest run src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.test.tsx --reporter=dot`.

Expected: grid, today, events, overflow, and month controls pass.

```powershell
git add -- src/components/organisms/MonthInterviewCalendar
git commit -m "feat: add month interview calendar"
```

## Task 3: Integrate route, page, and navigation

**Files:**
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`
- Create: `src/pages/InterviewCalendarPage/InterviewCalendarPage.tsx`
- Create: `src/pages/InterviewCalendarPage/InterviewCalendarPage.test.tsx`
- Create: `src/routes/calendar.tsx`

**Consumes:** `useInterviewsForMonth`, `useJobApplications`, `MonthInterviewCalendar`, ApplicationShell.

**Produces:** `/calendar` with `activeDestination="calendar"`.

- [ ] **Step 1: Write failing navigation and page tests**

Navigation tests assert Calendar desktop/mobile links have `href="/calendar"`, and active Calendar gets `aria-current="page"`. Page tests mock the two queries and assert loading `role="status"`, error `role="alert"`, empty copy `No interviews scheduled this month.`, and a populated event mapped to its application company and round. Mock ApplicationShell/navigation/calendar organism only at page level.

- [ ] **Step 2: Prove tests fail**

Run:

```powershell
npx.cmd vitest run src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/InterviewCalendarPage/InterviewCalendarPage.test.tsx --reporter=dot
```

Expected: Calendar destination and page are absent.

- [ ] **Step 3: Add Calendar navigation**

Import `CalendarDays`; extend destination unions with `"calendar"`; create desktop item `{ label: "Calendar", icon: <CalendarDays className="size-4" />, href: "/calendar", isActive: activeDestination === "calendar" }`; add matching mobile anchor after Resumes. Preserve existing collapsed icon-only behavior and disabled links.

- [ ] **Step 4: Build page and file route**

Page keeps selected month via `useState(() => new Date())`, calculates stage counts with existing `JOB_APPLICATION_STATUS_ORDER.reduce`, and maps applications:

```ts
const applicationLabels = new Map(
  applications.map(({ id, company, position }) => [id, { company, position }]),
);
```

Use the same ApplicationShell, WorkspaceEngineeringGrid, header, and sidebar trigger structure as ResumeLibraryPage. Pass `activeDestination="calendar"`. Render the calendar for successful nonempty data; show dedicated loading, error, and empty states. Application-query errors do not suppress interview results, because Task 2 provides a fallback label.

Create route:

```tsx
export const Route = createFileRoute("/calendar")({ component: InterviewCalendarPage });
```

Do not edit `routeTree.gen.ts`; regenerate it via Vite/build.

- [ ] **Step 5: Verify focused tests**

Run the Task 3 test command again.

Expected: Calendar navigation and all page states pass.

- [ ] **Step 6: Full verification and scoped commit**

Run:

```powershell
npx.cmd vitest run --reporter=dot
npm.cmd run lint
npm.cmd run build
git diff --check
```

Expected: all checks pass. A non-failing Vite chunk-size advisory is acceptable.

```powershell
git add -- src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx src/pages/InterviewCalendarPage src/routes/calendar.tsx src/routeTree.gen.ts
git commit -m "feat: add interview calendar page"
```

