import { describe, expect, it } from 'vitest'

import type { Translate } from '@/i18n'
// The leaf module, not `@/i18n`: the barrel pulls in the preferences store and
// with it expo-secure-store, which this test has no business loading.
import { translate } from '@/i18n/translate'
import type { WorkoutType } from '@/lib/domain/schemas'

import {
  formatWorkoutDuration,
  workoutIntensity,
  workoutReason,
  workoutStructure,
  workoutTitle,
} from './workout-labels'

const t: Translate = (key, params) => translate('fr', key, params)

const types: WorkoutType[] = [
  'endurance',
  'tempo',
  'sweet_spot',
  'threshold',
  'vo2_max',
  'recovery',
]

describe('the workout vocabulary', () => {
  it('has words for every type the model accepts', () => {
    for (const type of types) {
      for (const say of [workoutTitle, workoutIntensity, workoutStructure]) {
        const label = say(t, type)

        expect(label).not.toBe('')
        // A missing key comes back as the key itself, which is how a catalogue
        // gap would reach a screen without failing anything else.
        expect(label).not.toContain('workouts.')
      }
    }
  })

  it('tells the types apart, so a wrong key is visible rather than plausible', () => {
    expect(new Set(types.map((type) => workoutTitle(t, type))).size).toBe(types.length)
    expect(new Set(types.map((type) => workoutStructure(t, type))).size).toBe(types.length)
  })
})

describe('workoutReason', () => {
  it('names the goal being prioritised', () => {
    expect(workoutReason(t, 'climbing')).toContain(
      translate('fr', 'onboarding.goalLabels.climbing'),
    )
  })

  it('says the general thing for fitness, which names nothing to prioritise', () => {
    expect(workoutReason(t, 'fitness')).toBe(translate('fr', 'workouts.reasons.fitness'))
  })

  it('falls back to the general thing with no goal at all', () => {
    expect(workoutReason(t, null)).toBe(translate('fr', 'workouts.reasons.fitness'))
  })
})

describe('formatWorkoutDuration', () => {
  it('says minutes alone under the hour', () => {
    expect(formatWorkoutDuration(45)).toBe('45 min')
  })

  it('drops the minutes on a whole hour', () => {
    expect(formatWorkoutDuration(120)).toBe('2 h')
  })

  it('says both when there are both', () => {
    expect(formatWorkoutDuration(75)).toBe('1 h 15')
  })
})
