create table public.company_research (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  job_application_id uuid not null
    references public.job_applications (id)
    on delete cascade,
  culture_notes text,
  salary_min numeric check (salary_min is null or salary_min >= 0),
  salary_max numeric check (salary_max is null or salary_max >= 0),
  salary_currency text check (
    salary_currency is null
    or salary_currency in ('EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD')
  ),
  salary_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_application_id),
  check (
    salary_min is null
    or salary_max is null
    or salary_min <= salary_max
  )
);

create table public.interviewers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  job_application_id uuid not null
    references public.job_applications (id)
    on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  role text,
  linkedin_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index company_research_user_application_idx
  on public.company_research (user_id, job_application_id);

create index interviewers_user_application_idx
  on public.interviewers (user_id, job_application_id);

alter table public.company_research enable row level security;
alter table public.interviewers enable row level security;

create policy "Users can view their own company research"
on public.company_research
for select
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can create their own company research"
on public.company_research
for insert
to authenticated
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own company research"
on public.company_research
for update
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own company research"
on public.company_research
for delete
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can view their own interviewers"
on public.interviewers
for select
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can create their own interviewers"
on public.interviewers
for insert
to authenticated
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own interviewers"
on public.interviewers
for update
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own interviewers"
on public.interviewers
for delete
to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create or replace function public.validate_company_research_application_owner()
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
    raise exception 'Company research must belong to the job application owner';
  end if;

  return new;
end;
$$;

create trigger validate_company_research_application_owner
before insert or update of user_id, job_application_id on public.company_research
for each row
execute function public.validate_company_research_application_owner();

create or replace function public.validate_interviewer_application_owner()
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
    raise exception 'Interviewer must belong to the job application owner';
  end if;

  return new;
end;
$$;

create trigger validate_interviewer_application_owner
before insert or update of user_id, job_application_id on public.interviewers
for each row
execute function public.validate_interviewer_application_owner();

create trigger set_company_research_updated_at
before update on public.company_research
for each row
execute function public.set_updated_at();

create trigger set_interviewers_updated_at
before update on public.interviewers
for each row
execute function public.set_updated_at();
