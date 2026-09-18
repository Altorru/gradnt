-- A rider explicitly requests an AI debrief. The persisted result belongs only
-- to that rider and replaces the earlier result for the same activity.
create table public.ride_ai_analyses (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id text not null check (char_length(activity_id) between 1 and 128 and activity_id ~ '^[a-zA-Z0-9_-]+$'),
  locale text not null check (locale in ('fr', 'en')),
  analysis jsonb not null,
  context jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_id),
  check (jsonb_typeof(analysis) = 'object'),
  check (jsonb_typeof(context) = 'object')
);

alter table public.ride_ai_analyses enable row level security;
revoke all on public.ride_ai_analyses from anon, authenticated;
grant select on public.ride_ai_analyses to authenticated;
grant select, insert, update on public.ride_ai_analyses to service_role;

create policy "read own ride AI analyses" on public.ride_ai_analyses
  for select to authenticated using ((select auth.uid()) = user_id);
