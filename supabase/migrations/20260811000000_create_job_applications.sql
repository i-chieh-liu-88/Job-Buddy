create extension if not exists pgcrypto;

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  company text not null check (char_length(trim(company)) > 0),
  position text not null check (char_length(trim(position)) > 0),
  job_url text,
  status text not null default 'saved'
    check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  applied_date date,
  notes text,
  resume_version text,
  order_index integer not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_applications_user_board_idx
  on public.job_applications (user_id, status, order_index);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_job_applications_updated_at
before update on public.job_applications
for each row
execute function public.set_updated_at();

alter table public.job_applications enable row level security;

create policy "Users can view their own job applications"
on public.job_applications
for select
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can create their own job applications"
on public.job_applications
for insert
to authenticated
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own job applications"
on public.job_applications
for update
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own job applications"
on public.job_applications
for delete
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

