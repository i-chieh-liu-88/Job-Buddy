# Development Query Error Diagnostics Design

## Goal

Expose the underlying job applications query error during local development so Clerk-to-Supabase authentication failures can be diagnosed without weakening the production error experience or exposing credentials.

## User Experience

When loading applications fails, the existing friendly message remains visible:

> Could not load applications. Please try again.

In Vite development mode only, a secondary diagnostic block appears beneath it. The block contains only normalized error metadata that is already returned by the Supabase client: error name, message, and code when present. Production builds never render this block.

## Security Boundaries

- Never render Clerk session tokens, Supabase API keys, authorization headers, request headers, or complete request objects.
- Do not serialize arbitrary error objects because they may contain unrelated internal data.
- Read only the allow-listed `name`, `message`, and `code` fields.
- Keep the existing user-facing error text unchanged.

## Component Design

`KanbanBoardPage` remains responsible for choosing between loading, error, and board states. A small formatter converts an unknown query error into safe diagnostic text. The diagnostic block is guarded by `import.meta.env.DEV` and is rendered only when the query is in the error state.

No changes are required to Clerk configuration, Supabase client construction, database migrations, or production routing in this diagnostic step.

## Testing

Add a page test that supplies an error containing a message and Supabase-style code, then verifies that the friendly error and safe diagnostic values are rendered in the development test environment. Existing success-state coverage must remain green.

## Success Criteria

- Development mode reveals enough error information to identify the Clerk JWT or Supabase authorization failure.
- No secret-bearing fields are rendered.
- Production behavior remains the existing generic error message.
- Tests, lint, and production build pass.
