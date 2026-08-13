# System Architecture Authentication Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the signed-out authentication card with a System Architecture-style landing page while preserving Clerk authentication actions.

**Architecture:** A visual-only `ArchitectureWaveBackground` atom supplies a responsive, decorative SVG wave field. `AuthGate` composes that atom with the existing sign-in and sign-up actions; signed-in rendering remains untouched.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Motion, Clerk React, Vitest, Testing Library.

## Global Constraints

- Preserve the existing Clerk `SignInButton` and `SignUpButton` modal behavior.
- Preserve signed-in content rendering and the loading state.
- Use `prefers-reduced-motion` to render the wave background without animation.
- Keep decorative animation hidden from assistive technologies.
- Follow `DESIGN.md`: background `#0A0A0A`, surface `#191C21`, primary `#818CF8`, Inter display and Google Sans Flex body typography.

---

### Task 1: Architecture Wave Background

**Files:**
- Create: `src/components/backgrounds/ArchitectureWaveBackground/ArchitectureWaveBackground.tsx`
- Test: `src/components/backgrounds/ArchitectureWaveBackground/ArchitectureWaveBackground.test.tsx`

**Interfaces:**
- Produces: `ArchitectureWaveBackground`, a visual-only React component with no props.
- Consumes: `motion/react` `motion` and `useReducedMotion`.

- [ ] **Step 1: Write the failing test**

```tsx
render(<ArchitectureWaveBackground />);
expect(screen.getByTestId("architecture-wave-background")).toHaveAttribute(
  "aria-hidden",
  "true",
);
expect(screen.getAllByTestId("architecture-wave")).toHaveLength(3);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/backgrounds/ArchitectureWaveBackground/ArchitectureWaveBackground.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function ArchitectureWaveBackground() {
  return (
    <div aria-hidden="true" data-testid="architecture-wave-background">
      {WAVE_PATHS.map((path) => (
        <motion.path data-testid="architecture-wave" d={path} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/components/backgrounds/ArchitectureWaveBackground/ArchitectureWaveBackground.test.tsx`

Expected: PASS.

### Task 2: Signed-Out Landing Composition

**Files:**
- Modify: `src/components/organisms/AuthGate/AuthGate.tsx`
- Modify: `src/components/organisms/AuthGate/AuthGate.test.tsx`

**Interfaces:**
- Consumes: `ArchitectureWaveBackground` from Task 1.
- Preserves: `AuthGate({ children }: PropsWithChildren)` and Clerk action button accessible names.

- [ ] **Step 1: Write the failing test**

```tsx
auth.state = "signed-out";
render(<AuthGate><p>Protected board</p></AuthGate>);
expect(screen.getByTestId("architecture-wave-background")).toBeVisible();
expect(screen.getByText("Your application system, in motion.")).toBeVisible();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx`

Expected: FAIL because the signed-out view does not render the wave background or landing copy.

- [ ] **Step 3: Write minimal implementation**

```tsx
<main className="relative isolate min-h-screen overflow-hidden bg-canvas">
  <ArchitectureWaveBackground />
  <section className="relative z-10">...</section>
</main>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/components/organisms/AuthGate/AuthGate.test.tsx`

Expected: PASS; existing Clerk button and protected-content assertions remain green.

### Task 3: Regression Verification

**Files:**
- Verify: all modified and new files.

- [ ] **Step 1: Run focused tests**

Run: `npx.cmd vitest run src/components/backgrounds/ArchitectureWaveBackground/ArchitectureWaveBackground.test.tsx src/components/organisms/AuthGate/AuthGate.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run project checks**

Run: `npm.cmd run lint; npm.cmd run build; npm.cmd run test:run`

Expected: all commands exit successfully.
