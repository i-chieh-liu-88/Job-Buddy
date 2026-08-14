# Interviews Schema Design

## Goal

Create a secure, queryable foundation for multiple interview rounds per job application. This phase adds database support only; no UI, calendar route, or widget is included yet.

## Data Model

Create `public.interviews` with:

- `id uuid primary key default gen_random_uuid()`
- `user_id text not null`
- `job_application_id uuid not null references public.job_applications(id) on delete cascade`
- `round_label text not null`, requiring non-whitespace text
- `scheduled_at timestamptz not null`
- `location_or_link text nullable`
- `notes text nullable`
- `created_at timestamptz not null default now()`

Add an index on `(user_id, scheduled_at)` for calendar month-range and upcoming-interview queries. Application deletion cascades only its own interview rounds.

## Ownership and RLS

`user_id` duplicates the Clerk subject already stored on job applications. This allows direct, readable RLS policies without a join for normal select, insert, update, and delete operations.

All policies target `authenticated` and require `(select auth.jwt() ->> 'sub') = user_id`. The table enables Row Level Security before policies are created. No service-role exception, public policy, or client-provided ownership bypass is added.

## Referential Integrity

Before insert or changes to `user_id` or `job_application_id`, `validate_interview_application_owner()` verifies that the referenced job application exists and has the same `user_id`. The trigger raises an exception when ownership differs. This prevents a caller from attaching an interview to another user's card even if they tamper with frontend input.

## Migration Behavior

The migration is additive: it creates the table, index, RLS policies, ownership function, and trigger. It does not modify `job_applications`, existing resumes, Storage, routing, or application data.

## Validation

After applying the migration in Supabase SQL Editor, verify that `public.interviews` exists, RLS is enabled, the `(user_id, scheduled_at)` index exists, and the foreign key has cascade deletion. Use a normal Clerk-authenticated session to create a same-owner event; cross-owner attempts must be rejected by RLS or the ownership trigger.

## Non-goals

- No interview form, editing, or deletion UI.
- No calendar page, event popover, card navigation, or upcoming widget.
- No external calendar sync or reminders.
