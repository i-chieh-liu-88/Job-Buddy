# Saved Empty-State Add Button Design

## Goal

Make the empty state in the Saved Kanban column open the existing Add application form. Empty states in all other columns remain non-interactive.

## Interaction

- When the Saved column has no cards, render its empty state as a semantic button named `Add application`.
- Clicking the button opens the same Add application modal used by the navigation button.
- The form keeps its existing default status of `saved`.
- While an application is being created or the board is disabled, the empty-state button is disabled.
- Closing the form restores focus to the exact empty-state button that opened it.
- The droppable Saved column and all existing drag-and-drop behavior remain unchanged.

## Visual Design

- Preserve the existing empty-state footprint and dark workspace palette.
- Use a subtle primary-colored dashed border and a lightly transparent background.
- Center a prominent plus icon above the text `Add application`.
- On hover and keyboard focus, slightly brighten the background and border without aggressive contrast.
- Respect reduced-motion preferences and use the existing focus-ring token.

## Component and Data Flow

- `KanbanBoardPage` owns the existing add-modal state and passes its add callback to `KanbanBoard`.
- `KanbanBoard` forwards the callback to the Saved `KanbanColumn` only.
- `KanbanColumn` renders the interactive empty state only when its status is `saved` and it has no applications.
- The callback receives the actual button element so the page can reuse its existing focus-restoration flow.

## Testing

- Verify the Saved empty state is a button named `Add application` while other empty states are not buttons.
- Verify clicking it opens the existing Add application dialog with Saved selected.
- Verify canceling restores focus to the Saved empty-state button.
- Verify disabled board state disables the button.
- Run the focused board/page tests, ESLint, production build, and a browser smoke check.

## Out of Scope

- Making other columns' empty states interactive.
- Changing form fields, create mutations, ordering, or drag-and-drop behavior.
