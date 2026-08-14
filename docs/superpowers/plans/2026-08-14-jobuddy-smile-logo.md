# Jobuddy Smile Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the navigation's text-only Job Buddy identity with a reusable animated smile logo and Inter `Jobuddy` wordmark.

**Architecture:** Add a focused Atomic Design atom that owns the SVG artwork, wordmark, hover motion, and reduced-motion behavior. Reuse it in expanded, collapsed, and mobile navigation identities without changing navigation state or layout responsibilities.

**Tech Stack:** React, TypeScript, Motion, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Keep the existing sidebar layout, routing, and actions unchanged.
- Use the existing `#818cf8` primary token and Inter display font.
- Preserve an accessible `Jobuddy` name in icon-only mode.
- Disable movement when reduced motion is requested.

---

### Task 1: Animated Jobuddy Logo atom

**Files:**
- Create: `src/components/atoms/JobuddyLogo/JobuddyLogo.tsx`
- Create: `src/components/atoms/JobuddyLogo/JobuddyLogo.test.tsx`

**Interfaces:**
- Produces: `JobuddyLogo({ compact?: boolean, className?: string })`

- [ ] Write a failing test that expects the accessible `Jobuddy` identity, smile SVG parts, Inter wordmark, and compact icon-only rendering.
- [ ] Run the focused test and confirm it fails because the module is missing.
- [ ] Implement the primary-ring smile, blinking eyes, lifting smile, spring hover, and reduced-motion fallback.
- [ ] Run the focused test and confirm it passes.

### Task 2: Navigation integration

**Files:**
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.tsx`
- Modify: `src/components/organisms/ApplicationNavigation/ApplicationNavigation.test.tsx`

**Interfaces:**
- Consumes: `JobuddyLogo` from Task 1.

- [ ] Add failing integration expectations for expanded, collapsed, mobile header, and mobile drawer identities.
- [ ] Run the navigation test and confirm the new expectations fail.
- [ ] Replace text and briefcase identities with `JobuddyLogo`, preserving Workspace copy in the expanded desktop panel.
- [ ] Run focused tests, then lint and build.
- [ ] Verify the desktop and mobile appearance in the browser.

