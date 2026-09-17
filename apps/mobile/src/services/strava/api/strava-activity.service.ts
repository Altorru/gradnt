import type { Activity } from '@/lib/domain'

import { fetchStravaActivities } from './strava-activity.api'
import { normalizeStravaActivity } from './strava-activity.normalize'
import { getStravaTokenEpoch } from '../oauth/strava-token.persistence'
import { getValidAccessToken } from './strava-session'

/**
 * How much history is pulled.
 *
 * Twelve weeks is enough to estimate a starting point and recent load. Deeper
 * history multiplies round trips against a quota shared by every user of the
 * application, so it is not pulled until something needs it.
 */
export const HISTORY_WEEKS = 12

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Start of the history window, for callers that need to describe the period. */
export function historyWindowStart(now: Date = new Date()): Date {
  return new Date(now.getTime() - HISTORY_WEEKS * WEEK_MS)
}

/**
 * Every way fetching activities can end.
 *
 * The four failures stay distinct because the UI must not treat them alike:
 * offering to reconnect makes no sense to someone who is already connected but
 * hit a shared quota, and a transient network failure must be retryable rather
 * than a reason to re-authorize.
 */
export type StravaActivitiesResult =
  | { status: 'ready'; activities: Activity[] }
  | { status: 'disconnected' }
  | { status: 'expired' }
  | { status: 'rateLimited' }
  | { status: 'error'; error: unknown }

/**
 * Fetches in flight, keyed by credential generation and history boundary.
 *
 * Three separate queries need activities — the list itself, the metrics and the
 * goal value — and TanStack Query treats them as unrelated, so a screen load
 * would otherwise spend three requests of a quota shared by every user of the
 * application. Concurrent callers for the same window share one round trip.
 *
 * Only concurrent calls are shared; nothing is cached here, so a real re-sync
 * still reaches Strava.
 */
const inFlight = new Map<string, Promise<StravaActivitiesResult>>()

export async function fetchRecentActivities(
  options: { weeks?: number; now?: Date } = {},
): Promise<StravaActivitiesResult> {
  const weeks = options.weeks ?? HISTORY_WEEKS
  const session = await getValidAccessToken()
  if (session.status !== 'ready') return session
  if (session.sessionEpoch !== getStravaTokenEpoch()) return { status: 'disconnected' }
  const sinceEpochSeconds = Math.floor(
    ((options.now ?? new Date()).getTime() - weeks * WEEK_MS) / 1000,
  )
  const key = `${session.sessionEpoch}:${weeks}:${sinceEpochSeconds}`
  const existing = inFlight.get(key)
  if (existing) return existing
  const request = performFetch(
    session.accessToken,
    session.sessionEpoch,
    sinceEpochSeconds,
  ).finally(() => inFlight.delete(key))
  inFlight.set(key, request)
  return request
}

async function performFetch(
  accessToken: string,
  epoch: number,
  sinceEpochSeconds: number,
): Promise<StravaActivitiesResult> {
  const response = await fetchStravaActivities(accessToken, sinceEpochSeconds)
  if (epoch !== getStravaTokenEpoch()) return { status: 'disconnected' }

  switch (response.status) {
    case 'ok':
      return { status: 'ready', activities: normalizeActivities(response.activities) }
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
 * Normalizes a page of raw activities, newest first.
 *
 * Invalid entries are dropped individually rather than failing the batch: one
 * unparseable ride must not cost the rider their whole history.
 */
function normalizeActivities(raw: unknown[]): Activity[] {
  return raw
    .map(normalizeStravaActivity)
    .filter((activity): activity is Activity => activity !== null)
    .sort((left, right) => Date.parse(right.startAt) - Date.parse(left.startAt))
}
