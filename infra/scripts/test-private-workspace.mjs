import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../../apps/mobile/package.json', import.meta.url))
const { createClient } = require('@supabase/supabase-js')

// Keys remain in memory. Refuse to create test accounts in any remote project.
const status = JSON.parse(
  execFileSync('supabase', ['status', '--output', 'json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }),
)
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(status.API_URL).hostname))
const options = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(15000) }) },
}
const admin = createClient(status.API_URL, status.SECRET_KEY, options)
const client = () => createClient(status.API_URL, status.PUBLISHABLE_KEY, options)
const users = []

async function createUser() {
  const credentials = {
    email: `gradnt-${randomUUID()}@example.test`,
    password: `G-${randomUUID()}-a1!`,
  }
  const { data, error } = await admin.auth.admin.createUser({ ...credentials, email_confirm: true })
  assert.equal(error, null)
  users.push(data.user.id)
  const device = client()
  const login = await device.auth.signInWithPassword(credentials)
  assert.equal(login.error, null)
  return { device, credentials, id: data.user.id }
}

try {
  console.log('Testing local authentication…')
  const owner = await createUser()
  const other = await createUser()
  const secondPhone = client()
  assert.equal((await secondPhone.auth.signInWithPassword(owner.credentials)).error, null)
  console.log('Testing private API documents…')
  const anonymousRead = await client().from('user_documents').select('kind')
  assert.equal(anonymousRead.error?.code, '42501')

  const payload = {
    profile: { discipline: 'road', experience: 'beginner', weeklyVolume: 'lt3' },
    goal: { type: 'distance', targetValue: '100', eventName: '' },
    availability: null,
    strava: null,
    currentStep: 3,
    completed: false,
  }
  const created = await owner.device.rpc('save_user_document', {
    document_kind: 'onboarding',
    document_payload: payload,
    expected_revision: 0,
  })
  assert.equal(created.error, null)
  assert.equal(created.data, 1)

  const strangerRead = await other.device.from('user_documents').select('payload')
  assert.equal(strangerRead.error, null)
  assert.deepEqual(strangerRead.data, [])
  const strangerUpdate = await other.device
    .from('user_documents')
    .update({ payload: { stolen: true } })
    .eq('user_id', owner.id)
    .select('user_id')
  assert.equal(strangerUpdate.error, null)
  assert.deepEqual(strangerUpdate.data, [])

  const changed = { ...payload, goal: { ...payload.goal, targetValue: '150' } }
  const saved = await owner.device.rpc('save_user_document', {
    document_kind: 'onboarding',
    document_payload: changed,
    expected_revision: 1,
  })
  assert.equal(saved.error, null)
  assert.equal(saved.data, 2)
  const stale = await secondPhone.rpc('save_user_document', {
    document_kind: 'onboarding',
    document_payload: payload,
    expected_revision: 1,
  })
  assert.equal(stale.status, 409)
  assert.equal(stale.error?.code, 'PT409')
  const restored = await secondPhone
    .from('user_documents')
    .select('payload, revision')
    .eq('kind', 'onboarding')
    .single()
  assert.equal(restored.error, null)
  assert.equal(restored.data.revision, 2)
  assert.deepEqual(restored.data.payload, changed)
  console.log('Testing private ride feedback…')
  assert.equal((await client().from('ride_feedback').select('activity_id')).error?.code, '42501')
  const feedback = {
    ride_id: 'strava-123',
    effort: 7,
    ride_feeling: 'good',
    ride_fatigue: 'moderate',
    ride_note: '  Real athlete answer  ',
    expected_revision: 0,
  }
  const firstFeedback = await owner.device.rpc('save_ride_feedback', feedback)
  assert.equal(firstFeedback.error, null)
  assert.equal(firstFeedback.data.revision, 1)
  assert.equal(firstFeedback.data.note, 'Real athlete answer')
  assert.equal('user_id' in firstFeedback.data, false)
  const otherFeedbackRead = await other.device.from('ride_feedback').select('note')
  assert.equal(otherFeedbackRead.error, null)
  assert.deepEqual(otherFeedbackRead.data, [])
  const secondDeviceRead = await secondPhone
    .from('ride_feedback')
    .select('note, revision')
    .eq('activity_id', feedback.ride_id)
    .single()
  assert.equal(secondDeviceRead.error, null)
  assert.equal(secondDeviceRead.data.note, firstFeedback.data.note)
  const changedFeedback = await owner.device.rpc('save_ride_feedback', {
    ...feedback,
    effort: 8,
    expected_revision: 1,
  })
  assert.equal(changedFeedback.error, null)
  assert.equal(changedFeedback.data.revision, 2)
  const staleFeedback = await secondPhone.rpc('save_ride_feedback', {
    ...feedback,
    expected_revision: 1,
  })
  assert.equal(staleFeedback.status, 409)
  assert.equal(staleFeedback.error?.code, 'PT409')
  const bypassUpdate = await owner.device
    .from('ride_feedback')
    .update({ perceived_effort: 1 })
    .eq('activity_id', feedback.ride_id)
  assert.equal(bypassUpdate.error?.code, '42501')
  const invalidFeedback = await owner.device.rpc('save_ride_feedback', {
    ...feedback,
    ride_id: 'strava-456',
    effort: 11,
  })
  assert.equal(invalidFeedback.error?.code, '23514')
  const latestFeedback = await secondPhone
    .from('ride_feedback')
    .select('perceived_effort, revision')
    .single()
  assert.equal(latestFeedback.error, null)
  assert.deepEqual(latestFeedback.data, { perceived_effort: 8, revision: 2 })
  console.log(
    'PASS: local authentication, private reads/writes, cross-device restore, ride feedback and stale-write protection.',
  )
} finally {
  for (const id of users) {
    const { error } = await admin.auth.admin.deleteUser(id)
    assert.equal(error, null)
  }
}
