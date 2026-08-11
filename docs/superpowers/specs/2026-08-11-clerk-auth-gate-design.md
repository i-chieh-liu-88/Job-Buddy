# Clerk Auth Gate Design

## Scope

This phase fixes the signed-out application state and adds Clerk-hosted sign-in and sign-up modals. It prevents protected Kanban and Supabase code from mounting before authentication. It does not add dedicated authentication routes, custom credential forms, role management, or visual redesign beyond the small authentication shell.

## Authentication States

The application root has three explicit states:

1. While Clerk initializes, show a full-page loading state.
2. When signed out, show a Job Buddy welcome screen with `Sign in` and `Create account` actions.
3. When signed in, mount the existing TanStack Router application and Kanban workflow.

The sign-in action uses Clerk's `SignInButton` with `mode="modal"`. The registration action uses `SignUpButton` with `mode="modal"`. Clerk owns credentials, validation, OAuth options, recovery, and modal lifecycle.

## Component Boundaries

Create an `AuthGate` organism that consumes `children` and composes Clerk's `ClerkLoading`, `ClerkLoaded`, `SignedIn`, and `SignedOut` components. It owns the loading and welcome experiences but does not import the Router, Query hooks, or Supabase client.

`main.tsx` keeps `ClerkProvider` as the outer provider. `AuthGate` wraps the existing application inside the provider. This ensures `App`, its routes, the Kanban page, and all Supabase hooks mount only for an authenticated user.

The Kanban page header adds Clerk's `UserButton` for account access and sign-out. Signing out causes `SignedIn` to unmount the Router tree and `SignedOut` to render the welcome screen immediately.

## Data Flow and Loading Fix

The current endless loading state occurs because `useJobApplications()` is disabled without a Clerk `userId`, while the page still interprets the disabled query's pending status as active loading. The auth gate removes that invalid state combination by preventing the page from mounting while signed out.

The existing query-level `enabled: isLoaded && Boolean(userId)` remains as defense in depth. Query keys remain scoped by Clerk user ID, preventing cache collisions between users. No authentication secrets or tokens are persisted by new code.

## User Experience

The signed-out screen uses the existing calm slate and blue palette. It contains the product name, a short job-tracking description, a primary `Sign in` button, and a secondary `Create account` button. Both controls are native buttons supplied as children to Clerk's modal triggers.

The Clerk loading state uses `role="status"` and readable text. Modal trigger buttons remain keyboard accessible and have visible focus states. The signed-in header keeps the existing title and places `UserButton` at the opposite edge without changing the board layout.

## Error Handling

Clerk's hosted modal handles authentication validation and errors. Missing `VITE_CLERK_PUBLISHABLE_KEY` continues to fail fast in `main.tsx`. Supabase query errors remain on the Kanban page and are only reachable after authentication.

If Clerk loads successfully but the user is signed out, the UI always shows the welcome screen rather than `Loading applications...`.

## Testing

Component tests mock only the Clerk state boundary and assert observable UI:

- Clerk loading displays a status message and does not render protected children.
- Signed-out state displays both modal triggers and does not render protected children.
- Signed-in state renders protected children and hides the signed-out welcome screen.
- The Kanban header renders the Clerk account control.

The final verification commands are `npm.cmd run test:run`, `npm.cmd run lint`, and `npm.cmd run build`. Manual verification signs in, confirms the board appears, signs out through `UserButton`, and confirms the welcome screen returns without an application-loading hang.

## Dependencies

Use the installed `@clerk/clerk-react` package. Add no new runtime dependencies and create no new routes.
