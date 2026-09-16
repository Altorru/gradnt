import { getValidAccessToken } from '../strava/api/strava-session'

import { estimateFtpFromZones } from './ftp-from-zones'
import { loadCurrentFtp, loadFtpHistory, recordFtp, type FtpEntry } from './ftp.persistence'
import { fetchStravaZones } from './strava-zones.api'

export type FtpImportResult =
  | { status: 'imported'; value: number }
  | { status: 'unavailable' }
  | { status: 'disconnected' }
  | { status: 'expired' }
  | { status: 'rateLimited' }
  | { status: 'error'; error: unknown }

/**
 * Reads the rider's FTP out of Strava's power zones and records it, dated.
 *
 * `unavailable` is its own outcome because it is the common case rather than a
 * failure: most riders have never set an FTP in Strava, and telling them the
 * import "failed" would be both wrong and discouraging. They can enter one.
 */
export async function importFtpFromStrava(now: Date = new Date()): Promise<FtpImportResult> {
  const session = await getValidAccessToken()

  if (session.status !== 'ready') {
    return session
  }

  const response = await fetchStravaZones(session.accessToken)

  switch (response.status) {
    case 'ok': {
      const value = estimateFtpFromZones(response.zones)

      if (value === null) {
        return { status: 'unavailable' }
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
