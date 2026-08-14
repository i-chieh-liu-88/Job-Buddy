alter table public.resumes
  add column file_size bigint not null default 0
  check (file_size >= 0);
