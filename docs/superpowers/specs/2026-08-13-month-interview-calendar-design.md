# Month Interview Calendar Design

## Goal

Add a dedicated, read-focused Calendar page where a signed-in user can scan every interview scheduled during a selected month. The page complements the Kanban board without changing any application or interview records.

## User Experience

`/calendar` opens inside the existing ApplicationShell. Calendar is a selectable destination in both the expanded/collapsed desktop sidebar and the mobile navigation.

The page follows the established Workspace header treatment and presents a month heading with Previous month, Next month, and Today controls. The calendar uses a Monday-first seven-column grid and always renders six weeks, so the layout stays stable when the selected month changes. Dates outside the selected month remain visible but subdued.

The current local date is visibly highlighted. A day with one or more interviews displays compact event rows containing the local time, application company, and interview round label. If a day has more rows than fit, the final row communicates the remaining count with `+N more`. The empty state says that no interviews are scheduled for the selected month.

This phase intentionally makes event rows presentational only. Event click detail and the return link to the job application remain phase 4 work.

## Data Flow

`useInterviewsForMonth(month)` will be added alongside the existing application-scoped interview hooks. It derives the first instant of the chosen local month and the first instant of the following local month, converts both to ISO timestamps, and queries the authenticated user’s `interviews` rows using an inclusive lower and exclusive upper `scheduled_at` range. Results are ordered ascending by scheduled time.

The Calendar page also uses the existing `useJobApplications()` query. A local map from application ID to company and position gives each calendar event its job context without modifying the existing Supabase relation typing or the interview schema.

Changing the visible month changes the month query key and therefore fetches that specific range. The navigation and application data remain independently cached by TanStack Query.

## Components and Route

- `src/routes/calendar.tsx`: TanStack Router file route for `/calendar`.
- `src/pages/InterviewCalendarPage/InterviewCalendarPage.tsx`: page-level selected-month state, query/error boundaries, stage-count derivation, ApplicationShell wiring, and application lookup.
- `src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.tsx`: reusable Monday-first month grid, month controls, day rendering, and event-row overflow presentation.
- `src/hooks/useInterviews.ts`: month query key and `useInterviewsForMonth` hook.
- `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`: Calendar destination and active-state typing for desktop and mobile navigation.

No schema migration or new dependency is required. The calendar is implemented with React, Tailwind, and the project’s existing icon package; it does not copy Untitled UI’s licensed source code.

## Responsive and Accessibility Behavior

The calendar remains a seven-column grid at desktop and tablet widths. On narrow screens, the page keeps each day legible through an `overflow-x-auto` calendar region rather than compressing date cells below a usable width. Month controls are semantic buttons with accessible labels and visible keyboard focus. Weekday headers use abbreviated visible labels plus full accessible names. Today is communicated textually for assistive technology in addition to visual styling.

## Error Handling

While interviews load, the calendar region announces a loading state. A failed interview query displays a retryable error message and leaves page navigation available. If applications fail while interviews load, interview rows use an explicit fallback label rather than failing the calendar. A calendar month with no interview records displays the empty state.

## Testing

- `useInterviewsForMonth` produces the expected local-month ISO range, scopes its key by user, and requests ascending scheduled time.
- The calendar starts weeks on Monday, renders a stable six-week grid, highlights today, and groups interview rows by local date.
- Month navigation and Today update the visible heading and grid.
- The Calendar page renders loading, error, empty, and populated states; it supplies application labels and marks Calendar as the active destination.
- Existing navigation tests extend to assert `/calendar` in desktop and mobile navigation.

## Non-goals

- Event detail popover/modal and event-to-application link (phase 4).
- Upcoming interviews widget (phase 5).
- Editing, deleting, or creating interview rounds from the calendar.
- External calendar synchronisation, notifications, or reminders.
