# Resume Library Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a private Supabase resume metadata table and Storage bucket, then replace application free-text resume versions with nullable resume foreign keys.

**Architecture:** A single migration owns all persistent changes: the `resumes` bucket, metadata table, RLS policies, `resume_id` foreign key, and removal of the old text column. Local TypeScript types and form serialization mirror the migrated schema; the old free-text input is removed until the resume picker is introduced in phase three.

**Tech Stack:** Supabase Postgres, Supabase Storage, Clerk JWT through Supabase `auth.jwt()`, TypeScript, Vitest.

## Global Constraints

- The `resumes` bucket is private; do not create public URLs.
- All records and files are owned by the Clerk JWT subject: `(select auth.jwt() ->> 'sub')`.
- File paths use `{Clerk user_id}/{resume UUID}/{safe filename}`; Storage policies inspect the first folder via `storage.foldername(name)[1]`.
- Existing `job_applications.resume_version` text values are deliberately discarded.
- `job_applications.resume_id` is nullable and uses `on delete set null`.
- Phase one creates no upload, library, picker, preview, or download UI; it only removes the invalid legacy text control.

---

### Task 1: Security migration

**Files:**
- Create: `supabase/migrations/20260813000000_create_resumes_and_link_applications.sql`

**Interfaces:**
- Consumes: existing `public.job_applications.user_id text` and Clerk-authenticated Supabase JWT `sub`.
- Produces: private `storage.buckets` row named `resumes`; `public.resumes`; owner-only table and object policies; `public.job_applications.resume_id uuid`.

- [ ] **Step 1: Capture the migration acceptance contract**

Create a migration that yields the following observable schema after it runs:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'job_applications'
  and column_name in ('resume_id', 'resume_version');
-- returns resume_id only

select is_public
from storage.buckets
where id = 'resumes';
-- returns false
```

- [ ] **Step 2: Apply the migration SQL**

```sql
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = false;

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  label text not null check (char_length(trim(label)) > 0),
  file_path text not null unique check (char_length(trim(file_path)) > 0),
  file_type text not null check (char_length(trim(file_type)) > 0),
  uploaded_at timestamptz not null default now()
);

alter table public.job_applications
  add column resume_id uuid references public.resumes(id) on delete set null;

alter table public.job_applications drop column resume_version;
```

Enable RLS on `public.resumes`, add owner-only select/insert/update/delete policies using `(select auth.jwt() ->> 'sub')`, and add equivalent `storage.objects` policies for `bucket_id = 'resumes'` where `(storage.foldername(name))[1]` matches the same JWT subject.

- [ ] **Step 3: Run the migration in Supabase**

Run the new file in the Supabase SQL Editor against the Jobuddy project. This destructive step removes all existing free-text `resume_version` values, as approved.

- [ ] **Step 4: Verify the deployed schema and policies**

Run these read-only checks in Supabase SQL Editor:

```sql
select id, name, public from storage.buckets where id = 'resumes';

select column_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'job_applications'
  and column_name in ('resume_id', 'resume_version');

select policyname, cmd
from pg_policies
where schemaname in ('public', 'storage')
  and ((schemaname = 'public' and tablename = 'resumes')
    or (schemaname = 'storage' and tablename = 'objects'))
order by schemaname, tablename, policyname;
```

Expected: private `resumes` bucket, nullable `resume_id` only, four `resumes` policies, and four bucket-scoped object policies.

### Task 2: Typed database contract

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.ts`
- Modify: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.tsx`
- Modify: `src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.tsx`
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.tsx`
- Modify: `src/hooks/useJobApplications.test.tsx`
- Modify: `src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts`
- Modify: `src/components/molecules/JobApplicationFormFields/JobApplicationFormFields.test.tsx`
- Modify: `src/components/molecules/JobApplicationCard/JobApplicationCard.test.tsx`
- Modify: `src/components/organisms/AddJobApplicationModal/AddJobApplicationModal.test.tsx`
- Modify: `src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx`
- Modify: `src/components/organisms/KanbanBoard/KanbanBoard.test.tsx`
- Modify: `src/components/organisms/KanbanBoard/reorderApplications.test.ts`
- Modify: `src/pages/KanbanBoardPage/KanbanBoardPage.test.tsx`

**Interfaces:**
- Consumes: deployed `public.resumes` and migrated `public.job_applications` schema.
- Produces: `Resume`, `ResumeInsert`, `ResumeUpdate`, and application test fixtures with `resume_id` instead of `resume_version`.

- [ ] **Step 1: Write failing schema and form expectations**

Change one existing JobApplication fixture to declare `resume_id: null` and remove `resume_version`. Add a type-level use of the new resume record:

```ts
const resume: Resume = {
  id: "resume-1",
  user_id: "user-1",
  label: "Frontend v2",
  file_path: "user-1/resume-1/frontend-v2.pdf",
  file_type: "application/pdf",
  uploaded_at: "2026-08-13T00:00:00.000Z",
};
```

Update a form-schema test to assert that a parsed form payload has `resume_id: null` and has no `resume_version` property. Update form-render tests to assert that the old `Resume version` label is absent.

- [ ] **Step 2: Run the focused type/test check and verify it fails**

Run: `npm.cmd run build`

Expected: TypeScript errors because `JobApplication` still requires `resume_version`, form values still serialize that property, and there is no `Resume` type.

- [ ] **Step 3: Update the local Database type**

```ts
export type Resume = {
  id: string;
  user_id: string;
  label: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
};

export type JobApplication = {
  // existing fields
  resume_id: string | null;
};
```

Add `resumes` to `Database.public.Tables` with `Row`, `Insert`, and `Update`; remove every `resume_version` field from local typed application shapes. Update all test fixtures to use `resume_id: null` or a string id.

In `jobApplicationFormSchema.ts`, remove `resume_version` from the form fields and return `resume_id: null` from parsing. Remove the Resume version form field from `JobApplicationFormFields.tsx`; remove that field from `fieldOrder` in both modal components. This ensures no create or update request sends a database column that has been dropped.

- [ ] **Step 4: Run the focused tests and type check**

Run: `npx.cmd vitest run src/hooks/useJobApplications.test.tsx src/components/molecules/JobApplicationFormFields/jobApplicationFormSchema.test.ts src/components/organisms/JobApplicationDetailDrawer/JobApplicationDetailDrawer.test.tsx --reporter=dot; npm.cmd run build`

Expected: Tests pass, TypeScript accepts the migrated contract, and no create/update payload contains `resume_version`.

### Task 3: Repository verification and handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-08-13-resume-library-phase-one-design.md` only if the deployed migration requires a correction.

**Interfaces:**
- Consumes: completed migration and local types.
- Produces: a safe stopping point before upload/library UI.

- [ ] **Step 1: Run the complete local verification suite**

Run: `npm.cmd run lint; npx.cmd vitest run --reporter=dot; npm.cmd run build; git diff --check`

Expected: lint, all tests, and production build pass; diff check reports no whitespace errors.

- [ ] **Step 2: Report the Supabase execution checkpoint**

Tell the user to apply `supabase/migrations/20260813000000_create_resumes_and_link_applications.sql` through their Supabase project, then verify the four table policies, four Storage policies, private bucket, and `resume_id` schema before moving to Upload UI.

- [ ] **Step 3: Commit the phase only if the user asks for a commit**

```powershell
git add -- supabase/migrations/20260813000000_create_resumes_and_link_applications.sql src/types/database.ts
git commit -m "feat: add private resume storage schema"
```
