import { getValidAccessToken } from '../strava/api/strava-session'

import { estimateFtpFromZones, readPowerZones } from './ftp-from-zones'
import { loadCurrentFtp, loadFtpHistory, recordFtp, type FtpEntry } from './ftp.persistence'
import { fetchStravaZones } from './strava-zones.api'

export type FtpImportResult =
  | { status: 'imported'; value: number }
  /** The response was understood, and the rider has no power zones configured. */
  | { status: 'noPowerZones' }
  /** The response was not understood at all — a fault on our side, worth reporting. */
  | { status: 'unrecognized'; summary: string }
  | { status: 'disconnected' }
  | { status: 'expired' }
  | { status: 'rateLimited' }
  | { status: 'error'; error: unknown }

/**
 * Reads the rider's FTP out of Strava's power zones and records it, dated.
 *
 * `noPowerZones` and `unrecognized` are deliberately separate. The first is the
 * common case — most riders have never set an FTP in Strava — and has an
 * obvious remedy. The second means the response did not look like anything
 * expected, and reporting it as "you have no zones" is what made this look like
 * the rider's problem for two rounds of guessing.
 */
export async function importFtpFromStrava(now: Date = new Date()): Promise<FtpImportResult> {
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

      if (value === null) {
        return { status: 'noPowerZones' }
      }

      await recordFtp({ value, source: 'strava', recordedAt: now.toISOString() })

      return { status: 'imported', value }
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

/** Records a figure the rider typed in, dated like any other. */
export async function recordDeclaredFtp(value: number, now: Date = new Date()): Promise<void> {
  await recordFtp({ value, source: 'declared', recordedAt: now.toISOString() })
}

export { loadCurrentFtp, loadFtpHistory }
export type { FtpEntry }
