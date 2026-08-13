# Workspace Grid Hover Refinement

## Goal

Refine the authenticated workspace's decorative engineering grid so its hover pattern begins at each cell's grid intersection, has no border, is more visible, and alternates mirrored diagonal directions between neighbouring cells.

## Design

- The existing 124px grid keeps its line treatment. Every intersection renders as a hollow circular node.
- The hover layer is positioned at the selected cell's top-left grid intersection, which acts as its origin.
- The layer has no border or enclosing container treatment; only a white, 50%-opacity hatch is visible.
- A parity value derived from the selected grid x/y indices alternates the hatch between `45deg` and `-45deg`, producing a mirrored direction when moving to an adjacent cell.
- The background remains `aria-hidden` and `pointer-events-none`; touch and reduced-motion modes keep pointer tracking disabled.

## Verification

- A component test checks that a pointer in an odd-parity cell produces the mirrored hatch direction and that the hover layer is active without a border class.
- Existing workspace-page test confirms the decorative layer remains behind the Applications content.
