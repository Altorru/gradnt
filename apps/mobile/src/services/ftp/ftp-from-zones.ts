import { z } from 'zod'

/**
 * Reading the athlete's power zones, without assuming a single response shape.
 *
 * Three attempts at this were wrong, and each was tested against a fixture
 * written from the same assumption as the code, so no test could have caught
 * it. The reader now accepts every shape actually observed — an object keyed by
 * metric or an array of typed entries, with the buckets under either documented
 * key — and when it recognises none of them it reports what arrived rather than
 * reporting "no zones", which is what made a parsing fault look like a fact
 * about the rider's Strava account.
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
 * The key holding a metric's buckets.
 *
 * Strava uses `zones` on the athlete endpoint and `distribution_buckets` on the
 * activity one, and its reference page documents the latter under a heading that
 * reads like the former. Both are accepted rather than betting on one: the
 * first attempt here read `distribution_buckets` and reported "no zones" for
 * every rider, because the athlete payload does not have it.
 */
const BUCKET_KEYS = ['zones', 'distribution_buckets'] as const

function readBuckets(zone: unknown): unknown {
  if (!isRecord(zone)) {
    return null
  }

  for (const key of BUCKET_KEYS) {
    const value = zone[key]

    if (Array.isArray(value)) {
      return value
    }
  }

  return null
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

    return { recognized: true, buckets: readBuckets(power) }
  }

  if (isRecord(payload)) {
    // An object is a zones container when its values carry buckets, rather than
    // because it happens to hold a key we guessed at.
    const recognized = Object.values(payload).some((value) => readBuckets(value) !== null)

    if (!recognized) {
      return { recognized: false, buckets: null }
    }

    return { recognized: true, buckets: readBuckets(payload.power) }
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
