# Tailwind Styling Pass Design

## Goal

Give Job Buddy a calm, Asana-inspired application workspace while preserving the working Clerk authentication, Supabase data flow, drag-and-drop behavior, card detail modal, and Add Application workflow.

The result should feel organized and comfortable for daily job-search use. It should establish a reusable visual system, make application information easier to scan, and remain usable on desktop and mobile.

## Approved Reference Direction

The layout is informed by the authenticated Asana board screenshots supplied during design review. The public Asana URL redirects to a login page, so no automated token extraction is used. The supplied screenshots are the visual source of truth.

The approved direction uses Asana's two-level workspace navigation pattern rather than copying the product literally:

- A narrow 64px icon rail on desktop.
- A 224px application sidebar immediately to its right.
- The Kanban board occupies the remaining workspace.
- The interface uses the approved light color system, not the dark theme shown in the first layout reference.

## Scope

This styling phase includes:

- The desktop application shell, icon rail, and application sidebar.
- Board and column layout.
- Card typography, metadata, interaction states, and drag handle presentation.
- Detail Modal and Add Application form styling.
- A mobile top bar and hamburger drawer.
- Desktop horizontal columns and mobile vertically stacked status sections.
- Accessible focus, disabled, pending, error, and destructive-action states.

This phase does not add functional Stats, Reminders, or Export pages. Those entries appear as disabled future-navigation items labeled `Soon`. It does not change authentication, routing, Supabase contracts, mutations, database migrations, or drag-and-drop calculations.

## Design Tokens

### Neutral interface colors

- Primary text and icons: `#1E1F21`
- Secondary text and weak icons: `#6D6E6F`
- Hover background: `#EDEAE9`
- Subtle surfaces: `#F9F8F8`
- Visible neutral borders: `#E3E0DF`
- Main background: `#FFFFFF`

### Semantic and interactive colors

- Primary action: `#FF584A`
- Primary action hover: `#EE4E42`
- Focus rings, links, and active navigation: `#4573D2`
- Destructive actions and errors: `#C92F54`
- Success text and completion semantics: `#0D7F56`

Primary coral buttons use `#1E1F21` text because that pairing is more readable than white text on `#FF584A`. Coral is reserved for primary workflow actions such as Add Application and Save. Blue remains the stable interaction and focus color. Delete uses a distinct danger outline treatment and is never visually interchangeable with Save.

### Status colors

- Saved: `#6A67CE`
- Applied: `#1AAFD0`
- Interview: `#FFB900`
- Offer: `#3BE8B0`
- Rejected: `#FC636B`

Status colors appear as small indicators and supporting accents. They do not fill entire columns. Rejected therefore remains calm rather than presenting a large harsh red surface. Every status remains available as text, so meaning never depends on color alone.

## Application Shell and Sidebar

Create a reusable application sidebar organism and keep route data ownership in `KanbanBoardPage`.

On desktop, the shell has three regions:

1. A 64px icon rail with compact workspace-level controls.
2. A 224px application sidebar.
3. A flexible main workspace containing the page header and board.

The application sidebar contains:

- Job Buddy branding.
- A prominent coral `Add application` action.
- An active `Applications` item.
- `Stats`, `Reminders`, and `Export` items marked `Soon` and rendered as disabled, non-navigation controls.
- A compact stage summary using the current application counts and status indicators.
- The signed-in account area anchored near the bottom.

The page continues to own application data, modal state, and create/update/delete mutations. It passes counts and callbacks into the sidebar. The sidebar does not fetch data or own workflow state.

## Board and Column Layout

The desktop board is a horizontal row of 304px fixed-width columns within an overflow canvas. Columns do not shrink to fit the viewport. This preserves readable cards and the familiar Kanban relationship between stages.

Each column has:

- An inline heading and count, for example `Interview (3)`.
- A small status-color indicator.
- A quiet neutral surface with clear separation from the workspace.
- A minimum drop area that remains usable when empty.
- The empty message `No applications yet`.

Drop targets use a blue outline or surface change. Coral is not used for drag-and-drop feedback because it is reserved for primary actions.

## Card Anatomy

Cards use a white or near-white surface with a subtle border and restrained elevation. Information hierarchy is:

1. Position as the primary line, larger and bolder.
2. Company as the secondary line, semibold and slightly smaller.
3. Optional metadata in muted text.

Metadata includes:

- Applied date when present.
- A small, non-interactive external-link indicator when `job_url` is present. It includes visually hidden `Job URL available` copy and does not create a nested link inside the card-open control.

The status remains represented through the surrounding column and a small status indicator. The card retains a dedicated drag handle on the right so opening details and starting a drag remain distinct actions. Hover, keyboard focus, active drag, and drop-target states must be visually distinguishable without large shadows or high-contrast surfaces.

## Detail Modal and Add Form

The two dialogs share the same field styling and spacing through the existing shared form-fields component.

### Field layout

- Clear labels above controls.
- A 40px control height for single-line fields.
- Company and Position share a two-column row on larger screens.
- Status and Applied Date share a second two-column row.
- Remaining fields use the available width.
- On mobile, every field becomes one full-width column.
- Validation messages remain connected with `aria-describedby`, and invalid fields retain `aria-invalid`.

### Add Application dialog

Company and Position are visually prioritized for fast entry. Optional fields remain visible but quieter. Company keeps initial focus. The footer places neutral Cancel beside the coral `Add application` action.

### Detail dialog

The body scrolls independently when its content exceeds the available height while the footer remains visible. Delete sits alone on the left as a danger-outline control. Cancel and the coral Save action sit on the right. The separation and color hierarchy reduce the chance of an accidental delete.

Existing pending-state disabling, delete confirmation, Escape behavior, validation focus, and opener focus restoration remain unchanged.

## Responsive Behavior

The approved mobile behavior intentionally replaces the original horizontal-column requirement.

Below the Tailwind `md` breakpoint of 768px:

- The desktop icon rail and sidebar are replaced by a compact top app bar.
- A hamburger button opens the application navigation as a drawer.
- The drawer contains the same active, future, stage-summary, and account information as the desktop sidebar.
- All five status sections stack vertically at full width in workflow order: Saved, Applied, Interview, Offer, Rejected.
- Cards use the full available content width.
- Dialogs become near-full-screen panels with single-column fields and a footer that stays reachable.

At 768px and wider, the two-level sidebar and fixed-width horizontally scrolling board remain active. The responsive transition must not change application ordering, status, modal state, or mutation behavior.

## Component Boundaries

Follow the repository's Atomic Design conventions:

- `KanbanBoardPage` remains the page-level coordinator for queries, mutations, counts, and modal state.
- A new sidebar organism owns application navigation presentation only.
- A new `ApplicationShell` layout arranges desktop navigation, mobile navigation, and main content without owning feature data.
- Existing `KanbanBoard`, `KanbanColumn`, `JobApplicationCard`, `JobApplicationDetailModal`, `AddJobApplicationModal`, and shared form fields keep their current responsibilities.
- A shared typed status-style map provides labels and visual tokens to sidebar, columns, and cards.

Do not introduce a generic component abstraction unless at least two existing consumers need the same behavior. Styling should primarily use Tailwind CSS v4 utilities and shared CSS custom properties in the minimal global stylesheet when semantic tokens prevent duplication.

## Accessibility and Interaction Requirements

- Visible focus uses the approved blue and remains clear on every surface.
- Primary, secondary, and destructive buttons remain distinguishable by text, placement, and shape as well as color.
- Disabled `Soon` entries are not focusable fake links and expose their unavailable state semantically.
- The mobile drawer has an accessible name, keyboard-operable close control, Escape support, and appropriate focus management.
- Status is always written as text; colored indicators are supplemental.
- External-link icons have accessible labels and adequate targets without competing with the card-open action.
- Existing drag handle keyboard behavior and dialog focus behavior must not regress.
- Motion is subtle and respects reduced-motion preferences.

## Implementation Passes and Review Gates

Implementation proceeds in four user-reviewable passes. Work pauses after each pass so the user can test before the next begins.

1. **Board and column layout:** application shell, desktop sidebar, page header, board canvas, column surfaces, inline counts, and empty states.
2. **Card styling:** typography, metadata, URL icon, status accents, hover/focus/drag presentation.
3. **Modal and form styling:** shared controls, spacing, footer hierarchy, coral primary actions, neutral Cancel, distinct Delete.
4. **Responsive check:** mobile top bar and drawer, vertical status sections, mobile dialogs, desktop/mobile browser verification, and final responsive fixes.

Pass boundaries are visual and structural only. Functional regressions discovered during a pass are fixed before pausing for review.

## Testing and Verification

Tests should verify visible copy, semantic roles, accessible states, drawer behavior, and preserved workflows. They should avoid asserting long Tailwind class strings or implementation-specific visual details.

Verification includes:

- Focused component and page tests for changed structures.
- The full test suite.
- ESLint.
- Production build.
- Signed-in browser checks at a 1440px desktop viewport and a 390px mobile viewport.
- Manual confirmation that cards can still open, drag, reorder, create, save, cancel, and delete.
- Manual confirmation that an empty column shows `No applications yet`.
- Manual confirmation that desktop columns scroll horizontally while mobile status sections stack vertically.
- Browser console inspection for errors during affected workflows.

The styling pass is complete only when all four review gates are approved and the final verification passes.
