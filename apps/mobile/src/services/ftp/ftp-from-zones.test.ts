import { describe, expect, it } from 'vitest'

import { estimateFtpFromZones } from './ftp-from-zones'

/** Seven power zones in watts, as Strava returns them. */
function zonesWithThresholdFloor(floor: number) {
  return {
    power: {
      distribution_buckets: [
        { min: 0, max: floor * 0.55 },
        { min: floor * 0.55, max: floor * 0.75 },
        { min: floor * 0.75, max: floor },
        { min: floor, max: floor * 1.05 },
        { min: floor * 1.05, max: floor * 1.2 },
        { min: floor * 1.2, max: floor * 1.5 },
        { min: floor * 1.5, max: -1 },
      ],
    },
  }
}

describe('estimateFtpFromZones', () => {
  it('inverts the threshold zone floor back to an FTP', () => {
    // 250 W is 91% of 275 W.
    expect(estimateFtpFromZones(zonesWithThresholdFloor(250))).toBe(275)
  })

  it('rounds to a whole watt', () => {
    // 228 / 0.91 = 250.5…
    expect(estimateFtpFromZones(zonesWithThresholdFloor(228))).toBe(251)
  })

  it('reports nothing when the athlete has no power zones configured', () => {
    // Not a guess: a threshold floor of zero means there is no FTP to invert,
    // and inventing one would distort every figure derived from it.
    expect(estimateFtpFromZones(zonesWithThresholdFloor(0))).toBeNull()
  })

  it.each([
    ['no power key at all', { heart_rate: { distribution_buckets: [] } }],
    ['too few zones', { power: { distribution_buckets: [{ min: 0, max: 100 }] } }],
    ['a malformed bucket', { power: { distribution_buckets: [{}, {}, {}, {}] } }],
    ['not an object', 'nonsense'],
    ['null', null],
  ])('reports nothing for %s', (_label, payload) => {
    expect(estimateFtpFromZones(payload)).toBeNull()
  })
})
