# Jobuddy Logo Hover Design

## Objective

Replace the current Jobuddy logo mark with the supplied four-lobed geometric mark and refine its hover interaction to match the restrained character of the React Bits reference. The `Jobuddy` wordmark must remain completely stationary.

## Scope

- Update the reusable `JobuddyLogo` atom only.
- Preserve its existing default and `compact` presentations.
- Preserve the accessible name `Jobuddy` and existing navigation behavior.
- Do not change sidebar layout, typography, routes, or authentication behavior.

## Visual Structure

The logo remains an inline composition with two independent siblings:

1. An animated 24 px SVG mark using the supplied four-lobed path.
2. A static `Jobuddy` wordmark using the existing Inter display typography.

The motion wrapper must surround only the SVG. The wordmark must not inherit rotation, translation, scaling, or animated layout from the mark.

The SVG uses `currentColor` so it continues to inherit the existing primary brand color. Its supplied 256 × 256 geometry is retained through a `0 0 256 256` view box.

## Hover Motion

Hovering the complete logo hit area triggers the SVG mark only:

- Start at `0deg`.
- Rotate clockwise to `30deg`.
- Settle through a small spring-like counter-motion.
- Return to `0deg`.

The complete gesture should take approximately 500–600 ms and should play once per hover entry. The motion should feel elastic but controlled; it must not loop, continuously spin, or move the wordmark.

The existing `motion/react` dependency will implement the interaction. No new motion dependency is needed.

## Reduced Motion

When `prefers-reduced-motion` is active, the SVG remains static. The logo stays fully usable and visually unchanged apart from the omitted animation.

## Component Behavior

- Default mode renders the animated mark and static `Jobuddy` text.
- Compact mode renders only the mark and retains the accessible name.
- The full inline logo remains the hover target, allowing a comfortable interaction area without animating the text.

## Verification

Automated tests will verify:

- The new supplied SVG path is rendered.
- The mark remains 24 px.
- The wordmark keeps the existing Inter display class.
- The wordmark is outside the animated SVG element.
- Default mode renders the wordmark and compact mode omits it.
- Both modes retain the accessible name `Jobuddy`.

Browser verification will confirm that the mark rotates clockwise by roughly 30 degrees and springs back while the wordmark's computed transform remains unchanged.
