import { z } from 'zod'

/**
 * Reading the athlete's power zones, without assuming a single response shape.
 *
 * Twice this expected the wrong one — first an object keyed by `power`, then an
 * array of entries carrying a `type` — and both times the mistake survived
 * testing, because the fixtures were written from the same assumption as the
 * code. So this accepts either, and when it recognises neither it says what
 * arrived instead of reporting the same "no zones" as a rider who has none.
 *
 * Strava documents the endpoint loosely enough to support both readings, and
 * only a real response settles it.
 */
const zoneBucketSchema = z.object({
  min: z.number(),
  max: z.number(),
})

const powerBucketsSchema = z.array(zoneBucketSchema).min(4)

/**
 * Strava's own zone model: seven power zones, the fourth being lactate
 * threshold and starting at 91% of FTP.
 */
const THRESHOLD_ZONE_INDEX = 3
const THRESHOLD_ZONE_FLOOR = 0.91

export type PowerZonesReading =
  | { kind: 'buckets'; buckets: z.infer<typeof powerBucketsSchema> }
  /** The response parsed, and genuinely holds no power zones. */
  | { kind: 'noPowerZones' }
  /** The response did not look like anything expected — a fault on our side. */
  | { kind: 'unrecognized'; summary: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Locates the power buckets, and says whether the container was understood.
 *
 * The two questions are separate on purpose. A rider with heart-rate zones and
 * no power meter has a response that is perfectly well understood and simply
 * holds no power — reporting that as an unrecognised response would blame them
 * for our parsing.
 */
function locatePowerBuckets(payload: unknown): { recognized: boolean; buckets: unknown } {
  if (Array.isArray(payload)) {
    const entries = payload.filter((entry) => isRecord(entry) && typeof entry.type === 'string')

    if (entries.length === 0) {
      return { recognized: false, buckets: null }
    }

    const power = entries.find((entry) => entry.type === 'power')

    return { recognized: true, buckets: isRecord(power) ? power.distribution_buckets : null }
  }

  if (isRecord(payload)) {
    // An object is a zones container when its values look like zones, rather
    // than because it happens to carry a key we guessed at.
    const zoneValues = Object.values(payload).filter(
      (value) => isRecord(value) && 'distribution_buckets' in value,
    )

    if (zoneValues.length === 0) {
      return { recognized: false, buckets: null }
    }

    const power = payload.power

    return { recognized: true, buckets: isRecord(power) ? power.distribution_buckets : null }
  }

  return { recognized: false, buckets: null }
}

/** Describes a payload we could not read, so the next report is evidence. */
function summarize(payload: unknown): string {
  if (Array.isArray(payload)) {
    const types = payload
      .filter(isRecord)
      .map((entry) => String(entry.type ?? '?'))
      .join(', ')

    return `tableau de ${payload.length} (types : ${types || 'aucun'})`
  }

  if (isRecord(payload)) {
    return `objet avec les clés : ${Object.keys(payload).join(', ') || 'aucune'}`
  }

  return `type ${payload === null ? 'null' : typeof payload}`
}

export function readPowerZones(payload: unknown): PowerZonesReading {
  const located = locatePowerBuckets(payload)

  if (!located.recognized) {
    return { kind: 'unrecognized', summary: summarize(payload) }
  }

  const buckets = powerBucketsSchema.safeParse(located.buckets)

  // Understood, but holding nothing usable: the athlete has no power zones
  // configured. A real answer, not a failure.
  if (!buckets.success) {
    return { kind: 'noPowerZones' }
  }

  const thresholdFloor = buckets.data[THRESHOLD_ZONE_INDEX]?.min

  if (thresholdFloor === undefined || thresholdFloor <= 0) {
    return { kind: 'noPowerZones' }
  }

  return { kind: 'buckets', buckets: buckets.data }
}

/**
 * The athlete's FTP, deduced from the floor of their threshold zone.
 *
 * **A deduction, not a measurement.** Strava exposes no FTP, but computes the
 * zones *from* it, so the floor gives it back. The caller records the result
 * with `source: 'strava'` so nothing presents an inference as a figure the
 * rider entered.
 */
export function estimateFtpFromZones(payload: unknown): number | null {
  const reading = readPowerZones(payload)

  if (reading.kind !== 'buckets') {
    return null
  }

  const thresholdFloor = reading.buckets[THRESHOLD_ZONE_INDEX]!.min

  return Math.round(thresholdFloor / THRESHOLD_ZONE_FLOOR)
}
