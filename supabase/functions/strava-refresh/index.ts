/**
 * Strava token refresh.
 *
 * A Strava access token lives about six hours. Without this endpoint the app
 * works for six hours and then fails — the refresh token was being captured and
 * stored, but nothing could ever spend it.
 *
 * Authenticated riders use the server connection as the canonical credential.
 * A second device may hold an older rotated refresh token; it must receive the
 * current server token instead of losing its Strava connection.
 */

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
import { authenticatedUser, serviceClient } from '../_shared/supabase.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const refreshToken = (payload as { refreshToken?: unknown } | null)?.refreshToken
  if (typeof refreshToken !== 'string' || refreshToken === '') {
    return json({ error: 'missing_refresh_token' }, 400)
  }

  const clientId = Deno.env.get('STRAVA_CLIENT_ID')
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    console.error('STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET are not configured')
    return json({ error: 'not_configured' }, 500)
  }

  const user = await authenticatedUser(req)
  const client = user ? serviceClient() : null
  const { data: connection, error: lookupError } =
    user && client
      ? await client
          .from('strava_connections')
          .select('access_token, refresh_token, expires_at, revoked_at')
          .eq('user_id', user.id)
          .maybeSingle()
      : { data: null, error: null }
  if (lookupError) return json({ error: 'connection_lookup_failed' }, 500)
  if (connection?.revoked_at) return json({ error: 'connection_revoked' }, 401)
  if (connection && Date.parse(connection.expires_at) > Date.now() + 5 * 60_000) {
    return json(
      {
        tokens: {
          accessToken: connection.access_token,
          refreshToken: connection.refresh_token,
          expiresAt: connection.expires_at,
        },
      },
      200,
    )
  }
  const effectiveRefreshToken = connection?.refresh_token ?? refreshToken

  let tokenResponse: Response
  try {
    tokenResponse = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: effectiveRefreshToken,
        grant_type: 'refresh_token',
      }),
    })
  } catch (error) {
    console.error('Could not reach Strava', error)
    return json({ error: 'strava_unreachable' }, 502)
  }

  if (!tokenResponse.ok) {
    // Another device or the webhook may have rotated the credential while
    // this request was in flight. Recover from the newest server row first.
    if (connection && user && client) {
      const { data: newer } = await client
        .from('strava_connections')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .maybeSingle()
      if (newer && newer.refresh_token !== effectiveRefreshToken) {
        return json(
          {
            tokens: {
              accessToken: newer.access_token,
              refreshToken: newer.refresh_token,
              expiresAt: newer.expires_at,
            },
          },
          200,
        )
      }
    }
    console.error('Strava rejected the refresh', tokenResponse.status)
    return json({ error: 'refresh_rejected' }, 401)
  }

  const token = (await tokenResponse.json()) as {
    access_token?: string
    refresh_token?: string
    expires_at?: number
    scope?: string
  }

  if (typeof token.access_token !== 'string' || typeof token.expires_at !== 'number') {
    console.error('Strava returned an unexpected refresh payload')
    return json({ error: 'strava_unexpected_response' }, 502)
  }

  const nextRefreshToken =
    typeof token.refresh_token === 'string' ? token.refresh_token : effectiveRefreshToken
  if (user && client && connection) {
    const { data: saved, error } = await client
      .from('strava_connections')
      .update({
        access_token: token.access_token,
        refresh_token: nextRefreshToken,
        expires_at: new Date(token.expires_at * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('refresh_token', effectiveRefreshToken)
      .select('user_id')
    if (error || !saved?.length) return json({ error: 'connection_save_failed' }, 500)
  }

  return json(
    {
      grantedScopes: String(token.scope ?? '')
        .split(/[\s,]+/)
        .map((value) => value.trim())
        .filter((value) => value !== ''),
      tokens: {
        accessToken: token.access_token,
        // Strava rotates this on every refresh. Falling back to the one sent
        // keeps the session alive if a response ever omits it, rather than
        // writing an undefined and locking the rider out.
        refreshToken: nextRefreshToken,
        expiresAt: new Date(token.expires_at * 1000).toISOString(),
      },
    },
    200,
  )
})
