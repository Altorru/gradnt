alter table public.product_events
  drop constraint product_events_event_name_check;

alter table public.product_events
  add constraint product_events_event_name_check
  check (
    event_name in (
      'ride_feedback_opened',
      'ride_feedback_deferred',
      'ride_feedback_saved',
      'ride_detail_opened',
      'adaptation_accepted',
      'app_opened'
    )
  );
