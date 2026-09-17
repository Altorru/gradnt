begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.test');

select has_table('public', 'user_documents', 'private product documents exist');
set local role anon;
select throws_ok($$select * from public.user_documents$$, '42501', null, 'anonymous reads denied');
select throws_ok($$select public.save_user_document('onboarding', '{}', 0)$$,
  '42501', null, 'anonymous RPC writes denied');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select is(public.save_user_document('training_plan', '{"plan":"owner-1"}', 0),
  1::bigint, 'owner creates their plan');
select results_eq($$select payload->>'plan' from public.user_documents$$,
  array['owner-1'], 'owner reads their own plan');
select throws_ok($$select public.save_user_document('training_plan', '{"plan":"lost"}', 0)$$,
  '40001', 'document_conflict', 'a second first writer cannot overwrite an existing plan');
select is(public.save_user_document('training_plan', '{"plan":"owner-2"}', 1),
  2::bigint, 'current revision can update');
select throws_ok($$select public.save_user_document('training_plan', '{"plan":"stale"}', 1)$$,
  '40001', 'document_conflict', 'a stale phone cannot overwrite a newer revision');
select results_eq($$select payload->>'plan' from public.user_documents$$,
  array['owner-2'], 'rejected writes preserve data');

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty($$select * from public.user_documents$$, 'another cyclist cannot read the plan');
select throws_ok($$insert into public.user_documents(user_id, kind, payload)
  values ('11111111-1111-1111-1111-111111111111', 'onboarding', '{}')$$,
  '42501', null, 'another cyclist cannot insert for the owner');
select is_empty($$update public.user_documents set payload = '{"plan":"stolen"}'
  where user_id = '11111111-1111-1111-1111-111111111111' returning user_id$$,
  'another cyclist cannot update the owner');
select is_empty($$delete from public.user_documents
  where user_id = '11111111-1111-1111-1111-111111111111' returning user_id$$,
  'another cyclist cannot delete the owner');
select is(public.save_user_document('training_plan', '{"plan":"other"}', 0),
  1::bigint, 'RPC always creates for its caller');
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq($$select payload->>'plan' from public.user_documents$$,
  array['owner-2'], 'owner still sees only their unchanged plan');
select * from finish();
rollback;
