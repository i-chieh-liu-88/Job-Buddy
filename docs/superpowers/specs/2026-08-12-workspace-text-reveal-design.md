# Workspace Text Reveal Design

## Goal

Use the supplied official beUI TextReveal approach to animate the authenticated workspace introduction on entry.

## Scope

- Add `TextReveal` as a reusable atomic component, adapted only for this project's relative imports and existing `EASE_OUT`/`cn` utilities.
- Reveal the eyebrow, Applications title, supporting heading, and description in the workspace introduction.
- Preserve semantic element types and all visible copy.
- Respect reduced-motion by using opacity-only reveal.

## Verification

- A component test verifies a semantic heading remains exposed and words are rendered as individual animation units.
- Existing page tests continue to find the Applications content by accessible name.
