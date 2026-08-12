# Collapsible Application Sidebar Design

**Date:** 2026-08-12

## Goal

Replace Jobuddy's fixed light desktop navigation panel with the standalone [beUI Animated Sidebar](https://beui.dev/components/motion/animated-sidebar). The panel must morph between a 224px expanded navigation and a 68px icon rail, remember the user's choice, and leave the permanent dark workspace rail and current mobile navigation dialog unchanged.

## Approved Experience

- The dark 64px workspace rail remains permanently visible on desktop.
- The adjacent light navigation panel changes between:
  - expanded: 224px;
  - collapsed: 68px.
- The panel begins expanded for a user who has no saved preference.
- The last desktop state persists across reloads.
- A rail control centered on the panel's right boundary toggles the panel.
- `Ctrl+B` on Windows/Linux and `Cmd+B` on macOS also toggle the desktop panel.
- The shortcut does not run while focus is inside an input, textarea, select, or editable element.
- Below the `md` breakpoint, the existing header and native navigation dialog remain the only navigation experience.
- Motion follows the beUI morphing interaction and respects `prefers-reduced-motion`.

## Component Source and Dependencies

Install the complete standalone registry component with the npm form of:

```bash
npx shadcn add @beui/animated-sidebar
```

The registry package supplies:

- the Animated Sidebar component and its exported primitives;
- the shared-layout background helper;
- beUI easing and spring constants;
- the shadcn `cn` utility;
- the preview file, if the registry installer includes it.

Its runtime dependencies are:

- `clsx`;
- `lucide-react`;
- `motion`;
- `react`;
- `react-dom`;
- `tailwind-merge`.

Jobuddy already has every dependency except `lucide-react`. The install may add `components.json` and the `@/` alias required by the registry source. Those configuration changes are limited to resolving installed component imports; they must not alter routing, authentication, environment variables, or build behavior.

Keep the complete standalone Animated Sidebar source. Do not install the AI Sidebar package, resource tree, resource drag-and-drop, inline rename, MorphPopover, or other agent-specific behavior.

Place reusable installed UI primitives within the project's Atomic Design structure. Registry files may first be generated at their standard paths, then moved to focused folders under `src/components/atoms/` with their imports updated. The final source must retain the beUI origin comment.

## Architecture

### Animated Sidebar primitive

Use these official exports:

- `AnimatedSidebarProvider`;
- `AnimatedSidebar`;
- `AnimatedSidebarRail`;
- `AnimatedSidebarHeader`;
- `AnimatedSidebarContent`;
- `AnimatedSidebarFooter`;
- `AnimatedSidebarGroup` and label/content primitives;
- `AnimatedSidebarMenu`, item, and button primitives.

Use `collapsible="icon"`, a left-side panel, and CSS variables:

```tsx
style={{
  "--sidebar-width": "14rem",
  "--sidebar-width-icon": "4.25rem",
}}
```

Apply Jobuddy's existing `surface`, `line`, `ink`, `muted`, `hover`, `focus`, and `primary` tokens rather than the registry preview theme.

The local Jobuddy adaptation adds two guards to the provider's shortcut behavior:

1. do not toggle the Animated Sidebar when the provider reports a mobile viewport;
2. do not toggle when the event target is an input, textarea, select, or an element inside `[contenteditable="true"]`.

These guards ensure the existing mobile navigation remains authoritative and application forms keep normal text-editing shortcuts.

The local `AnimatedSidebar` also accepts `desktopOnly?: boolean`. When this is true and the component reports a mobile viewport, it returns `null` instead of mounting the registry's mobile portal. Jobuddy passes `desktopOnly` so the installed mobile sheet cannot coexist with the current native navigation dialog.

### Application shell

`ApplicationShell` owns the controlled desktop `open` state and passes it to `AnimatedSidebarProvider`. The shell still lays out navigation beside a flexible `<main>`; the Animated Sidebar's width animation changes the available workspace width without manual margins or duplicated layout calculations.

The shell reads and writes one storage entry:

```text
jobuddy:sidebar-expanded
```

Accepted stored values are exactly `"true"` and `"false"`. A missing or invalid value defaults to expanded. Storage read/write failures do not block interaction; they only disable persistence for that operation.

The shell does not own navigation destinations, stage counts, Clerk account content, mobile dialog state, or application mutations.

### Application navigation

`ApplicationNavigation` keeps the existing dark workspace rail separate from the Animated Sidebar panel. The light desktop navigation content is rebuilt with Animated Sidebar composition primitives while the current mobile header and native `<dialog>` remain intact.

The organism continues to receive:

```ts
type ApplicationNavigationProps = {
  accountMenu: ReactNode;
  isAddDisabled: boolean;
  onAddApplication: (opener: HTMLButtonElement) => void;
  stageCounts: ApplicationStageCounts;
};
```

No page data or mutation contract changes are required.

## Expanded and Collapsed Content

### Expanded

The existing information hierarchy remains:

- Job Buddy / Workspace identity;
- primary Add application action;
- Applications destination;
- disabled Stats, Reminders, and Export destinations with Soon badges;
- Pipeline label and five status counts;
- Signed in label and Clerk account menu.

### Collapsed

- Workspace identity becomes a centered workspace icon.
- Add application becomes a centered plus icon.
- Applications, Stats, Reminders, and Export become centered icons.
- Pipeline heading disappears; each status becomes its existing colored indicator centered in a menu row.
- Signed in text disappears; the Clerk account control remains centered.
- Text and badges fade out without leaving invisible elements in the tab or accessibility order.
- Every actionable collapsed item exposes an accessible name and a native `title` tooltip.
- Every stage indicator exposes a description in the form `Interview · 3 applications` through `aria-label` and `title`.
- Disabled future destinations remain disabled in both states.

Use `lucide-react` icons for workspace, applications, statistics, reminders, export, add, and the rail direction cue. Decorative icons use `aria-hidden="true"`; the surrounding link or button owns the accessible name.

## Toggle and Focus Behavior

`AnimatedSidebarRail` is positioned at the light panel's right boundary and remains keyboard focusable in both states. It uses:

- `aria-label="Collapse sidebar"` and `aria-expanded="true"` while expanded;
- `aria-label="Expand sidebar"` and `aria-expanded="false"` while collapsed;
- a visible Jobuddy focus ring;
- a direction cue that changes with state.

The currently focused control remains usable during the width transition. Toggling does not move focus into the main content, reopen dialogs, reset TanStack Query state, or affect card drag-and-drop.

The Add application callback still receives the exact button that opened the modal. This includes the full expanded button and the collapsed icon button, so existing post-modal focus restoration remains correct.

## Mobile Boundary

At widths below `md`:

- the desktop workspace rail and Animated Sidebar remain absent;
- the existing fixed mobile header remains visible;
- Open navigation continues to call native `showModal()`;
- Close, Escape, and focus restoration continue to use the existing dialog lifecycle;
- the mobile Add application button remains unchanged;
- `Ctrl/Cmd+B` does nothing.

The standalone component's own mobile sheet implementation remains in the installed source but is bypassed by Jobuddy's `desktopOnly` integration.

## Motion and Styling

- Width morph uses the beUI sidebar spring.
- Labels use beUI's staggered opacity/position transitions.
- Active Applications background uses the installed shared-layout primitive.
- Hover and active surfaces use calm neutral Jobuddy tokens.
- The rail is visually quiet until hover or focus, then reveals the existing line/focus colors.
- Reduced-motion users receive immediate width changes and short or zero-duration opacity transitions.
- No gradients, harsh contrast, or new status colors are introduced.

## Error Handling

- A `localStorage.getItem` exception falls back to expanded.
- A `localStorage.setItem` exception leaves the in-memory state changed and visible.
- Invalid stored strings are ignored and replaced on the next successful toggle.
- The collapse control remains available when account content or future destinations are disabled.
- The feature does not introduce network requests or new user-facing error messages.

## Data and Security Boundaries

No changes are made to:

- Clerk authentication or account behavior;
- Supabase configuration, JWTs, or Row Level Security;
- database types or migrations;
- TanStack Query hooks, cache keys, or mutations;
- Kanban reorder calculations;
- card detail Drawer or Add application form contracts;
- route definitions or generated route files;
- environment files.

The persisted sidebar value contains only a UI boolean and no user or application data.

## Testing Strategy

Follow red-green TDD for each behavior change.

### Animated Sidebar primitive

- renders the expanded and icon-collapsed desktop states;
- rail toggles controlled state and exposes the correct name/state;
- `Ctrl+B` and `Cmd+B` toggle on desktop;
- shortcut is ignored in input, textarea, select, contenteditable, and mobile contexts;
- collapsed menu labels retain accessible names;
- reduced-motion branch removes the width spring;
- shared active layout remains semantic and non-interactive.

### Application shell

- defaults to expanded without valid storage;
- initializes from `"true"` and `"false"`;
- persists every desktop change under `jobuddy:sidebar-expanded`;
- survives storage read and write errors;
- keeps the main workspace in the flexible layout beside navigation.

### Application navigation

- expanded state preserves all existing destinations, counts, disabled states, and account content;
- collapsed state renders icon-only controls with correct labels and titles;
- each collapsed stage exposes its label and current count;
- each expanded and collapsed Add application control reports the exact opener;
- current mobile native dialog open, close, Escape, and focus restoration tests remain green.

### Page integration

- toggling the desktop sidebar preserves visible applications and stage counts;
- Add application and card Detail Drawer remain functional after toggling;
- sidebar persistence does not trigger data mutations.

Run the focused suites, full test suite, ESLint, production build, and `git diff --check`. In the signed-in browser, verify:

- at 1440px: 224px/68px widths, rail control, icon labels, main-content reflow, shortcut guard, and reload persistence;
- at 390px: unchanged native mobile navigation and Add application flow;
- zero browser console errors attributable to the feature.

## Out of Scope

- Replacing the existing mobile navigation dialog.
- Collapsing or removing the dark workspace rail.
- Resizing the sidebar by dragging.
- Adding new destinations or activating Stats, Reminders, or Export.
- Persisting the state to Supabase or Clerk metadata.
- Installing the beUI AI Sidebar or its resource-management features.
