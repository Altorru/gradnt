import { z } from 'zod'

import type { MessageKey } from '@/i18n'

export const stravaConnectionStatusSchema = z.enum(['not_connected', 'connected', 'deferred'])

export const stravaConnectionSchema = z.object({
  status: stravaConnectionStatusSchema,
  athleteName: z.string().nullable(),
})

export type StravaConnection = z.infer<typeof stravaConnectionSchema>
export type StravaConnectionStatus = z.infer<typeof stravaConnectionStatusSchema>

export const defaultStravaConnection: StravaConnection = {
  status: 'not_connected',
  athleteName: null,
}

export const deferredStravaConnection: StravaConnection = {
  status: 'deferred',
  athleteName: null,
}

/**
 * Why a connection attempt failed, as a code rather than a sentence.
 *
 * A service has no business holding copy: its failures travel to four different
 * screens, and a sentence written here would be French in an English app no
 * matter where it was rendered. The key is derived once, here, so the four
 * screens cannot drift from each other.
 */
export const stravaErrorCodeSchema = z.enum([
  'not_configured',
  'cancelled',
  'unknown',
  'ignored',
  'sessionExpired',
  'missingCode',
  'insufficientScopes',
  'oauthError',
  'interrupted',
])

export type StravaErrorCode = z.infer<typeof stravaErrorCodeSchema>

export const STRAVA_ERROR_KEYS: Record<StravaErrorCode, MessageKey> = {
  not_configured: 'onboarding.strava.errors.notConfigured',
  cancelled: 'onboarding.strava.errors.cancelled',
  unknown: 'onboarding.strava.errors.unknown',
  ignored: 'onboarding.strava.errors.ignored',
  sessionExpired: 'onboarding.strava.errors.sessionExpired',
  missingCode: 'onboarding.strava.errors.missingCode',
  insufficientScopes: 'onboarding.strava.errors.insufficientScopes',
  oauthError: 'onboarding.strava.errors.oauthError',
  interrupted: 'onboarding.strava.errors.interrupted',
}
