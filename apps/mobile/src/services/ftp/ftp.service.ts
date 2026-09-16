import { getValidAccessToken } from '../strava/api/strava-session'

import { estimateFtpFromZones, readPowerZones } from './ftp-from-zones'
import {
  loadCurrentFtp,
  loadFtpHistory,
  recordFtp,
  type FtpEntry,
  type FtpSource,
} from './ftp.persistence'
import { fetchStravaZones } from './strava-zones.api'

export type DeduceFtpResult =
  | { status: 'deduced'; value: number }
  /** The response was understood, and the rider has no power zones configured. */
  | { status: 'noPowerZones' }
  /** The response was not understood at all — a fault on our side, worth reporting. */
  | { status: 'unrecognized'; summary: string }
  | { status: 'disconnected' }
  | { status: 'expired' }
  | { status: 'rateLimited' }
  | { status: 'error'; error: unknown }

/**
 * Reads the rider's FTP out of Strava's power zones.
 *
 * **It does not record anything.** The figure is a deduction from the zone
 * boundaries, and a deduction should not become the rider's FTP without them
 * seeing it — the caller pre-fills the field and they confirm. Recording here
 * would also mean the provenance could never be corrected.
 *
 * `noPowerZones` and `unrecognized` are deliberately separate. The first is the
 * common case — most riders have never set an FTP in Strava — and has an
 * obvious remedy. The second means the response did not look like anything
 * expected, and reporting it as "you have no zones" is what made this look like
 * the rider's problem for three rounds of guessing.
 */
export async function deduceFtpFromStrava(): Promise<DeduceFtpResult> {
  const session = await getValidAccessToken()

  if (session.status !== 'ready') {
    return session
  }

  const response = await fetchStravaZones(session.accessToken)

  switch (response.status) {
    case 'ok': {
      const reading = readPowerZones(response.zones)

      if (reading.kind === 'unrecognized') {
        return { status: 'unrecognized', summary: reading.summary }
      }

      const value = estimateFtpFromZones(response.zones)

      return value === null ? { status: 'noPowerZones' } : { status: 'deduced', value }
    }

    case 'unauthorized':
      // The token passed the expiry check but Strava refused it — revoked, or a
      // clock that disagrees. Same recovery as an expired session.
      return { status: 'expired' }
    case 'rateLimited':
      return { status: 'rateLimited' }
    case 'error':
      return { status: 'error', error: response.error }
  }
}

/**
 * Records a figure, with where it came from.
 *
 * The source is the caller's to state: a value the rider left exactly as it was
 * deduced is `strava`, and one they typed or corrected is `declared`. Losing
 * that distinction would present an inference as a measurement.
 */
export async function saveFtp(
  value: number,
  source: FtpSource,
  now: Date = new Date(),
): Promise<void> {
  await recordFtp({ value, source, recordedAt: now.toISOString() })
}

export { loadCurrentFtp, loadFtpHistory }
export type { FtpEntry }
