# Interviews Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure `interviews` table that supports multiple owned interview rounds for every job application.

**Architecture:** A single additive Supabase migration creates the table, query index, direct user-ID RLS policies, and an ownership trigger. `user_id` gives RLS a simple Clerk JWT comparison; `job_application_id` remains the relational parent and cascades removal of its interviews.

**Tech Stack:** Supabase Postgres, PostgreSQL RLS, Clerk JWT claims, SQL migration files.

## Global Constraints

- The table includes `id`, `user_id`, `job_application_id`, `round_label`, `scheduled_at`, `location_or_link`, `notes`, and `created_at`.
- The `job_application_id` foreign key uses `on delete cascade`.
- RLS must compare `(select auth.jwt() ->> 'sub')` directly to `user_id` for every CRUD policy.
- A trigger must reject a job application owned by another user.
- The migration is additive; it must not modify existing application, resume, Storage, route, or UI behavior.
- Work in the existing `dev` checkout; the user explicitly declined a worktree.

---

### Task 1: Interviews table, ownership trigger, and RLS migration

**Files:**
- Create: `supabase/migrations/20260813000002_create_interviews.sql`

**Interfaces:**
- Consumes existing `public.job_applications(id, user_id)`.
- Produces `public.interviews`, `public.validate_interview_application_owner()`, and the `validate_interview_application_owner` trigger.

- [ ] **Step 1: Define the SQL validation contract before implementation**

The migration must make the following queries succeed after applying it in the Supabase SQL Editor:

```sql
select to_regclass('public.interviews') as interviews_table;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'interviews'
  and indexname = 'interviews_user_scheduled_idx';

select conname, confdeltype
from pg_constraint
where conrelid = 'public.interviews'::regclass
  and contype = 'f';
```

Expected: table and index names are non-null; the foreign key has `confdeltype = 'c'` for cascade deletion.

- [ ] **Step 2: Write the migration**

Create the table and index:

```sql
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  job_application_id uuid not null references public.job_applications (id) on delete cascade,
  round_label text not null check (char_length(trim(round_label)) > 0),
  scheduled_at timestamptz not null,
  location_or_link text,
  notes text,
  created_at timestamptz not null default now()
);

create index interviews_user_scheduled_idx
  on public.interviews (user_id, scheduled_at);
```

Then enable RLS; add select, insert, update, and delete policies restricted to `(select auth.jwt() ->> 'sub') = user_id`; create a `security invoker` ownership function with `set search_path = ''`; and add a trigger before insert or updates to `user_id, job_application_id`.

- [ ] **Step 3: Check migration syntax and migration diff**

Run: `git diff --check -- supabase/migrations/20260813000002_create_interviews.sql`

Expected: no output and exit code 0.

- [ ] **Step 4: Apply and validate in Supabase SQL Editor**

Run the migration contents in the target project’s Supabase SQL Editor, then run:

```sql
select
  to_regclass('public.interviews') as interviews_table,
  (select relrowsecurity
   from pg_class
   where oid = 'public.interviews'::regclass) as rls_enabled,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'interviews'
      and indexname = 'interviews_user_scheduled_idx'
  ) as schedule_index_exists;
```

Expected: `interviews_table = interviews`, `rls_enabled = true`, and `schedule_index_exists = true`.

- [ ] **Step 5: Verify application ownership enforcement**

Using the SQL Editor with a test application ID and its true Clerk user ID, insert one matching row. Then attempt an insert using that same application ID with a different `user_id`:

```sql
insert into public.interviews (user_id, job_application_id, round_label, scheduled_at)
values ('different-user-id', '<test-application-uuid>', 'Phone Screen', now());
```

Expected: the ownership trigger rejects the mismatched row. Remove only the manually created test interview row if one was inserted.

- [ ] **Step 6: Commit the migration after validation**

```bash
git add -- supabase/migrations/20260813000002_create_interviews.sql
git commit -m "feat: add interview scheduling schema"
```
