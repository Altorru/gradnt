begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(23);
insert into auth.users (id, email) values
 ('33333333-3333-3333-3333-333333333333', 'feedback-owner@example.test'),
 ('44444444-4444-4444-4444-444444444444', 'feedback-other@example.test');
select has_table('public', 'ride_feedback', 'private feedback exists');
set local role anon;
select throws_ok($$select * from public.ride_feedback$$, '42501', null, 'anonymous reads denied');
select throws_ok($$select public.save_ride_feedback('strava-123', 7, null, null, '', 0)$$,
 '42501', null, 'anonymous RPC denied');
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select is((public.save_ride_feedback('strava-123', 7, 'good', 'moderate', '  Jambes lourdes  ', 0)->>'revision')::bigint,
 1::bigint, 'owner creates feedback');
select results_eq($$select note from public.ride_feedback$$, array['Jambes lourdes'], 'owner reads trimmed note');
select throws_ok($$select public.save_ride_feedback('strava-123', 1, null, null, 'Lost', 0)$$,
 'PT409', 'feedback_conflict', 'duplicate first write rejected');
select is((public.save_ride_feedback('strava-123', 8, null, 'high', '', 1)->>'revision')::bigint,
 2::bigint, 'current revision can update');
select throws_ok($$select public.save_ride_feedback('strava-123', 1, null, null, 'Stale', 1)$$,
 'PT409', 'feedback_conflict', 'stale revision rejected');
select results_eq($$select perceived_effort::integer from public.ride_feedback$$, array[8], 'rejected writes preserve latest answer');
select throws_ok($$select public.save_ride_feedback('strava-456', 11, null, null, '', 0)$$,
 '23514', null, 'out of range effort rejected');
select throws_ok($$select public.save_ride_feedback('strava-456', null, null, null, '  ', 0)$$,
 '23514', null, 'empty answers rejected');
select throws_ok($$select public.save_ride_feedback('strava-456', null, null, null, repeat('a', 2001), 0)$$,
 '23514', null, 'oversized notes rejected');
select throws_ok($$select public.save_ride_feedback('../another', 1, null, null, '', 0)$$,
 '23514', null, 'invalid ride identity rejected');
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select is_empty($$select * from public.ride_feedback$$, 'another athlete cannot read feedback');
select throws_ok($$insert into public.ride_feedback(user_id, activity_id, perceived_effort)
 values ('33333333-3333-3333-3333-333333333333', 'strava-456', 1)$$,
 '42501', null, 'direct insert cannot bypass RPC');
select is_empty($$delete from public.ride_feedback where user_id = '33333333-3333-3333-3333-333333333333' returning user_id$$,
 'another athlete cannot delete feedback');
select is((public.save_ride_feedback('strava-123', 3, null, null, '', 0)->>'revision')::bigint,
 1::bigint, 'same ride ID creates only for authenticated caller');
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select results_eq($$select perceived_effort::integer from public.ride_feedback$$, array[8], 'original feedback unchanged');
select throws_ok($$update public.ride_feedback set revision = 100$$, '42501', null, 'direct updates cannot bypass revision checks');
select lives_ok($$delete from public.ride_feedback where activity_id = 'strava-123'$$, 'owner can delete their answers');
select throws_ok($$select public.save_ride_feedback('strava-456', 1, null, null, '', -1)$$,
 '22023', 'invalid_revision', 'negative revision rejected');
select throws_ok($$select public.save_ride_feedback('strava-456', 1, 'invented', null, '', 0)$$,
 '23514', null, 'unsupported feeling rejected');
set local request.jwt.claim.sub = '';
select throws_ok($$select public.save_ride_feedback('strava-456', 1, null, null, '', 0)$$,
 '42501', 'authentication_required', 'RPC without an authenticated identity rejected');
select * from finish();
rollback;
