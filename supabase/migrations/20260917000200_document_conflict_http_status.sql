-- An expected revision mismatch is HTTP 409, not a transient serialization
-- failure. SQLSTATE 40001 makes PostgREST retry a business conflict indefinitely.
create or replace function public.save_user_document(
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
  if next_revision is null then raise exception 'document_conflict' using errcode = 'PT409'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_user_document(text, jsonb, bigint) from public, anon;
grant execute on function public.save_user_document(text, jsonb, bigint) to authenticated;
