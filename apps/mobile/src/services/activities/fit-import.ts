import { Decoder, Stream } from '@garmin/fitsdk'
import * as Crypto from 'expo-crypto'
import { File } from 'expo-file-system'

import { provenanceForSource, type Activity } from '@/lib/domain'

import { saveOwnedActivity, type OwnedActivityInput } from './owned-activities.repository'

const MAX_FIT_BYTES = 25 * 1024 * 1024

function positive(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/** FIT session fields are device measurements, not Strava API data. */
export function parseFitActivity(buffer: ArrayBuffer): OwnedActivityInput {
  if (buffer.byteLength < 14 || buffer.byteLength > MAX_FIT_BYTES)
    throw new Error('fit_invalid_size')
  const decoder = new Decoder(Stream.fromArrayBuffer(buffer))
  if (!decoder.checkIntegrity()) throw new Error('fit_invalid_integrity')
  const { messages, errors } = decoder.read({ convertTypesToStrings: false })
  if (errors.length > 0) throw new Error('fit_decode_failed')
  const sessions = (messages.sessionMesgs ?? []).filter((session) => session.sport === 2)
  if (sessions.length !== 1 || (messages.sessionMesgs?.length ?? 0) !== 1)
    throw new Error('fit_requires_single_cycling_session')
  const session = sessions[0]
  const start = session.startTime
  const duration = positive(session.totalTimerTime ?? session.totalElapsedTime)
  if (!(start instanceof Date) || !Number.isFinite(start.getTime()) || duration === null)
    throw new Error('fit_missing_required_data')
  const sportType: Activity['sportType'] =
    session.subSport === 6 || session.subSport === 5
      ? 'indoor_cycling'
      : session.subSport === 8 || session.subSport === 9
        ? 'mtb'
        : session.subSport === 46 || session.subSport === 49
          ? 'gravel'
          : 'road'
  if (session.subSport === 28 || session.subSport === 47) throw new Error('fit_ebike_not_supported')

  return {
    source: 'file',
    sportType,
    startAt: start.toISOString(),
    durationSeconds: Math.round(duration),
    distanceMeters: Math.max(0, session.totalDistance ?? 0),
    elevationGainMeters: Math.max(0, session.totalAscent ?? 0),
    averageHeartRate: positive(session.avgHeartRate),
    maxHeartRate: positive(session.maxHeartRate),
    averagePower: positive(session.avgPower),
    normalizedPower: positive(session.normalizedPower),
    weightedPower: null,
    calories: positive(session.totalCalories),
    provenance: 'observed',
    provenanceDetails: provenanceForSource('file'),
  }
}

export async function importFitFile(uri: string, name: string): Promise<Activity> {
  if (!name.toLowerCase().endsWith('.fit')) throw new Error('fit_file_required')
  const file = new File(uri)
  if (!file.exists || file.size > MAX_FIT_BYTES) throw new Error('fit_invalid_size')
  const buffer = await file.arrayBuffer()
  const activity = parseFitActivity(buffer)
  const digest = new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, buffer))
  const sha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return saveOwnedActivity(activity, { sha256, name: name.slice(0, 255) })
}
