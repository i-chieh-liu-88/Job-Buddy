insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update
set public = false;

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  label text not null check (char_length(trim(label)) > 0),
  file_path text not null unique
    check (char_length(trim(file_path)) > 0)
    check (split_part(file_path, '/', 1) = user_id),
  file_type text not null check (char_length(trim(file_type)) > 0),
  uploaded_at timestamptz not null default now()
);

create index resumes_user_uploaded_idx
  on public.resumes (user_id, uploaded_at desc);

alter table public.resumes enable row level security;

create policy "Users can view their own resumes"
on public.resumes
for select
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can create their own resumes"
on public.resumes
for insert
to authenticated
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own resumes"
on public.resumes
for update
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own resumes"
on public.resumes
for delete
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

alter table public.job_applications
  add column resume_id uuid
  references public.resumes (id)
  on delete set null;

create or replace function public.validate_job_application_resume_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.resume_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.resumes as resume
    where resume.id = new.resume_id
      and resume.user_id = new.user_id
  ) then
    raise exception 'A linked resume must belong to the application owner';
  end if;

  return new;
end;
$$;

create trigger validate_job_application_resume_owner
before insert or update of user_id, resume_id on public.job_applications
for each row
execute function public.validate_job_application_resume_owner();

alter table public.job_applications drop column resume_version;

create policy "Users can view their own resume files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy "Users can upload their own resume files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy "Users can update their own resume files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy "Users can delete their own resume files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);
