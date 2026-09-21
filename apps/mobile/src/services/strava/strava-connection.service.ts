import { z } from 'zod'

import {
  defaultStravaConnection,
  type StravaConnection,
} from '@/features/onboarding/domain/strava.schema'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import { getSupabaseClient } from '@/services/supabase/client'

import {
  clearStravaTokens,
  loadStravaTokens,
  saveStravaTokens,
  type StravaTokens,
} from './oauth/strava-token.persistence'

const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().datetime(),
})
const connectionSchema = z.discriminatedUnion('connected', [
  z.object({ connected: z.literal(false), revoked: z.boolean().optional() }),
  z.object({
    connected: z.literal(true),
    athleteId: z.string().min(1),
    displayName: z.string().nullable(),
    tokens: tokensSchema,
  }),
])

function endpoint(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  if (!url) throw new Error('supabase_unavailable')
  return `${url.replace(/\/$/, '')}/functions/v1/strava-connection`
}

async function request(method: 'GET' | 'POST' | 'DELETE', tokens?: StravaTokens) {
  const client = getSupabaseClient()
  if (!client) throw new Error('supabase_unavailable')
  const { data, error } = await client.auth.getSession()
  if (error || !data.session) throw new Error('authentication_required')
  const response = await fetch(endpoint(), {
    method,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
      'Content-Type': 'application/json',
    },
    ...(tokens ? { body: JSON.stringify(tokens) } : {}),
  })
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const code = z.object({ error: z.string() }).safeParse(payload)
    throw new Error(code.success ? code.data.error : `strava_connection_${response.status}`)
  }
  return connectionSchema.parse(await response.json())
}

/**
 * The server is authoritative for an authenticated account. An old device-only
 * Strava grant is transferred only after the server confirms the athlete with
 * Strava; a server connection always wins over a stale device grant.
 */
export async function reconcileStravaConnection(): Promise<StravaConnection> {
  const client = getSupabaseClient()
  const session = await client?.auth.getSession()
  if (!session?.data.session) return defaultStravaConnection

  let connection = await request('GET')
  if (!connection.connected && connection.revoked) {
    await clearStravaTokens()
    return defaultStravaConnection
  }
  if (!connection.connected && !connection.revoked) {
    const local = await loadStravaTokens()
    if (local) {
      try {
        connection = await request('POST', local)
      } catch (error) {
        if (error instanceof Error && error.message === 'strava_authorization_expired') {
          await clearStravaTokens()
          return defaultStravaConnection
        }
        throw error
      }
    }
  }
  if (!connection.connected) return defaultStravaConnection
  const local = await loadStravaTokens()
  if (
    !local ||
    local.accessToken !== connection.tokens.accessToken ||
    local.refreshToken !== connection.tokens.refreshToken ||
    local.expiresAt !== connection.tokens.expiresAt
  ) {
    await saveStravaTokens(connection.tokens)
  }
  return { status: 'connected', athleteName: connection.displayName }
}

/** Reconcile after hydration; never create an empty cloud onboarding document. */
export async function reconcileStoredStravaConnection(): Promise<void> {
  const connection = await reconcileStravaConnection()
  const state = useOnboardingStore.getState()
  if (!state.hydrated || !state.completed || !state.cloud) return
  // Connection state is live server state, not an onboarding document edit.
  if (
    state.strava?.status !== connection.status ||
    state.strava?.athleteName !== connection.athleteName
  )
    useOnboardingStore.setState({ strava: connection })
}

export async function deleteServerStravaConnection(): Promise<void> {
  const client = getSupabaseClient()
  const session = await client?.auth.getSession()
  if (session?.data.session) await request('DELETE')
}
