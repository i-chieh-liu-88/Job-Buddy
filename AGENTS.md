# Project Editing Rulebook

## Purpose

This file defines the rules that contributors and coding agents must follow when editing this project.

## Scope

- These rules apply to the entire repository.
- Follow any more specific `AGENTS.md` found in a subdirectory when editing files there.

## Project Context

- This repository is a React application with TypeScript.
- Prefer the project's existing patterns, components, hooks, and utilities.
- Aim for small, safe, and transparent changes.

## Working Method

- Read affected files completely before making changes.
- Keep changes small and limited to the task.
- State the plan briefly before larger changes.
- State any necessary assumptions explicitly.

## Plan Mode and Todo List

### Plan Before Implementing

- First, explain the task and confirm the intended outcome.
- Do not begin implementation immediately.
- Identify risks, assumptions, dependencies, and open questions before making changes.
- Create a Todo list before implementation begins.

### Create and Maintain the Todo List

- Break the task into small, concrete steps.
- Check that the steps are ordered by dependency and execution sequence.
- Split oversized tasks into smaller, independently verifiable items.
- Keep the Todo list updated as work progresses.

## Editing Rules

- Keep changes focused on the requested task.
- Preserve existing behavior unless the task requires a change.
- Do not overwrite unrelated or uncommitted work.
- Reuse existing components, types, utilities, and patterns before adding new ones.
- Do not edit generated files such as `src/routeTree.gen.ts` by hand.
- Never commit secrets, credentials, or local environment values.
- Update documentation when behavior, setup, or commands change.

## Change Safety

- Do not make blind changes; inspect the relevant existing code and its dependencies first.
- Before major modifications, Codex must briefly summarize the planned changes.
- Do not delete or rename files unless the task explicitly requires it.
- Do not fundamentally restructure files, modules, or directories unless it is explicitly part of the task.
- Confirm that major changes preserve existing public behavior and security boundaries.
- Do not change authentication, routing, API contracts, CI/CD, `.env*`, or migration files without explicit approval.
- Do not disable tests or checks merely to hide errors.

## Code Standards

- Use TypeScript and React conventions already established in `src`.
- Use functional React components and hooks.
- Keep components small and give files, functions, variables, and types clear names.
- Avoid `any` unless no safe typed alternative exists.
- Keep imports and formatting consistent with nearby files.
- Add or update tests when changing behavior.
- Avoid refactoring outside the task scope and only change relevant files.

## Atomic Component Structure

Use Atomic Design for new reusable UI components:

```text
src/
├── components/
│   ├── atoms/          # Basic controls and visual primitives
│   ├── molecules/      # Small groups of atoms with one purpose
│   ├── organisms/      # Complete reusable interface sections
│   └── backgrounds/    # Reusable decorative backgrounds
├── layouts/            # Page-level structural shells
└── pages/              # Route content, data loading, and feature logic
```

- Put buttons, inputs, labels, icons, and loaders in `atoms`.
- Put search fields, pagination, form rows, and compact cards in `molecules`.
- Put navigation bars, sidebars, footers, and complex feature sections in `organisms`.
- Put reusable visual-only backgrounds in `backgrounds`.
- Use `layouts` to arrange organisms and page content without feature-specific data logic.
- Use `pages` to connect routes, queries, mutations, and complete user workflows.
- Atoms must not import molecules, organisms, layouts, or pages.
- Molecules may import atoms but must not import organisms, layouts, or pages.
- Organisms may import atoms and molecules but must not import layouts or pages.
- Keep each component in its own named folder with its component, styles, types, tests, and optional `index.ts` together.
- Promote a component only when its responsibility grows; do not classify it by visual size alone.

## Clean Frontend Code

### HTML and JSX

- Use semantic elements such as `header`, `nav`, `main`, `section`, and `button` where appropriate.
- Use buttons for actions and links for navigation.
- Keep JSX structure simple and avoid unnecessary wrapper elements.
- Provide accessible labels, alternative text, and keyboard behavior for interactive content.

### CSS

- Prefer Tailwind CSS for styling.
- Use short, descriptive class names that express purpose rather than appearance.
- Keep styling separate from component structure and application logic.
- Reuse existing styles and design tokens before adding new rules.
- Avoid inline styles unless a value must be calculated at runtime.
- Keep global styles minimal; scope component-specific styles to the component.
- Remove unused, duplicate, and conflicting style rules.

### JavaScript and TypeScript

- Use clear names that describe what variables, functions, hooks, and handlers do.
- Keep functions focused on one responsibility and avoid deeply nested logic.
- Separate rendering, styling, state management, and data access.
- Avoid global variables; keep state in the narrowest practical scope.
- Prefer immutable updates and explicit data flow.
- Remove dead code, debug logging, and commented-out code before finishing.
- Add comments only when they clarify intent or a non-obvious decision.
- Do not use comments to repeat what the code already states clearly.

## Project Commands

- Prefer the scripts defined in `package.json`.
- Install dependencies with `npm install`.
- Start the Vite development server with `npm run dev`.
- Run tests interactively with `npm run test`.
- Run all tests once with `npm run test:run`.
- Run ESLint with `npm run lint`.
- Type-check and build the production bundle with `npm run build`.
- Preview the production build with `npm run preview`.
- On Windows systems that block PowerShell npm scripts, use `npm.cmd` in place of `npm`.

### Check in the Browser

- Open the local URL printed by Vite, normally `http://localhost:5173`.
- Confirm that the affected page loads without browser console errors.
- After `npm run build`, run `npm run preview` to check the production build in a browser.

## Verification

- Run `npm run lint` after code changes.
- Run `npm run build` after TypeScript, configuration, or dependency changes.
- Verify the affected user flow when changing UI behavior.
- Report any check that could not be run or did not pass.

## Dependencies and Files

- Use npm and keep `package-lock.json` synchronized with `package.json`.
- Add dependencies only when the existing stack cannot reasonably solve the task.
- Do not modify `.env.local` unless the task explicitly requires it.
- Do not commit build output or dependency directories.

## Expected Output

- Briefly name the changed files.
- Name the commands that were executed.
- Provide the test result, or explain why tests were not run.
- Name any remaining risks or assumptions.
