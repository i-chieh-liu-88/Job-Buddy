# Calendar Interview Event Detail Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Open a hover/focus/tap interview detail Popover from the month calendar and navigate to the linked existing job application drawer.

**Architecture:** Add the supplied beUI Popover primitive as a reusable atom, backed by a local portal-position hook. A focused event molecule owns detail presentation and action gating. The calendar delegates navigation upward; Calendar page writes a router search value; board page consumes it and opens its existing drawer.

**Tech Stack:** React 19, TypeScript, Motion, TanStack Router, Tailwind CSS v4, lucide-react, Vitest, Testing Library.

## Global Constraints

- Use the supplied beUI Popover source as the implementation basis; adapt only project imports, utility names, and theme tokens.
- Hover, keyboard focus, and touch click must open the same interview detail.
- Preserve portal rendering, goo morph, hover delay, Escape/outside close, and reduced-motion behavior.
- Event detail must not edit interviews or duplicate the job application drawer.
- Valid navigation target is /?applicationId=<id>; invalid or missing application targets do nothing.
- Do not add packages, migrations, or manually edit src/routeTree.gen.ts.

## File Structure

- Create src/components/atoms/Popover/Popover.tsx: adapted beUI primitive.
- Create src/components/atoms/Popover/usePopoverPortalPosition.ts: trigger/content measurement.
- Create src/components/atoms/Popover/Popover.test.tsx.
- Create src/components/molecules/InterviewEventPopover/InterviewEventPopover.tsx and test.
- Modify MonthInterviewCalendar component/test and InterviewCalendarPage component/test.
- Modify KanbanBoardPage component/test for deep-link drawer state.

## Task 1: Add official Popover atom and local portal positioning

**Files:**
- Create: src/components/atoms/Popover/Popover.tsx
- Create: src/components/atoms/Popover/usePopoverPortalPosition.ts
- Create: src/components/atoms/Popover/Popover.test.tsx

**Consumes:** supplied beUI Popover source, existing cn utility, existing Motion dependency.

**Produces:** Popover, PopoverTrigger, and PopoverContent, with hover and click modes.

- [ ] Step 1: Write failing primitive tests

Render a hover Popover around a button. Assert hover and focus set aria-expanded=true and mount a dialog. Assert Escape closes it. Add a click-trigger case that closes after a pointerdown outside. Mock reduced motion and assert it still opens without timing-dependent failure.

- [ ] Step 2: Run RED test

Run: npx.cmd vitest run src/components/atoms/Popover/Popover.test.tsx --reporter=dot

Expected: Popover module cannot resolve.

- [ ] Step 3: Create portal position helper

Expose a hook accepting triggerRef, contentRef, and enabled. When enabled, measure both rectangles after layout; observe them with ResizeObserver; refresh on capturing scroll and resize; disconnect and remove listeners on cleanup. Return trigger DOMRect and content width/height, or null until measured.

- [ ] Step 4: Adapt the supplied Popover source

Copy supplied Popover architecture. Replace the absent official position import with the Task 1 local helper, and the official alias utility with the project cn utility. Keep portal geometry helpers, Motion values, goo filter, clip-path fallback, 120ms hover close delay, Escape, and click-mode outside handling. Panel appearance uses bg-surface, text-ink, border-line, and shadow-lg while preserving dialog and trigger ARIA attributes.

- [ ] Step 5: Verify GREEN and commit

Run: npx.cmd vitest run src/components/atoms/Popover/Popover.test.tsx --reporter=dot

Expected: hover/focus/click/Escape/outside tests pass.

Commit:
git add -- src/components/atoms/Popover
git commit -m "feat: add animated popover primitive"

## Task 2: Add interview event Popover molecule

**Files:**
- Create: src/components/molecules/InterviewEventPopover/InterviewEventPopover.tsx
- Create: src/components/molecules/InterviewEventPopover/InterviewEventPopover.test.tsx

**Consumes:** Interview, optional application label, onOpenApplication(applicationId).

**Produces:** button trigger plus Hover Popover event detail; action omitted for absent application label.

- [ ] Step 1: Write failing molecule tests

With an interview and application label, open by focus and assert company, position, round label, full local date/time, location/link, notes, and Open application. Click action and assert callback application-1. Add an unlabeled interview case that asserts fallback company and no open action.

- [ ] Step 2: Run RED test

Run: npx.cmd vitest run src/components/molecules/InterviewEventPopover/InterviewEventPopover.test.tsx --reporter=dot

Expected: molecule module cannot resolve.

- [ ] Step 3: Implement the molecule

Use Popover trigger=hover side=bottom align=start. Trigger is a real button with concise time/company/round presentation and aria label including position. Content renders optional location and notes only when nonempty. Its action invokes onOpenApplication(interview.job_application_id) only when the label exists.

- [ ] Step 4: Verify GREEN and commit

Run: npx.cmd vitest run src/components/molecules/InterviewEventPopover/InterviewEventPopover.test.tsx --reporter=dot

Expected: fields, conditional action, and callback pass.

Commit:
git add -- src/components/molecules/InterviewEventPopover
git commit -m "feat: show interview event details"

## Task 3: Delegate calendar events and navigate from Calendar page

**Files:**
- Modify: src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.tsx
- Modify: src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.test.tsx
- Modify: src/pages/InterviewCalendarPage/InterviewCalendarPage.tsx
- Modify: src/pages/InterviewCalendarPage/InterviewCalendarPage.test.tsx

**Consumes:** InterviewEventPopover, TanStack Router useNavigate.

**Produces:** onOpenApplication(applicationId) calendar prop and root search navigation.

- [ ] Step 1: Write failing delegation and navigation tests

Update calendar render with onOpenApplication; click a rendered event Open application action and assert callback id. In page test, mock useNavigate, invoke the callback from mocked calendar, and assert navigate receives to root with applicationId search.

- [ ] Step 2: Run RED tests

Run: npx.cmd vitest run src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.test.tsx src/pages/InterviewCalendarPage/InterviewCalendarPage.test.tsx --reporter=dot

Expected: callback prop and navigation are absent.

- [ ] Step 3: Replace passive event rows

Add required onOpenApplication prop. Replace passive event div with InterviewEventPopover. Retain time grouping, overflow count, and missing-application fallback.

- [ ] Step 4: Add Calendar page navigation

Use useNavigate from TanStack Router. The open callback calls navigate to root with search applicationId. Do not mutate window.location.

- [ ] Step 5: Verify GREEN and commit

Run the Task 3 test command.

Expected: event delegation and router navigation pass.

Commit:
git add -- src/components/organisms/MonthInterviewCalendar src/pages/InterviewCalendarPage
git commit -m "feat: link calendar events to applications"

## Task 4: Consume application deep links on the Kanban board

**Files:**
- Modify: src/pages/KanbanBoardPage/KanbanBoardPage.tsx
- Modify: src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx

**Consumes:** TanStack Router useSearch and existing JobApplicationDetailDrawer selection state.

**Produces:** valid applicationId opens drawer once after applications load; invalid id leaves board unchanged.

- [ ] Step 1: Write failing deep-link tests

Mock useSearch as application-1, applications containing that id, and assert JobApplicationDetailDrawer receives open=true with it. Add missing id case and assert no drawer. Close valid drawer and assert it remains closed for current parameter lifetime.

- [ ] Step 2: Run RED test

Run: npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx --reporter=dot

Expected: no search-parameter drawer behavior.

- [ ] Step 3: Add guarded deep-link effect

Use route-scoped search API according to router typing. Store last processed id in a ref. After applications stop pending, find requested application; when valid and unprocessed, reset relevant mutation state, set selected application, and open detail. Mark invalid id processed so it cannot loop. Do not assign a card opener because Calendar is the navigation source.

- [ ] Step 4: Verify GREEN and full suite

Run:
npx.cmd vitest run src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx --reporter=dot
npx.cmd vitest run --reporter=dot
npm.cmd run lint
npm.cmd run build
git diff --check

Expected: all checks pass; non-failing Vite chunk-size advisory is acceptable.

- [ ] Step 5: Commit Task 4

Commit:
git add -- src/pages/KanbanBoardPage/KanbanBoardPage.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx src/routeTree.gen.ts
git commit -m "feat: open applications from calendar"

