create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name in ('ride_feedback_saved', 'adaptation_accepted', 'app_opened')),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  created_at timestamptz not null default now()
);

create index product_events_user_created_idx
  on public.product_events (user_id, created_at desc);

alter table public.product_events enable row level security;
revoke all on public.product_events from anon, authenticated;
grant insert on public.product_events to authenticated;

create policy product_events_insert on public.product_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
