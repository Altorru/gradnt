import { z } from 'zod'

/**
 * Reading an FTP out of Strava's power zones.
 *
 * **This is a deduction, not a measurement.** Strava does not expose the
 * athlete's FTP on any endpoint — but it computes the power zones *from* that
 * FTP, so the floor of the threshold zone reveals it. The result is therefore an
 * inference, and the caller records it with `source: 'strava'` so the UI never
 * presents it as a figure the rider entered.
 *
 * The assumption is Strava's own zone model: seven power zones, the fourth
 * being lactate threshold and starting at 91% of FTP. It is checked rather than
 * trusted — anything that does not look like that shape yields null, because a
 * wrong FTP would quietly distort every figure derived from it.
 */
const zoneBucketSchema = z.object({
  min: z.number(),
  max: z.number(),
})

const powerZonesSchema = z.object({
  distribution_buckets: z.array(zoneBucketSchema).min(4),
})

const THRESHOLD_ZONE_INDEX = 3
const THRESHOLD_ZONE_FLOOR = 0.91

export function estimateFtpFromZones(payload: unknown): number | null {
  const power = (payload as { power?: unknown } | null)?.power
  const parsed = powerZonesSchema.safeParse(power)

  if (!parsed.success) {
    return null
  }

  const thresholdFloor = parsed.data.distribution_buckets[THRESHOLD_ZONE_INDEX]?.min

  // A zone starting at zero is not a threshold zone — the athlete has no power
  // zones configured, and dividing by 0.91 would invent a number from nothing.
  if (thresholdFloor === undefined || thresholdFloor <= 0) {
    return null
  }

  return Math.round(thresholdFloor / THRESHOLD_ZONE_FLOOR)
}
