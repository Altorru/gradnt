-- The service role is the only writer for server-side Strava and push data.
grant all on public.strava_connections to service_role;
grant all on public.push_devices to service_role;
grant all on public.strava_webhook_events to service_role;
