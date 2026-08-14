create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  job_application_id uuid not null
    references public.job_applications (id)
    on delete cascade,
  round_label text not null check (char_length(trim(round_label)) > 0),
  scheduled_at timestamptz not null,
  location_or_link text,
  notes text,
  created_at timestamptz not null default now()
);

create index interviews_user_scheduled_idx
  on public.interviews (user_id, scheduled_at);

alter table public.interviews enable row level security;

create policy "Users can view their own interviews"
on public.interviews
for select
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can create their own interviews"
on public.interviews
for insert
to authenticated
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own interviews"
on public.interviews
for update
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own interviews"
on public.interviews
for delete
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create or replace function public.validate_interview_application_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.job_applications as application
    where application.id = new.job_application_id
      and application.user_id = new.user_id
  ) then
    raise exception 'An interview must belong to the job application owner';
  end if;

  return new;
end;
$$;

create trigger validate_interview_application_owner
before insert or update of user_id, job_application_id on public.interviews
for each row
execute function public.validate_interview_application_owner();
