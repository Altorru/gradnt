begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);
insert into auth.users (id, email) values
 ('55555555-5555-5555-5555-555555555555', 'ride-owner@example.test'),
 ('66666666-6666-6666-6666-666666666666', 'ride-other@example.test');
select has_table('public', 'owned_activities', 'owned activities table exists');
set local role anon;
select throws_ok($$select * from public.owned_activities$$, '42501', null, 'anonymous reads denied');
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
insert into public.owned_activities(user_id, source, start_at, payload)
 values ('55555555-5555-5555-5555-555555555555', 'manual', now(), '{"source":"manual"}');
select is((select count(*) from public.owned_activities), 1::bigint, 'owner reads their ride');
select throws_ok($$insert into public.owned_activities(user_id, source, start_at, payload)
 values ('55555555-5555-5555-5555-555555555555', 'strava', now(), '{}')$$,
 '23514', null, 'Strava API activities cannot enter durable owned table');
select throws_ok($$insert into public.owned_activities(user_id, source, start_at, payload)
 values ('55555555-5555-5555-5555-555555555555', 'file', now(), '{}')$$,
 '23514', null, 'original file import needs a hash');
set local request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
select is_empty($$select * from public.owned_activities$$, 'another rider cannot read');
select throws_ok($$insert into public.owned_activities(user_id, source, start_at, payload)
 values ('55555555-5555-5555-5555-555555555555', 'manual', now(), '{}')$$,
 '42501', null, 'another rider cannot insert under owner identity');
select is_empty($$delete from public.owned_activities
 where user_id = '55555555-5555-5555-5555-555555555555' returning id$$,
 'another rider cannot delete');
set local request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
select lives_ok($$delete from public.owned_activities$$, 'owner may delete their ride');
select * from finish();
rollback;
