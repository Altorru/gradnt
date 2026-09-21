import { describe, expect, it } from 'vitest'

import { shouldShowStravaConnect } from './strava-visibility'

const strava = [{ source: 'strava' as const }]
const manual = [{ source: 'manual' as const }]

describe('shouldShowStravaConnect', () => {
  it('hides the prompt when the store already says connected', () => {
    expect(
      shouldShowStravaConnect({
        hydrated: true,
        connected: true,
        activitiesReady: true,
        activities: [],
      }),
    ).toBe(false)
  })

  it('hides the prompt when loaded activities prove Strava is linked', () => {
    expect(
      shouldShowStravaConnect({
        hydrated: true,
        connected: false,
        activitiesReady: true,
        activities: strava,
      }),
    ).toBe(false)
  })

  it('waits for hydration and the activities query before showing the prompt', () => {
    expect(
      shouldShowStravaConnect({
        hydrated: false,
        connected: false,
        activitiesReady: false,
        activities: [],
      }),
    ).toBe(false)
    expect(
      shouldShowStravaConnect({
        hydrated: true,
        connected: false,
        activitiesReady: true,
        activities: manual,
      }),
    ).toBe(true)
  })
})
