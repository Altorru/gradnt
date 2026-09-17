import { z } from 'zod'

import { localStorage } from '@/services/local-storage'
import { getSupabaseClient } from '@/services/supabase/client'
import {
  activityIdSchema,
  feedbackDraftSchema,
  feedbackResponsesSchema,
  rideFeedbackSchema,
  type FeedbackDraft,
  type RideFeedback,
} from '../domain/ride-feedback'

export type FeedbackScope = string | null
export const storedFeedbackDraftSchema = z.object({
  responses: feedbackDraftSchema,
  baseRevision: z.number().int().nonnegative(),
})
export type StoredFeedbackDraft = z.infer<typeof storedFeedbackDraftSchema>
export type FeedbackSnapshot = {
  scope: FeedbackScope
  activityId: string
  feedback: RideFeedback | null
}
const rowSchema = z.object({
  activity_id: activityIdSchema,
  perceived_effort: z.number().int().min(1).max(10).nullable(),
  feeling: feedbackDraftSchema.shape.feeling,
  fatigue: feedbackDraftSchema.shape.fatigue,
  note: z.string().max(2000),
  revision: z.number().int().positive(),
  updated_at: z.string().datetime({ offset: true }),
})
function normalizeRow(value: unknown): RideFeedback {
  const row = rowSchema.parse(value)
  return rideFeedbackSchema.parse({
    activityId: row.activity_id,
    revision: row.revision,
    updatedAt: new Date(row.updated_at).toISOString(),
    responses: {
      perceivedEffort: row.perceived_effort,
      feeling: row.feeling,
      fatigue: row.fatigue,
      note: row.note,
    },
  })
}
async function assertScope(scope: FeedbackScope) {
  const client = getSupabaseClient()
  const session = client ? await client.auth.getSession() : null
  if (session?.error) throw session.error
  if ((session?.data.session?.user.id ?? null) !== scope)
    throw new Error('feedback_account_changed')
  return client
}
function key(activityId: string, scope: FeedbackScope, draft = false) {
  activityIdSchema.parse(activityId)
  return `gradnt.ride-feedback.${draft ? 'draft' : 'saved'}.v1.${scope ?? 'local'}.${activityId}`
}
let queue: Promise<unknown> = Promise.resolve()
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation, operation)
  queue = result.catch(() => undefined)
  return result
}

export async function loadRideFeedback(
  activityId: string,
  scope: FeedbackScope,
): Promise<FeedbackSnapshot> {
  activityIdSchema.parse(activityId)
  const client = await assertScope(scope)
  let feedback: RideFeedback | null
  if (scope !== null) {
    if (!client) throw new Error('cloud_not_configured')
    const { data, error } = await client
      .from('ride_feedback')
      .select('activity_id, perceived_effort, feeling, fatigue, note, revision, updated_at')
      .eq('user_id', scope)
      .eq('activity_id', activityId)
      .maybeSingle()
    if (error) throw error
    feedback = data === null ? null : normalizeRow(data)
  } else {
    const stored = await localStorage.getItem(key(activityId, scope))
    feedback = stored === null ? null : rideFeedbackSchema.parse(JSON.parse(stored))
  }
  await assertScope(scope)
  if (feedback && feedback.activityId !== activityId) throw new Error('feedback_activity_mismatch')
  return { scope, activityId, feedback }
}

export function saveRideFeedback(
  snapshot: FeedbackSnapshot,
  draft: FeedbackDraft,
): Promise<FeedbackSnapshot> {
  const responses = feedbackResponsesSchema.parse(draft)
  return serialize(async () => {
    const { scope, activityId } = snapshot
    activityIdSchema.parse(activityId)
    const client = await assertScope(scope)
    const expected = snapshot.feedback?.revision ?? 0
    let feedback: RideFeedback
    if (scope !== null) {
      if (!client) throw new Error('cloud_not_configured')
      const { data, error } = await client.rpc('save_ride_feedback', {
        ride_id: activityId,
        effort: responses.perceivedEffort,
        ride_feeling: responses.feeling,
        ride_fatigue: responses.fatigue,
        ride_note: responses.note,
        expected_revision: expected,
      })
      if (error) throw error
      feedback = normalizeRow(data)
    } else {
      const current = await loadRideFeedback(activityId, scope)
      if ((current.feedback?.revision ?? 0) !== expected) throw new Error('feedback_conflict')
      feedback = rideFeedbackSchema.parse({
        activityId,
        responses,
        revision: expected + 1,
        updatedAt: new Date().toISOString(),
      })
      await localStorage.setItem(key(activityId, scope), JSON.stringify(feedback))
    }
    await assertScope(scope)
    if (feedback.activityId !== activityId) throw new Error('feedback_activity_mismatch')
    return { scope, activityId, feedback }
  })
}

export function loadFeedbackDraft(
  activityId: string,
  scope: FeedbackScope,
): Promise<StoredFeedbackDraft | null> {
  return serialize(async () => {
    await assertScope(scope)
    const value = await localStorage.getItem(key(activityId, scope, true))
    await assertScope(scope)
    return value === null ? null : storedFeedbackDraftSchema.parse(JSON.parse(value))
  })
}
export function saveFeedbackDraft(
  activityId: string,
  scope: FeedbackScope,
  value: StoredFeedbackDraft,
): Promise<void> {
  const payload = storedFeedbackDraftSchema.parse(value)
  return serialize(async () => {
    await assertScope(scope)
    await localStorage.setItem(key(activityId, scope, true), JSON.stringify(payload))
    await assertScope(scope)
  })
}
export function clearFeedbackDraft(activityId: string, scope: FeedbackScope): Promise<void> {
  return serialize(async () => {
    await assertScope(scope)
    await localStorage.removeItem(key(activityId, scope, true))
  })
}
