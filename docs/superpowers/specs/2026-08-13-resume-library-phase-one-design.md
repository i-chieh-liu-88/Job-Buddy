# Resume Library Phase One Design

## Goal

Add the private Supabase data and file-storage foundation for a personal resume library. This phase intentionally stops before building upload, library, picker, or preview UI.

## Scope

- Create a private `resumes` Storage bucket.
- Create `public.resumes` metadata records.
- Enforce owner-only RLS for both metadata rows and Storage objects.
- Replace `job_applications.resume_version` with nullable `job_applications.resume_id`.
- Delete all existing free-text `resume_version` values as explicitly approved by the user.
- Update local typed database definitions so later UI work targets `resume_id`.
- Remove the legacy free-text resume input from create and detail forms. The picker arrives in phase three; until then, all newly created and updated cards retain `resume_id = null`.

## Data Model

`public.resumes` contains:

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | primary key, `gen_random_uuid()` default |
| `user_id` | `text` | non-null; Clerk JWT subject |
| `label` | `text` | non-empty after trimming |
| `file_path` | `text` | non-empty; unique Storage object path |
| `file_type` | `text` | non-empty MIME type |
| `uploaded_at` | `timestamptz` | non-null, `now()` default |

`public.job_applications` loses `resume_version` and gains `resume_id uuid null references public.resumes(id) on delete set null`. A later deletion of a resume unlinks cards without deleting those cards.

## Storage Convention

The only accepted future object naming convention is:

```text
{Clerk user_id}/{resume UUID}/{safe filename}
```

The Storage bucket is private. The application will use authenticated signed URLs for preview/download in a later phase; it will not make resume files public.

## Authorization

The app already authenticates Supabase with Clerk. Both table and object policies use `auth.jwt() ->> 'sub'` as the owner identity.

- `resumes` select, insert, update, and delete policies compare `user_id` to that subject claim.
- Storage select, insert, update, and delete policies apply only to `storage.objects` rows where `bucket_id = 'resumes'` and the first path segment equals that subject claim.
- Insert additionally requires that the first path segment equals the authenticated subject, preventing users from uploading into another user's prefix.

## Migration Order

1. Insert the `resumes` private bucket record if it does not already exist.
2. Create `public.resumes`, indexes, RLS, and policies.
3. Add nullable `resume_id` to `public.job_applications` with its foreign key.
4. Drop `resume_version`, deliberately discarding its old text values.
5. Create Storage object policies scoped to the `resumes` bucket.

## Type Contract

The local `Database` type gains `Resume`, `ResumeInsert`, and `ResumeUpdate`, plus the `resumes` table definition. `JobApplication`, insertion, and update types expose `resume_id: string | null` rather than `resume_version`.

## Non-Goals

This phase does not upload files, list resumes, delete files, expose a picker, generate URLs, or preview PDF/Word content. It removes the obsolete free-text form controls solely so application saves do not send a removed database column. Those are independently testable subsequent phases requested by the user.

## Validation

After applying the migration in Supabase, verify that an authenticated user can create and query only their own `resumes` metadata, cannot access another user's Storage prefix, and that `job_applications` has `resume_id` but not `resume_version`.
