import { describe, expect, it } from 'vitest'

import { estimateFtpFromZones, readPowerZones } from './ftp-from-zones'

function buckets(thresholdFloor: number) {
  return [
    { min: 0, max: thresholdFloor * 0.55 },
    { min: thresholdFloor * 0.55, max: thresholdFloor * 0.75 },
    { min: thresholdFloor * 0.75, max: thresholdFloor },
    { min: thresholdFloor, max: thresholdFloor * 1.05 },
    { min: thresholdFloor * 1.05, max: thresholdFloor * 1.2 },
    { min: thresholdFloor * 1.2, max: thresholdFloor * 1.5 },
    { min: thresholdFloor * 1.5, max: -1 },
  ]
}

/**
 * The shape the athlete endpoint actually returns.
 *
 * Confirmed against a live response: an object keyed by metric, whose values
 * hold their buckets under `zones`. Strava's reference page documents
 * `distribution_buckets` instead, which is the key the *activity* zones
 * endpoint uses — reading the docs rather than the payload sent every rider
 * down the "no power zones" path.
 */
function objectShape(thresholdFloor: number) {
  return {
    heart_rate: { custom_zones: true, zones: [{ min: 0, max: 110 }] },
    power: { custom_zones: true, zones: buckets(thresholdFloor) },
  }
}

/**
 * The other documented arrangement, kept because nothing guarantees a single
 * one: an array of entries carrying their own `type`, with the other key.
 */
function arrayShape(thresholdFloor: number) {
  return [
    { type: 'heartrate', resource_state: 3, distribution_buckets: [{ min: 0, max: 110 }] },
    { type: 'power', resource_state: 3, distribution_buckets: buckets(thresholdFloor) },
  ]
}

describe('readPowerZones', () => {
  it('reads the power buckets out of an object keyed by metric', () => {
    const reading = readPowerZones(objectShape(250))

    expect(reading.kind).toBe('buckets')
  })

  it('reads the power buckets out of an array of typed entries', () => {
    const reading = readPowerZones(arrayShape(250))

    expect(reading.kind).toBe('buckets')
  })

  it('reports no power zones when the recognised shape holds none', () => {
    // A threshold floor of zero means there is nothing to invert. That is a
    // real answer, not a parsing fault, and the two must not read alike.
    expect(readPowerZones(objectShape(0)).kind).toBe('noPowerZones')
    expect(
      readPowerZones([{ type: 'heartrate', distribution_buckets: [{ min: 0, max: 110 }] }]).kind,
    ).toBe('noPowerZones')
  })

  it('says what arrived when it recognises nothing', () => {
    const reading = readPowerZones({ watts: [1, 2, 3] })

    expect(reading).toEqual({
      kind: 'unrecognized',
      summary: 'objet avec les clés : watts',
    })
  })

  it('recognises a container whose buckets sit under either key', () => {
    // The live payload uses `zones`; the activity endpoint uses
    // `distribution_buckets`. Reading only one reported "no zones" for every
    // rider on the endpoint that uses the other.
    const withZones = { power: { zones: buckets(250) } }
    const withDistribution = { power: { distribution_buckets: buckets(250) } }

    expect(readPowerZones(withZones).kind).toBe('buckets')
    expect(readPowerZones(withDistribution).kind).toBe('buckets')
  })

  it.each([
    ['an array of unknown entries', [{ nope: true }], 'tableau de 1 (types : ?)'],
    ['a bare string', 'nonsense', 'type string'],
    ['null', null, 'type null'],
  ])('summarises %s', (_label, payload, expected) => {
    expect(readPowerZones(payload)).toEqual({ kind: 'unrecognized', summary: expected })
  })
})

describe('estimateFtpFromZones', () => {
  it('inverts the threshold floor back to an FTP, in either shape', () => {
    // 250 W is 91% of 275 W.
    expect(estimateFtpFromZones(objectShape(250))).toBe(275)
    expect(estimateFtpFromZones(arrayShape(250))).toBe(275)
  })

  it('finds the power entry whichever position it holds', () => {
    const heartRateFirst = arrayShape(182)

    expect(estimateFtpFromZones(heartRateFirst)).toBe(200)
  })

  it('rounds to a whole watt', () => {
    // 228 / 0.91 = 250.5…
    expect(estimateFtpFromZones(objectShape(228))).toBe(251)
  })

  it.each([
    ['nothing recognisable', { watts: [1] }],
    ['no power zones', objectShape(0)],
    ['too few buckets', { power: { distribution_buckets: [{ min: 0, max: 100 }] } }],
    ['a malformed bucket', { power: { distribution_buckets: [{}, {}, {}, {}] } }],
  ])('reports no FTP for %s', (_label, payload) => {
    expect(estimateFtpFromZones(payload)).toBeNull()
  })
})
