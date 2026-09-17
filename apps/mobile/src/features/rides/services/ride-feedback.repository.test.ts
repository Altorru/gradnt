import { beforeEach, describe, expect, it, vi } from 'vitest'

import { emptyFeedback } from '../domain/ride-feedback'
import {
  clearFeedbackDraft,
  loadFeedbackDraft,
  loadRideFeedback,
  saveFeedbackDraft,
  saveRideFeedback,
} from './ride-feedback.repository'

const mocks = vi.hoisted(() => ({
  values: new Map<string, string>(),
  userId: null as string | null,
  getSession: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
  setItem: vi.fn(),
}))
vi.mock('@/services/local-storage', () => ({
  localStorage: {
    getItem: async (key: string) => mocks.values.get(key) ?? null,
    setItem: (key: string, value: string) => mocks.setItem(key, value),
    removeItem: async (key: string) => {
      mocks.values.delete(key)
    },
  },
}))
vi.mock('@/services/supabase/client', () => ({
  getSupabaseClient: () => ({
    auth: { getSession: mocks.getSession },
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
    }),
    rpc: mocks.rpc,
  }),
}))
const activityId = 'strava-123'
const answers = { ...emptyFeedback, perceivedEffort: 7, note: '  Jambes lourdes  ' }
const row = {
  activity_id: activityId,
  perceived_effort: 7,
  feeling: null,
  fatigue: null,
  note: 'Jambes lourdes',
  revision: 1,
  updated_at: '2026-09-17T16:00:00+00:00',
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.values.clear()
  mocks.userId = null
  mocks.getSession.mockImplementation(async () => ({
    data: { session: mocks.userId === null ? null : { user: { id: mocks.userId } } },
    error: null,
  }))
  mocks.setItem.mockImplementation(async (key: string, value: string) => {
    mocks.values.set(key, value)
  })
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
  mocks.rpc.mockResolvedValue({ data: row, error: null })
})

describe('durable private ride feedback', () => {
  it('restores real answers after a repository restart', async () => {
    const initial = await loadRideFeedback(activityId, null)
    expect(initial.feedback).toBeNull()
    const saved = await saveRideFeedback(initial, answers)
    expect(saved.feedback?.responses.note).toBe('Jambes lourdes')
    expect(await loadRideFeedback(activityId, null)).toEqual(saved)
  })
  it('isolates answers and drafts by ride', async () => {
    await saveRideFeedback(await loadRideFeedback(activityId, null), answers)
    await saveFeedbackDraft(activityId, null, { responses: answers, baseRevision: 0 })
    expect((await loadRideFeedback('strava-456', null)).feedback).toBeNull()
    expect(await loadFeedbackDraft('strava-456', null)).toBeNull()
  })
  it('keeps only one active answer and increments its revision', async () => {
    const first = await saveRideFeedback(await loadRideFeedback(activityId, null), answers)
    const second = await saveRideFeedback(first, { ...emptyFeedback, fatigue: 'high' })
    expect(second.feedback?.revision).toBe(2)
    expect(second.feedback?.responses.perceivedEffort).toBeNull()
    await expect(saveRideFeedback(first, answers)).rejects.toThrow('feedback_conflict')
    expect(await loadRideFeedback(activityId, null)).toEqual(second)
  })
  it('serializes competing first writes so one cannot silently overwrite another', async () => {
    const initial = await loadRideFeedback(activityId, null)
    const results = await Promise.allSettled([
      saveRideFeedback(initial, answers),
      saveRideFeedback(initial, { ...answers, note: 'Concurrent' }),
    ])
    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected'])
    expect((await loadRideFeedback(activityId, null)).feedback?.responses.note).toBe(
      'Jambes lourdes',
    )
  })
  it('reports failed storage instead of claiming success', async () => {
    mocks.setItem.mockRejectedValueOnce(new Error('disk_full'))
    await expect(
      saveRideFeedback(await loadRideFeedback(activityId, null), answers),
    ).rejects.toThrow('disk_full')
    expect((await loadRideFeedback(activityId, null)).feedback).toBeNull()
  })
  it('never overwrites a corrupted local response', async () => {
    mocks.values.set(`gradnt.ride-feedback.saved.v1.local.${activityId}`, '{invalid')
    await expect(loadRideFeedback(activityId, null)).rejects.toThrow()
    expect(mocks.setItem).not.toHaveBeenCalled()
  })
  it('restores then explicitly clears a draft, with its original base revision', async () => {
    await saveFeedbackDraft(activityId, null, { responses: answers, baseRevision: 3 })
    expect(await loadFeedbackDraft(activityId, null)).toEqual({
      responses: { ...answers, note: 'Jambes lourdes' },
      baseRevision: 3,
    })
    await clearFeedbackDraft(activityId, null)
    expect(await loadFeedbackDraft(activityId, null)).toBeNull()
  })
  it('isolates draft answers across authenticated cyclists and guest mode', async () => {
    mocks.userId = 'owner'
    await saveFeedbackDraft(activityId, 'owner', { responses: answers, baseRevision: 0 })
    mocks.userId = 'other'
    expect(await loadFeedbackDraft(activityId, 'other')).toBeNull()
    mocks.userId = null
    expect(await loadFeedbackDraft(activityId, null)).toBeNull()
    mocks.userId = 'owner'
    expect((await loadFeedbackDraft(activityId, 'owner'))?.responses.note).toBe('Jambes lourdes')
  })
  it('uses cloud storage exclusively when signed in and normalizes server timestamps', async () => {
    mocks.userId = 'owner'
    mocks.maybeSingle.mockResolvedValueOnce({ data: row, error: null })
    const loaded = await loadRideFeedback(activityId, 'owner')
    expect(loaded.feedback?.updatedAt).toBe('2026-09-17T16:00:00.000Z')
    mocks.rpc.mockResolvedValueOnce({ data: { ...row, revision: 2 }, error: null })
    expect((await saveRideFeedback(loaded, answers)).feedback?.revision).toBe(2)
    expect(mocks.rpc).toHaveBeenCalledWith(
      'save_ride_feedback',
      expect.objectContaining({
        expected_revision: 1,
        ride_id: activityId,
        ride_note: 'Jambes lourdes',
      }),
    )
    expect(mocks.setItem).not.toHaveBeenCalled()
  })
  it('does not fall back to guest data after a cloud read or write error', async () => {
    mocks.userId = 'owner'
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('offline') })
    await expect(loadRideFeedback(activityId, 'owner')).rejects.toThrow('offline')
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error('feedback_conflict') })
    await expect(
      saveRideFeedback({ scope: 'owner', activityId, feedback: null }, answers),
    ).rejects.toThrow('feedback_conflict')
    expect(mocks.values.size).toBe(0)
  })
  it('rejects stale account scopes before touching storage or RPC', async () => {
    mocks.userId = 'other'
    await expect(loadRideFeedback(activityId, 'owner')).rejects.toThrow('feedback_account_changed')
    await expect(
      saveRideFeedback({ scope: 'owner', activityId, feedback: null }, answers),
    ).rejects.toThrow('feedback_account_changed')
    await expect(loadFeedbackDraft(activityId, 'owner')).rejects.toThrow('feedback_account_changed')
    await expect(
      saveFeedbackDraft(activityId, null, { responses: answers, baseRevision: 0 }),
    ).rejects.toThrow('feedback_account_changed')
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.setItem).not.toHaveBeenCalled()
  })
  it('rejects account switches during a server request', async () => {
    mocks.userId = 'owner'
    mocks.maybeSingle.mockImplementationOnce(async () => {
      mocks.userId = 'other'
      return { data: row, error: null }
    })
    await expect(loadRideFeedback(activityId, 'owner')).rejects.toThrow('feedback_account_changed')
  })
  it('does not populate the cache with a save completed after an account switch', async () => {
    mocks.userId = 'owner'
    mocks.rpc.mockImplementationOnce(async () => {
      mocks.userId = 'other'
      return { data: row, error: null }
    })
    await expect(
      saveRideFeedback({ scope: 'owner', activityId, feedback: null }, answers),
    ).rejects.toThrow('feedback_account_changed')
  })
  it('rejects mismatched stored ride identities', async () => {
    mocks.userId = 'owner'
    mocks.maybeSingle.mockResolvedValueOnce({
      data: { ...row, activity_id: 'strava-999' },
      error: null,
    })
    await expect(loadRideFeedback(activityId, 'owner')).rejects.toThrow(
      'feedback_activity_mismatch',
    )
  })
  it('validates identifiers and answers before saving', async () => {
    await expect(loadRideFeedback('../other', null)).rejects.toThrow()
    expect(() =>
      saveRideFeedback({ activityId, scope: null, feedback: null }, emptyFeedback),
    ).toThrow()
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.setItem).not.toHaveBeenCalled()
  })
})
