import { describe, expect, it } from 'vitest'

import { getGoalCurrentValue, getWeeklyVolumeFloorHours } from './selectors'
import { goalSchema, type Activity, type Goal } from './schemas'

const NOW = Date.parse('2026-09-16T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'strava-1',
    source: 'strava',
    externalId: '1',
    sportType: 'road',
    startAt: new Date(NOW - 2 * DAY).toISOString(),
    durationSeconds: 3600,
    distanceMeters: 30000,
    elevationGainMeters: 300,
    averageHeartRate: null,
    maxHeartRate: null,
    averagePower: null,
    normalizedPower: null,
    weightedPower: null,
    calories: null,
    provenance: 'observed',
    ...overrides,
  }
}

function goal(overrides: Partial<Goal> & Pick<Goal, 'type'>): Goal {
  return goalSchema.parse({
    id: 'goal-local',
    targetValue: 100,
    targetUnit: 'km',
    measure: 'cumulative',
    targetDate: null,
    status: 'active',
    createdAt: new Date(NOW).toISOString(),
    ...overrides,
  })
}

describe('getGoalCurrentValue', () => {
  it('accumulates distance by default', () => {
    const activities = [
      activity({ distanceMeters: 30000 }),
      activity({ id: 'strava-2', distanceMeters: 20000 }),
    ]

    expect(getGoalCurrentValue(goal({ type: 'distance' }), activities, null)).toBe(50)
  })

  it('reads the longest single ride when the rider chose that measure', () => {
    const activities = [
      activity({ distanceMeters: 30000 }),
      activity({ id: 'strava-2', distanceMeters: 82000 }),
      activity({ id: 'strava-3', distanceMeters: 20000 }),
    ]

    expect(getGoalCurrentValue(goal({ type: 'distance', measure: 'best' }), activities, null)).toBe(
      82,
    )
  })

  it('accumulates climbing, and reads the biggest single climb when asked', () => {
    const activities = [
      activity({ elevationGainMeters: 300 }),
      activity({ id: 'strava-2', elevationGainMeters: 1200 }),
    ]

    expect(getGoalCurrentValue(goal({ type: 'climbing', targetUnit: 'm' }), activities, null)).toBe(
      1500,
    )

    expect(
      getGoalCurrentValue(
        goal({ type: 'climbing', targetUnit: 'm', measure: 'best' }),
        activities,
        null,
      ),
    ).toBe(1200)
  })

  it('takes the FTP from the recorded value, never from the rides', () => {
    const activities = [activity({ weightedPower: 200 })]

    // A ride's power is not an FTP, and deriving one from a single ride is the
    // kind of plausible-but-wrong figure this app has been removing.
    expect(getGoalCurrentValue(goal({ type: 'ftp', targetUnit: 'w' }), activities, 265)).toBe(265)
  })

  it('reports nothing for FTP when none has been recorded', () => {
    expect(
      getGoalCurrentValue(goal({ type: 'ftp', targetUnit: 'w' }), [activity()], null),
    ).toBeNull()
  })

  it('measures fitness in average weekly hours, ignoring the week in progress', () => {
    const activities = [
      // Two complete weeks at 4h and 2h, plus 5h in the current partial week.
      activity({ startAt: new Date(NOW - 15 * DAY).toISOString(), durationSeconds: 4 * 3600 }),
      activity({
        id: 'strava-2',
        startAt: new Date(NOW - 8 * DAY).toISOString(),
        durationSeconds: 2 * 3600,
      }),
      activity({
        id: 'strava-3',
        startAt: new Date(NOW - 12 * 3600 * 1000).toISOString(),
        durationSeconds: 5 * 3600,
      }),
    ]

    // (4 + 2) / 2, not (4 + 2 + 5) / 3 — the current week is not over.
    expect(getGoalCurrentValue(goal({ type: 'fitness', targetUnit: 'h' }), activities, null)).toBe(
      3,
    )
  })

  it('does not count weeks before the rider started riding', () => {
    // 4h and 6h in the two weeks since they started. The weeks before hold no
    // rides because they were not riding yet, so averaging from the window's
    // start would report 2h and put a newcomer permanently below target.
    const activities = [
      activity({ startAt: new Date(NOW - 15 * DAY).toISOString(), durationSeconds: 4 * 3600 }),
      activity({
        id: 'strava-2',
        startAt: new Date(NOW - 8 * DAY).toISOString(),
        durationSeconds: 6 * 3600,
      }),
      activity({
        id: 'strava-3',
        startAt: new Date(NOW - 12 * 3600 * 1000).toISOString(),
        durationSeconds: 3 * 3600,
      }),
    ]

    expect(getGoalCurrentValue(goal({ type: 'fitness', targetUnit: 'h' }), activities, null)).toBe(
      5,
    )
  })

  it('falls back to the week in progress when no week is complete yet', () => {
    // Otherwise a rider whose only ride is this week would be shown as having
    // done nothing at all.
    const activities = [
      activity({ startAt: new Date(NOW - 2 * DAY).toISOString(), durationSeconds: 6 * 3600 }),
    ]

    expect(getGoalCurrentValue(goal({ type: 'fitness', targetUnit: 'h' }), activities, null)).toBe(
      6,
    )
  })

  it('has no value for an event, which is a deadline rather than a total', () => {
    const activities = [activity()]

    expect(
      getGoalCurrentValue(
        goal({ type: 'event', targetUnit: 'none', targetDate: '2026-10-01T00:00:00.000Z' }),
        activities,
        null,
      ),
    ).toBeNull()
  })

  it('reports zero, not nothing, when a measurable goal has no rides yet', () => {
    // Zero per cent is a real answer for a rider who has not ridden; "à
    // préciser" is not, and the screen must not claim the goal is unmeasurable.
    expect(getGoalCurrentValue(goal({ type: 'distance' }), [], null)).toBe(0)
    expect(getGoalCurrentValue(goal({ type: 'distance', measure: 'best' }), [], null)).toBe(0)
  })
})

describe('getWeeklyVolumeFloorHours', () => {
  it('targets the floor of the declared band', () => {
    expect(getWeeklyVolumeFloorHours('3to6')).toBe(3)
    expect(getWeeklyVolumeFloorHours('6to10')).toBe(6)
    expect(getWeeklyVolumeFloorHours('gt10')).toBe(10)
  })

  it('uses the ceiling for the lowest band, so the target is not zero', () => {
    expect(getWeeklyVolumeFloorHours('lt3')).toBe(3)
  })
})
