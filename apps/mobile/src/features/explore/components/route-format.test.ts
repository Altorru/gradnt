import { describe, expect, it } from 'vitest'

import {
  formatDistance,
  formatDuration,
  formatElevation,
  getTrainingFitKey,
  recommendationLabels,
} from './route-format'

describe('formatDistance', () => {
  it('reads in kilometres with a French decimal comma', () => {
    expect(formatDistance(62_400)).toBe('62,4 km')
  })

  it('keeps one decimal, so a short ride does not look like zero', () => {
    expect(formatDistance(800)).toBe('0,8 km')
  })
})

describe('formatElevation', () => {
  it('carries the sign, because the figure is a climb', () => {
    expect(formatElevation(480)).toBe('+480 m')
  })

  it('says zero rather than nothing when the route is flat', () => {
    expect(formatElevation(0)).toBe('+0 m')
  })
})

describe('formatDuration', () => {
  it('drops the hours under the hour', () => {
    expect(formatDuration(45 * 60)).toBe('45 min')
  })

  it('drops the minutes on a whole hour', () => {
    expect(formatDuration(2 * 3600)).toBe('2 h')
  })

  it('reads both when both are present', () => {
    expect(formatDuration(75 * 60)).toBe('1 h 15 min')
  })

  it('rounds to the nearest minute rather than truncating', () => {
    expect(formatDuration(59 * 60 + 40)).toBe('1 h')
  })
})

describe('getTrainingFitKey', () => {
  it('has three bands, with the boundaries where they are stated', () => {
    expect(getTrainingFitKey(85)).toBe('explore.fit.great')
    expect(getTrainingFitKey(84)).toBe('explore.fit.good')
    expect(getTrainingFitKey(70)).toBe('explore.fit.good')
    expect(getTrainingFitKey(69)).toBe('explore.fit.adjust')
  })
})

describe('recommendationLabels', () => {
  it('names every label the domain defines', () => {
    // Exhaustive by type: a new label in the domain would fail to compile here
    // rather than rendering as an empty badge. The translator is a stub that
    // echoes the key, so this asserts the shape and not the wording.
    const labels = recommendationLabels(((key: string) => key) as never)

    expect(Object.keys(labels).sort()).toEqual([
      'alternative',
      'quieter',
      'recommended',
      'training',
    ])
  })
})
