-- Only athlete-entered answers; no Strava performance data or API payloads.
create table public.ride_feedback (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id text not null check (char_length(activity_id) between 1 and 128 and activity_id ~ '^[a-zA-Z0-9_-]+$'),
  perceived_effort integer check (perceived_effort between 1 and 10),
  feeling text check (feeling in ('difficult', 'okay', 'good', 'excellent')),
  fatigue text check (fatigue in ('low', 'moderate', 'high')),
  note text not null default '' check (char_length(note) <= 2000),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_id),
  check (perceived_effort is not null or feeling is not null or fatigue is not null or char_length(btrim(note)) > 0)
);
alter table public.ride_feedback enable row level security;
revoke all on public.ride_feedback from anon, authenticated;
grant select, delete on public.ride_feedback to authenticated;
create policy "read own ride feedback" on public.ride_feedback for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "delete own ride feedback" on public.ride_feedback for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Writes go exclusively through compare-and-swap: callers cannot bypass revisions.
-- No supplied user identifier is trusted. Fixed search_path and fully qualified objects.
create function public.save_ride_feedback(
  ride_id text, effort integer, ride_feeling text, ride_fatigue text, ride_note text, expected_revision bigint
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  saved public.ride_feedback;
begin
  if caller is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if expected_revision is null or expected_revision < 0 then
    raise exception 'invalid_revision' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.ride_feedback(user_id, activity_id, perceived_effort, feeling, fatigue, note)
      values (caller, ride_id, effort, ride_feeling, ride_fatigue, coalesce(btrim(ride_note), ''))
      on conflict (user_id, activity_id) do nothing returning * into saved;
  else
    update public.ride_feedback set perceived_effort = effort, feeling = ride_feeling,
      fatigue = ride_fatigue, note = coalesce(btrim(ride_note), ''), revision = revision + 1, updated_at = now()
      where user_id = caller and activity_id = ride_id and revision = expected_revision returning * into saved;
  end if;
  if saved.user_id is null then raise exception 'feedback_conflict' using errcode = 'PT409'; end if;
  return to_jsonb(saved) - 'user_id';
end;
$$;
revoke all on function public.save_ride_feedback(text, integer, text, text, text, bigint) from public, anon;
grant execute on function public.save_ride_feedback(text, integer, text, text, text, bigint) to authenticated;
