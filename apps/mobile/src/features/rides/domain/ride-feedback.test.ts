import { describe, expect, it } from 'vitest'

import {
  emptyFeedback,
  feedbackDraftSchema,
  feedbackResponsesSchema,
  feedbackGuidance,
  effortBand,
} from './ride-feedback'

const responses = { ...emptyFeedback }
describe('athlete-entered ride feedback', () => {
  it('allows an empty draft but never saves it as a real answer', () => {
    expect(feedbackDraftSchema.safeParse(responses).success).toBe(true)
    expect(feedbackResponsesSchema.safeParse(responses).success).toBe(false)
    expect(feedbackResponsesSchema.safeParse({ ...responses, note: '   ' }).success).toBe(false)
  })
  it.each([
    { perceivedEffort: 1 },
    { perceivedEffort: 10 },
    { feeling: 'okay' },
    { fatigue: 'low' },
    { note: 'Bonnes jambes' },
  ])('accepts a single optional answer: %j', (answer) => {
    expect(feedbackResponsesSchema.safeParse({ ...responses, ...answer }).success).toBe(true)
  })
  it.each([0, 11, 1.5, NaN, Infinity])('rejects invalid effort %s', (perceivedEffort) => {
    expect(feedbackResponsesSchema.safeParse({ ...responses, perceivedEffort }).success).toBe(false)
  })
  it('rejects oversized notes and unsupported labels', () => {
    expect(
      feedbackResponsesSchema.safeParse({ ...responses, note: 'a'.repeat(2001) }).success,
    ).toBe(false)
    expect(feedbackResponsesSchema.safeParse({ ...responses, fatigue: 'diagnosis' }).success).toBe(
      false,
    )
  })
  it('trims free text and preserves unknown answers as null', () => {
    expect(feedbackResponsesSchema.parse({ ...responses, note: '  Vent fort  ' })).toEqual({
      ...responses,
      note: 'Vent fort',
    })
  })
  it('prioritizes fatigue over positive feelings', () => {
    expect(feedbackGuidance({ ...responses, fatigue: 'high', feeling: 'excellent' })).toBe(
      'recover',
    )
    expect(feedbackGuidance({ ...responses, perceivedEffort: 8, fatigue: 'low' })).toBe('recover')
    expect(feedbackGuidance({ ...responses, perceivedEffort: 7, feeling: 'difficult' })).toBe(
      'easy',
    )
    expect(feedbackGuidance({ ...responses, fatigue: 'moderate', feeling: 'excellent' })).toBe(
      'easy',
    )
  })
  it('does not invent guidance from a note or missing sensations', () => {
    expect(feedbackGuidance(responses)).toBe('insufficient')
    expect(feedbackGuidance({ ...responses, note: 'FTP 300 W' })).toBe('insufficient')
    expect(feedbackGuidance({ ...responses, feeling: 'good' })).toBe('continue')
  })
  it.each([
    [1, 'easy'],
    [2, 'easy'],
    [3, 'moderate'],
    [4, 'moderate'],
    [5, 'hard'],
    [6, 'hard'],
    [7, 'veryHard'],
    [9, 'veryHard'],
    [10, 'maximum'],
  ] as const)('labels effort %i as %s', (value, band) => {
    expect(effortBand(value)).toBe(band)
  })
})
