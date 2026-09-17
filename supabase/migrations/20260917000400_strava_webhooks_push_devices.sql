-- Server-side Strava association. Tokens never leave Edge Functions and are
-- inaccessible to anon/authenticated roles.
create table public.strava_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  athlete_id text not null unique check (athlete_id ~ '^[0-9]+$'),
  display_name text,
  scopes text[] not null default '{}',
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.strava_connections enable row level security;
revoke all on public.strava_connections from anon, authenticated;
grant all on public.strava_connections to service_role;

create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null check (char_length(expo_push_token) between 10 and 512),
  platform text not null check (platform in ('ios', 'android')),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);
alter table public.push_devices enable row level security;
revoke all on public.push_devices from anon, authenticated;
grant all on public.push_devices to service_role;
grant select, delete on public.push_devices to authenticated;
create policy "read own push devices" on public.push_devices for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "delete own push devices" on public.push_devices for delete to authenticated
  using ((select auth.uid()) = user_id);

create function public.register_push_device(device_token text, device_platform text)
returns public.push_devices language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  saved public.push_devices;
begin
  if caller is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if device_token is null or char_length(device_token) not between 10 and 512 then
    raise exception 'invalid_push_token' using errcode = '22023';
  end if;
  if device_platform not in ('ios', 'android') then
    raise exception 'invalid_push_platform' using errcode = '22023';
  end if;
  insert into public.push_devices(user_id, expo_push_token, platform, enabled, last_seen_at)
    values (caller, device_token, device_platform, true, now())
    on conflict (user_id, expo_push_token) do update set
      platform = excluded.platform, enabled = true, last_seen_at = now()
    returning * into saved;
  return saved;
end;
$$;
revoke all on function public.register_push_device(text, text) from public, anon;
grant execute on function public.register_push_device(text, text) to authenticated;

-- A webhook is retried by Strava. This table is the durable idempotency key;
-- only the service role can write or process events.
create table public.strava_webhook_events (
  event_key text primary key,
  subscription_id bigint not null,
  object_type text not null check (object_type in ('activity', 'athlete')),
  object_id bigint not null,
  owner_id bigint not null,
  aspect_type text not null check (aspect_type in ('create', 'update', 'delete')),
  event_time timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error text,
  received_at timestamptz not null default now()
);
alter table public.strava_webhook_events enable row level security;
revoke all on public.strava_webhook_events from anon, authenticated;
grant all on public.strava_webhook_events to service_role;
