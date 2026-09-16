import { describe, expect, it } from 'vitest'

import { estimateFtpFromZones } from './ftp-from-zones'

/**
 * The shape the endpoint actually returns: an array with one entry per metric.
 *
 * The first version of this file built an object keyed by `power`, which is not
 * what Strava sends — so the fixtures agreed with the mistake and the tests
 * passed while every real rider was told they had no power zones.
 */
function zonesWithThresholdFloor(floor: number) {
  return [
    {
      type: 'heartrate',
      resource_state: 3,
      distribution_buckets: [{ min: 0, max: 110 }],
    },
    {
      type: 'power',
      resource_state: 3,
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
  ]
}

describe('estimateFtpFromZones', () => {
  it('inverts the threshold zone floor back to an FTP', () => {
    // 250 W is 91% of 275 W.
    expect(estimateFtpFromZones(zonesWithThresholdFloor(250))).toBe(275)
  })

  it('finds the power entry among the other metrics', () => {
    // The heart-rate entry comes first, so an implementation reading index 0
    // would read heart-rate zones and divide them by 0.91.
    expect(estimateFtpFromZones(zonesWithThresholdFloor(182))).toBe(200)
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

  it('reports nothing when the response holds no power entry', () => {
    const heartRateOnly = [{ type: 'heartrate', distribution_buckets: [{ min: 0, max: 110 }] }]

    expect(estimateFtpFromZones(heartRateOnly)).toBeNull()
  })

  it.each([
    ['the old object shape', { power: { distribution_buckets: [{ min: 0, max: 100 }] } }],
    ['too few zones', [{ type: 'power', distribution_buckets: [{ min: 0, max: 100 }] }]],
    ['a malformed bucket', [{ type: 'power', distribution_buckets: [{}, {}, {}, {}] }]],
    ['not an array', 'nonsense'],
    ['null', null],
  ])('reports nothing for %s', (_label, payload) => {
    expect(estimateFtpFromZones(payload)).toBeNull()
  })
})
