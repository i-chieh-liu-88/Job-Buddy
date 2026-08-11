# Job Application Detail Drawer Design

**Date:** 2026-08-12

## Goal

Replace the job application Detail modal with a calm, responsive drawer based on the [beUI Drawer](https://beui.dev/components/motion/drawer). Clicking a Kanban card opens the editable application details without changing the existing Supabase data flow, validation rules, mutations, or focus-restoration outcomes. The Add application workflow remains a modal.

## Approved Experience

- The Detail drawer enters from the right.
- At `md` and wider it is 520px wide.
- Below `md` it is nearly full-screen, leaving approximately 8px of viewport space.
- The drawer header and action footer stay visible while the form body scrolls independently.
- Detail fields use a single-column layout at every drawer width.
- The existing calm Jobuddy color tokens and action hierarchy remain unchanged.
- The drawer uses a spring entrance, backdrop fade and blur, body scroll lock, and a reduced-motion opacity fallback.

## Component Architecture

### Drawer primitive

Create a reusable local Drawer primitive from the public beUI source rather than initializing shadcn for the whole project. Install the source's required runtime packages:

- `motion`
- `clsx`
- `tailwind-merge`

Add the small supporting `cn` helper and shared motion constants used by the component. Keep source comments that identify the beUI origin.

The primitive exposes this controlled contract:

```ts
type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
  backdropClassName?: string;
  ariaLabel?: string;
  dismissable?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onExitComplete?: () => void;
};
```

The local adaptation preserves beUI's `AnimatePresence`, `motion`, `useReducedMotion`, backdrop, spring positioning, Escape handling, and body scroll lock. It also adds the accessibility lifecycle needed by Jobuddy:

- move focus to `initialFocusRef` after the panel mounts;
- keep Tab and Shift+Tab inside the drawer while open;
- prevent backdrop and Escape dismissal when `dismissable` is false;
- expose `role="dialog"`, `aria-modal="true"`, and an accessible name;
- restore the body's previous overflow value during cleanup.

Opener focus restoration remains owned by `KanbanBoardPage`, because only the page can resolve a moved replacement card or the heading fallback after deletion.

### Detail organism

Replace `JobApplicationDetailModal` with `JobApplicationDetailDrawer`. Preserve its public mutation props and form behavior, while replacing native `<dialog>` lifecycle calls with the controlled Drawer API.

The organism continues to own:

- conversion between an application and form values;
- Zod validation and per-field errors;
- first-invalid-field focus;
- Save and Delete calls;
- delete-confirmation state and focus movement;
- pending and friendly error presentation.

The Company control is passed to the Drawer as the initial focus target. The form uses the existing shared fields molecule with a drawer-specific single-column layout option; the Add modal keeps its current responsive one-/two-column layout.

## Interaction and State Lifecycle

1. A card content button calls the existing page selection callback with the application and exact opener element.
2. The page stores the selected application separately from an explicit `isDetailOpen` flag, then renders the Detail drawer with `open=true`.
3. The Drawer mounts the backdrop and panel, locks body scrolling, and focuses Company.
4. While idle, Close, Cancel, Escape, or backdrop activation calls `onOpenChange(false)`.
5. While Save or Delete is pending, `dismissable=false`; Close and Cancel are disabled, and Escape/backdrop activation does not close the drawer.
6. A successful Save or Delete requests close by setting `isDetailOpen=false`. The selected application remains available while `AnimatePresence` plays the panel exit animation.
7. A rejected mutation keeps the drawer open with the edited draft and friendly error.
8. When the exit animation completes, the Drawer's `onExitComplete` callback tells the page to clear the selected application and restore focus on the next animation frame:
   - the original connected card opener;
   - a replacement opener with the same application ID after a status move;
   - the Applications heading if the card was deleted.

Delete remains a two-step action. Opening confirmation focuses Confirm delete; cancelling confirmation restores focus to Delete. Confirm delete remains visually distinct from Save.

## Responsive Layout

### Desktop

- Panel: `w-[32.5rem] max-w-[calc(100vw-1rem)]` on the right.
- Header and footer: non-scrolling, bordered sections.
- Body: independently scrollable.
- Fields: one column, with Notes retaining a comfortable minimum height.

### Mobile

- Panel: `w-[calc(100vw-0.5rem)]`, capped by the viewport height.
- An approximately 8px reveal of the background keeps the drawer's direction legible.
- Header, footer, close control, and action targets remain reachable without horizontal scrolling.
- The form stays one column and supports vertical scrolling when the virtual keyboard reduces available height.

## Styling

- Backdrop: neutral `ink` tint with restrained blur.
- Panel: `canvas` surface, `line` border, and a quiet shadow.
- Focus: existing blue `focus` token.
- Primary Save: coral `primary` with dark text.
- Cancel: neutral outline.
- Delete: danger outline; Confirm delete: filled danger.
- All motion respects reduced-motion preferences.

## Data and Security Boundaries

No changes are made to:

- Clerk authentication;
- Supabase client configuration or RLS;
- database types or migrations;
- TanStack Query hooks or cache keys;
- reorder calculations;
- create, update, or delete payload contracts.

The page remains the workflow coordinator and the drawer remains a presentation/form boundary.

## Error Handling

- Client validation keeps the drawer open and focuses the first invalid field.
- Save and Delete rejection keep the draft and confirmation state available.
- Pending state disables every editable control and destructive/closing action.
- Existing user-facing error copy is preserved.

## Testing Strategy

Follow red-green TDD for every behavior change.

### Drawer primitive tests

- renders only while open and identifies itself as a modal dialog;
- positions on the requested side;
- closes through Escape and backdrop when dismissable;
- ignores Escape and backdrop when not dismissable;
- locks body scroll and restores the previous value;
- moves focus to the requested initial target;
- cycles Tab and Shift+Tab within the drawer;
- follows the reduced-motion branch.

### Detail drawer tests

- prefills every application value and focuses Company;
- renders the shared fields in a single column;
- validates, saves, and deletes with the existing normalized payloads;
- preserves delete-confirmation focus behavior;
- prevents closing and editing while busy;
- keeps drafts visible after rejected mutations.

### Page integration tests

- clicking a card renders the Detail drawer;
- Close, Cancel, Escape, and backdrop all preserve exact opener restoration;
- the selected application remains mounted through the exit transition and is cleared after exit completion;
- moved cards restore focus to the replacement opener;
- deleted cards restore focus to the Applications heading;
- Add application continues to use its current modal.

Run the focused suites, full test suite, ESLint, and production build. In the signed-in browser, verify the drawer at 1440px and 390px, including motion, scroll containment, focus, dismissal rules, and zero console errors without mutating production data.

## Out of Scope

- Converting the Add application modal to a drawer.
- Changing form fields, validation rules, or database data.
- Adding autosave, read-only/detail modes, tabs, activity history, or new card actions.
- Initializing the full shadcn component system.
