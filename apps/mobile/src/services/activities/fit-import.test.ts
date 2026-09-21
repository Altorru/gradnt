import { Encoder, Profile } from '@garmin/fitsdk'
import { describe, expect, it, vi } from 'vitest'

import { parseFitActivity } from './fit-import'

vi.mock('expo-crypto', () => ({}))
vi.mock('expo-file-system', () => ({ File: class {} }))
vi.mock('./owned-activities.repository', () => ({ saveOwnedActivity: vi.fn() }))

function fit(sessions: Record<string, unknown>[]): ArrayBuffer {
  const encoder = new Encoder()
  for (const session of sessions) encoder.onMesg(Profile.MesgNum.SESSION, session)
  const bytes = encoder.close()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

const road = {
  sport: 2,
  subSport: 7,
  startTime: new Date('2026-09-20T08:00:00.000Z'),
  totalTimerTime: 3600,
  totalDistance: 30000,
  totalAscent: 250,
  avgPower: 180,
  normalizedPower: 195,
  avgHeartRate: 142,
}

describe('original FIT import', () => {
  it('uses measured FIT session fields and preserves their provenance', () => {
    expect(parseFitActivity(fit([road]))).toMatchObject({
      source: 'file',
      provenance: 'observed',
      sportType: 'road',
      startAt: '2026-09-20T08:00:00.000Z',
      durationSeconds: 3600,
      distanceMeters: 30000,
      elevationGainMeters: 250,
      averagePower: 180,
      normalizedPower: 195,
      averageHeartRate: 142,
    })
  })

  it('rejects a corrupt file before any data is saved', () => {
    const bytes = new Uint8Array(fit([road]))
    bytes[bytes.length - 1] ^= 0xff
    expect(() => parseFitActivity(bytes.buffer)).toThrow('fit_invalid_integrity')
  })

  it('rejects non-cycling and mixed-session files', () => {
    expect(() => parseFitActivity(fit([{ ...road, sport: 1 }]))).toThrow(
      'fit_requires_single_cycling_session',
    )
    expect(() => parseFitActivity(fit([road, road]))).toThrow('fit_requires_single_cycling_session')
  })

  it('does not treat an e-bike file as an unassisted road ride', () => {
    expect(() => parseFitActivity(fit([{ ...road, subSport: 28 }]))).toThrow(
      'fit_ebike_not_supported',
    )
  })
})
