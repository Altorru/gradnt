-- GRADNT-owned settings and training calendars only. No Strava API activity data.
create table public.user_documents (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('onboarding', 'training_plan')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.user_documents enable row level security;
revoke all on public.user_documents from anon, authenticated;
grant select, insert, update, delete on public.user_documents to authenticated;

create policy documents_select on public.user_documents for select to authenticated
  using ((select auth.uid()) = user_id);
create policy documents_insert on public.user_documents for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy documents_update on public.user_documents for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy documents_delete on public.user_documents for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Serialize changes from two phones: a stale client must reload, never overwrite.
create function public.save_user_document(
  document_kind text, document_payload jsonb, expected_revision bigint
) returns bigint language plpgsql security invoker set search_path = '' as $$
declare next_revision bigint;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if expected_revision < 0 or expected_revision is null then
    raise exception 'invalid_revision' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.user_documents (user_id, kind, payload)
      values (auth.uid(), document_kind, document_payload)
      on conflict do nothing returning revision into next_revision;
  else
    update public.user_documents set payload = document_payload,
      revision = revision + 1, updated_at = now()
      where user_id = auth.uid() and kind = document_kind and revision = expected_revision
      returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'document_conflict' using errcode = '40001'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_user_document(text, jsonb, bigint) from public, anon;
grant execute on function public.save_user_document(text, jsonb, bigint) to authenticated;
