create or replace function public.reorder_job_applications(p_updates jsonb)
returns setof public.job_applications
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id text := auth.jwt() ->> 'sub';
  v_parsed_count integer;
  v_distinct_count integer;
  v_owned_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(p_updates) <> 'array' or jsonb_array_length(p_updates) = 0 then
    raise exception 'Updates must be a non-empty array';
  end if;

  select count(*), count(distinct parsed.id)
  into v_parsed_count, v_distinct_count
  from jsonb_to_recordset(p_updates) as parsed(
    id uuid,
    status text,
    order_index integer
  );

  if v_parsed_count <> jsonb_array_length(p_updates)
    or v_distinct_count <> v_parsed_count then
    raise exception 'Updates must contain unique application IDs';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_updates) as parsed(
      id uuid,
      status text,
      order_index integer
    )
    where parsed.id is null
      or parsed.status not in ('saved', 'applied', 'interview', 'offer', 'rejected')
      or parsed.order_index is null
      or parsed.order_index < 0
  ) then
    raise exception 'Updates contain invalid values';
  end if;

  select count(*)
  into v_owned_count
  from public.job_applications as application
  inner join jsonb_to_recordset(p_updates) as parsed(
    id uuid,
    status text,
    order_index integer
  ) on parsed.id = application.id
  where application.user_id = v_user_id;

  if v_owned_count <> v_parsed_count then
    raise exception 'One or more applications are unavailable';
  end if;

  return query
  with parsed_updates as (
    select parsed.id, parsed.status, parsed.order_index
    from jsonb_to_recordset(p_updates) as parsed(
      id uuid,
      status text,
      order_index integer
    )
  )
  update public.job_applications as application
  set
    status = parsed_updates.status,
    order_index = parsed_updates.order_index
  from parsed_updates
  where application.id = parsed_updates.id
    and application.user_id = v_user_id
  returning application.*;
end;
$$;

revoke all on function public.reorder_job_applications(jsonb) from public;
grant execute on function public.reorder_job_applications(jsonb) to authenticated;
