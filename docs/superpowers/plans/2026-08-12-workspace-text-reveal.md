# Workspace Text Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the official TextReveal motion treatment to the authenticated workspace introduction without changing its copy or semantics.

**Architecture:** Create a reusable atom that splits supplied text into motion spans using the existing motion library, `EASE_OUT`, and `cn` helper. The workspace page composes that atom with its existing semantic heading and paragraph elements.

**Tech Stack:** React, TypeScript, motion/react, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Use the user-supplied official component behavior, adapting import paths only.
- Retain the existing heading levels, visible copy, and reduced-motion behavior.
- Do not modify data fetching, drag-and-drop, authentication, or navigation.

---

### Task 1: Create and apply TextReveal

**Files:**
- Create: `src/components/atoms/TextReveal/TextReveal.tsx`
- Create: `src/components/atoms/TextReveal/TextReveal.test.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.tsx`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**
- Produces: `TextReveal({ text, as, split, delay, stagger, className })`.
- Consumed by: the workspace introduction header.

- [ ] **Step 1: Write and run the failing TextReveal test**

```tsx
render(<TextReveal as="h1" split="word" text="Keep moving forward." />);
expect(screen.getByRole("heading", { name: "Keep moving forward." })).toBeVisible();
```

Run: `npx.cmd vitest run src/components/atoms/TextReveal/TextReveal.test.tsx`

Expected: FAIL because the atom does not exist.

- [ ] **Step 2: Implement the supplied official TextReveal behavior**

Use `motion.span`, `useInView`, and `useReducedMotion`; import `EASE_OUT` from `../../../lib/ease` and `cn` from `../../../lib/cn`.

- [ ] **Step 3: Integrate the atom into the workspace introduction**

Apply TextReveal with its existing semantic tags to the eyebrow, h1, h2, and description. Give the groups small sequential delays.

- [ ] **Step 4: Verify**

Run: `npx.cmd vitest run src/components/atoms/TextReveal/TextReveal.test.tsx src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx --reporter=dot`, `npm.cmd run lint`, and `npm.cmd run build`.
