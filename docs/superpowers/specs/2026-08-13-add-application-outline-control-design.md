# Add Application Outline Control Design

## Goal

Replace the workspace navigation's "Add application" control with a compact beUI outline-style control matching the supplied Create reference.

## Design

- Use the project's official beUI `Button` atom with `variant="outline"` so hover and press spring behavior are retained.
- Expanded desktop and mobile controls render a large circular plus glyph and the label `Add`.
- The collapsed desktop control renders the same plus glyph without visible text and has the accessible name and tooltip `Add`.
- The control uses the existing primary color only for the plus circle; the outer control remains outline/dark.
- The control is square-cornered, has a 44px minimum target, and keeps keyboard focus styles and disabled behavior.

## Scope

- Change only navigation Add controls. Form submission buttons remain unchanged.
- Keep the existing callback contract: activating the button passes its HTMLButtonElement opener to `onAddApplication`.

## Verification

- Add atom tests for expanded and collapsed accessible labels.
- Update navigation tests to verify two visible `Add` controls and the collapsed icon-only control.
- Run focused tests, lint, full tests, and production build.
