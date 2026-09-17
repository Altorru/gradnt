import { z } from 'zod'

export const activityIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/)
export const feelings = ['difficult', 'okay', 'good', 'excellent'] as const
export const fatigueLevels = ['low', 'moderate', 'high'] as const

export const feedbackDraftSchema = z.object({
  perceivedEffort: z.number().int().min(1).max(10).nullable(),
  feeling: z.enum(feelings).nullable(),
  fatigue: z.enum(fatigueLevels).nullable(),
  note: z.string().trim().max(2000),
})
export const feedbackResponsesSchema = feedbackDraftSchema.refine(
  (value) =>
    value.perceivedEffort !== null ||
    value.feeling !== null ||
    value.fatigue !== null ||
    value.note.length > 0,
  { message: 'feedback_empty' },
)
export const rideFeedbackSchema = z.object({
  activityId: activityIdSchema,
  responses: feedbackResponsesSchema,
  revision: z.number().int().positive(),
  updatedAt: z.string().datetime(),
})
export type FeedbackDraft = z.infer<typeof feedbackDraftSchema>
export type RideFeedback = z.infer<typeof rideFeedbackSchema>
export const emptyFeedback: FeedbackDraft = {
  perceivedEffort: null,
  feeling: null,
  fatigue: null,
  note: '',
}

/** Advice uses declared sensations only, never infers power, fitness or a diagnosis. */
export function feedbackGuidance(
  responses: FeedbackDraft,
): 'recover' | 'easy' | 'continue' | 'insufficient' {
  if (
    responses.fatigue === 'high' ||
    (responses.perceivedEffort !== null && responses.perceivedEffort >= 8)
  )
    return 'recover'
  if (responses.feeling === 'difficult' || responses.fatigue === 'moderate') return 'easy'
  if (
    responses.fatigue === 'low' ||
    responses.feeling === 'good' ||
    responses.feeling === 'excellent'
  )
    return 'continue'
  return 'insufficient'
}

export function effortBand(value: number): 'easy' | 'moderate' | 'hard' | 'veryHard' | 'maximum' {
  if (value <= 2) return 'easy'
  if (value <= 4) return 'moderate'
  if (value <= 6) return 'hard'
  if (value <= 9) return 'veryHard'
  return 'maximum'
}
