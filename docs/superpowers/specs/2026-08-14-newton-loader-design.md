# Newton Loader Design

## Goal

Replace the Clerk authentication ASCII Bounce indicator with the official beUI Newton loader while preserving the existing authentication loading contract.

## Scope

- Add a dedicated `NewtonLoader` atom using the official five-ball Newton animation.
- Use the loader only while Clerk resolves authentication.
- Render the animation at `64px` in the existing primary color.
- Render no visible loading caption.
- Preserve `Entering Job Buddy workspace` as the accessible status label.
- Keep the existing `AsciiBounceLoader`, `DitherLoader`, and `ScrambleLoader` files unchanged.

Authentication behavior, routing, the full-screen loading container, and all other loading states remain unchanged.

## Component Design

`src/components/atoms/NewtonLoader/NewtonLoader.tsx` will expose optional `label`, `size`, `speed`, and `className` props with these defaults:

- `label`: `Loading`
- `size`: `64`
- `speed`: `1`

The component renders five adjacent circular balls. During normal motion, only the end balls move: the left ball travels outward and returns during the first half of the cycle, followed by the right ball during the second half. The three center balls remain still, producing the Newton's cradle transfer effect from the supplied official code.

## Motion and Accessibility

The balls use Motion and the project's existing `EASE_IN_OUT` timing token. Animation repeats continuously with a cycle duration of `speed * 1.5` seconds.

When reduced motion is requested, transforms are removed and all five balls use the official calm opacity pulse. The outer element uses `role="status"` and the supplied accessible label. The visual balls are marked `aria-hidden`, and no caption is rendered.

## Integration

`AuthGate` will replace `AsciiBounceLoader` with `NewtonLoader` and pass:

- `label="Entering Job Buddy workspace"`
- `size={64}`

The existing centered `<main>` loading container remains unchanged.

## Testing

- Add atom tests for the accessible label, five visible balls, default 64px geometry, and absence of a visible caption.
- Confirm the normal variant gives motion only to the two end balls.
- Update the `AuthGate` test to expect the Newton loader and reject the ASCII glyph.
- Run focused Newton/AuthGate tests, ESLint, the production build, and the full test suite.
- Treat the already identified MonthInterviewCalendar hover-versus-click failure as unrelated unless separately authorized.
