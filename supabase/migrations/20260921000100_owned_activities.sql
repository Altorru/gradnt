-- Rides entered by the rider or imported from an original device file.
-- Strava API activities are deliberately excluded from this durable table.
create table public.owned_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('manual', 'file')),
  start_at timestamptz not null,
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  file_name text,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((source = 'file') = (file_sha256 is not null)),
  unique (user_id, file_sha256)
);

create index owned_activities_user_start_idx
  on public.owned_activities (user_id, start_at desc);

alter table public.owned_activities enable row level security;
revoke all on public.owned_activities from anon, authenticated;
grant select, insert, update, delete on public.owned_activities to authenticated;

create policy owned_activities_select on public.owned_activities
  for select to authenticated using ((select auth.uid()) = user_id);
create policy owned_activities_insert on public.owned_activities
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy owned_activities_update on public.owned_activities
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy owned_activities_delete on public.owned_activities
  for delete to authenticated using ((select auth.uid()) = user_id);
