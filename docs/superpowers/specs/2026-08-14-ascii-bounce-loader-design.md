# ASCII Bounce Loader Design

## Goal

Replace the current Clerk authentication loading indicator with the beUI ASCII Bounce loader while preserving when and where the loading state appears.

## Scope

- Add a dedicated `AsciiBounceLoader` atom using the official beUI ASCII Bounce frame sequence.
- Use the loader only while Clerk is resolving authentication before the signed-in workspace or signed-out landing page is shown.
- Render the ASCII glyph at `64px` in the existing primary color.
- Remove the visible loading caption.
- Preserve `Entering Job Buddy workspace` as the accessible status label for screen readers.

The signed-in workspace, signed-out landing page, other loaders, authentication behavior, routing, and data loading flows remain unchanged.

## Component Design

`src/components/atoms/AsciiBounceLoader/AsciiBounceLoader.tsx` will expose a focused component with optional `label`, `size`, `speed`, and `className` props. Defaults will be:

- `label`: `Loading`
- `size`: `64`
- `speed`: `1`

The component will cycle through the official frames:

```text
⠁ ⠂ ⠄ ⡀ ⢀ ⠠ ⠐ ⠈
```

It will render a single monospace glyph inside a `role="status"` element. The accessible label will be attached to the status element, and no visible caption will be rendered.

## Motion and Accessibility

The normal animation divides one cycle evenly across the eight glyph frames. When reduced motion is requested, the same glyph sequence will run at 2.5 times the cycle duration, matching the supplied beUI behavior while avoiding transform-based movement.

The interval will be created in an effect and cleared on unmount. Static frame data will remain at module scope to avoid recreating it on every render.

## Integration

`AuthGate` will replace `DitherLoader` with `AsciiBounceLoader` and pass:

- `label="Entering Job Buddy workspace"`
- `size={64}`

The existing full-screen centered loading container remains unchanged.

The existing `DitherLoader` and `ScrambleLoader` files will not be deleted because deletion is outside this change and they may remain useful elsewhere.

## Testing

- Add an atom test confirming the status has the supplied accessible name, renders the ASCII glyph, has no visible label, and defaults to `64px`.
- Update the `AuthGate` test to expect the ASCII Bounce loader instead of the dither grid.
- Confirm protected content remains unmounted during Clerk loading.
- Run the focused loader/AuthGate tests, ESLint, production build, and a browser check of the authentication-loading state when practical.
