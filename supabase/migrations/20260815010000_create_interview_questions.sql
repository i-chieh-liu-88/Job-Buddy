create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  interview_id uuid not null references public.interviews (id) on delete cascade,
  question_text text not null check (char_length(trim(question_text)) > 0),
  my_answer_notes text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index interview_questions_user_interview_idx
  on public.interview_questions (user_id, interview_id);
create index interview_questions_tags_gin_idx
  on public.interview_questions using gin (tags);

alter table public.interview_questions enable row level security;

create policy "Users can view their own interview questions"
on public.interview_questions for select to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can create their own interview questions"
on public.interview_questions for insert to authenticated
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own interview questions"
on public.interview_questions for update to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can delete their own interview questions"
on public.interview_questions for delete to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create or replace function public.validate_interview_question_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.interviews as interview
    where interview.id = new.interview_id and interview.user_id = new.user_id
  ) then
    raise exception 'An interview question must belong to the interview owner';
  end if;
  return new;
end;
$$;

create trigger validate_interview_question_owner
before insert or update of user_id, interview_id on public.interview_questions
for each row execute function public.validate_interview_question_owner();
