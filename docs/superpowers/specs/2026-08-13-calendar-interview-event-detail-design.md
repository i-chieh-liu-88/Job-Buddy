# Calendar Interview Event Detail Design

## Goal

Let a user inspect an interview directly from the month calendar and open its linked job application detail drawer without duplicating application editing UI.

## User Experience

Every visible calendar event row becomes a compact button. On a mouse or trackpad, its Popover appears on hover and remains open while the pointer moves into the panel. Keyboard focus opens the same panel. On touch, tapping the event toggles it. Escape closes the panel; an outside pointer interaction closes it.

The panel displays the application company and position, interview round label, full local date/time, and any location/link and notes. Its primary action, `Open application`, navigates to `/?applicationId=<id>`.

The board reads `applicationId` after its application data is available. A valid ID opens the existing job detail drawer for that card. An unknown ID leaves the board unchanged. Closing the drawer returns the user to the board normally; no duplicate card detail interface is created.

## Official Popover Integration

Create a local Popover atom based on the supplied beUI official code. Preserve its portal rendering, shared trigger/panel geometry, goo morph, hover close delay, focus behavior, Escape handling, and reduced-motion fallback.

The supplied code references `usePopoverPortalPosition`, which is not included. Implement it locally as a narrow positioning helper: measure trigger and content with `getBoundingClientRect`, update through `ResizeObserver`, and refresh after scroll/resize. It returns the trigger rectangle and content dimensions required by the Popover. Project-local `cn` replaces the official alias utility, and existing Tailwind tokens provide visual colors.

## Components

- `src/components/atoms/Popover/Popover.tsx`: supplied official Popover architecture adapted only for project imports/tokens.
- `src/components/atoms/Popover/usePopoverPortalPosition.ts`: local measurement and viewport update helper.
- `src/components/molecules/InterviewEventPopover/InterviewEventPopover.tsx`: formats the interview detail content and application link action.
- `src/components/organisms/MonthInterviewCalendar/MonthInterviewCalendar.tsx`: replaces passive event divs with the molecule and forwards the selected application ID action.
- `src/pages/InterviewCalendarPage/InterviewCalendarPage.tsx`: navigates through TanStack Router to `/?applicationId=<id>`.
- `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`: consumes the search parameter and opens the existing drawer after applications load.

## Data and Navigation

No schema, RLS, or query changes are needed. Calendar data already contains each interview’s application ID; the Calendar page has the application label map. The Popover receives the complete interview plus its optional application label.

The Calendar page uses TanStack Router navigation rather than a raw location mutation. The board validates the search value against the loaded application list before it opens the drawer. It only responds once for the current parameter, avoiding reopen loops after the user closes the drawer.

## Accessibility and Responsive Behavior

Popover triggers are real buttons with `aria-haspopup="dialog"`, `aria-expanded`, and a descriptive accessible name. The panel has `role="dialog"`. Focus, Escape, and touch behavior work independently from pointer hover. The panel has a viewport-constrained maximum width and uses the portal to avoid clipping inside the horizontally scrollable calendar.

When motion is reduced, geometry changes appear without goo motion. Optional empty location and notes rows are omitted. The `Open application` action remains usable with keyboard and touch.

## Error Handling

A missing application label is rendered as `Untitled application` and `Unknown position`; the link action is omitted because the target cannot be validated. An invalid or stale `applicationId` parameter never throws or opens the drawer.

## Testing

- Popover: hover/focus/touch click open behavior, Escape and outside-close, ARIA values, reduced-motion-safe mounting.
- Interview event molecule: displays populated/optional fields and emits the correct application ID; no open action when label/target is unavailable.
- Calendar: event rows are buttons and delegate application open.
- Calendar page: navigation writes the expected search parameter.
- Board page: valid `applicationId` opens existing drawer after loading; invalid ID does nothing; close does not immediately reopen it.

## Non-goals

- Editing interview data from the popover.
- Event detail modal/drawer separate from the Popover.
- Adding an upcoming interviews widget.
- Changes to Supabase schema, policies, or external calendar integration.

