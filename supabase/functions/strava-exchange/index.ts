/**
 * Strava authorization-code exchange, and the OAuth redirect bridge.
 *
 * Strava's application settings only accept a bare callback *domain* — no
 * scheme, no path — so a native custom scheme cannot be registered there
 * directly. Instead Strava redirects to this function over https, and `GET`
 * forwards that redirect to the app's own scheme. `POST` then turns the
 * one-time code into tokens.
 *
 * The function holds the Strava client_secret and stores nothing: the mobile
 * app owns its tokens (OS keychain via expo-secure-store). That keeps it a
 * stateless secret-holder, which is why it needs no auth, no database and no
 * user model.
 *
 * ponytail: no rate limiting and no shared-secret header. The code is single
 * use, short lived and bound to the registered redirect URI, so the residual
 * risk is abuse/DoS. Add platform-level rate limits if that shows up.
 */

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
import { authenticatedUser, serviceClient } from '../_shared/supabase.ts'

/**
 * Where the OS hands the authorization response back to the app. Fixed, never
 * derived from the request: only the query string is forwarded, so this cannot
 * be turned into an open redirect.
 *
 * Must match the `scheme` in apps/mobile/app.json.
 */
const APP_CALLBACK_URI = 'gradnt://strava/callback'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Forwards Strava's redirect to the app's custom scheme, preserving the query
 * so `state` still reaches the app for validation.
 */
function bridgeToApp(url: URL): Response {
  if (!url.searchParams.has('code') && !url.searchParams.has('error')) {
    return new Response('Missing code or error parameter', { status: 400 })
  }

  return new Response(null, {
    status: 302,
    headers: { Location: `${APP_CALLBACK_URI}${url.search}` },
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return bridgeToApp(new URL(req.url))
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

  const code = (payload as { code?: unknown } | null)?.code
  if (typeof code !== 'string' || code === '') {
    return json({ error: 'missing_code' }, 400)
  }

  const clientId = Deno.env.get('STRAVA_CLIENT_ID')
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    console.error('STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET are not configured')
    return json({ error: 'not_configured' }, 500)
  }

  let tokenResponse: Response
  try {
    tokenResponse = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    })
  } catch (error) {
    console.error('Could not reach Strava', error)
    return json({ error: 'strava_unreachable' }, 502)
  }

  if (!tokenResponse.ok) {
    // Never forward Strava's body: it can echo the submitted credentials back.
    console.error('Strava rejected the exchange', tokenResponse.status)
    return json({ error: 'strava_exchange_failed' }, 502)
  }

  const token = (await tokenResponse.json()) as {
    access_token?: string
    refresh_token?: string
    expires_at?: number
    scope?: string
    athlete?: { id?: number; firstname?: string; lastname?: string }
  }

  if (
    typeof token.access_token !== 'string' ||
    typeof token.refresh_token !== 'string' ||
    typeof token.expires_at !== 'number'
  ) {
    console.error('Strava returned an unexpected token payload')
    return json({ error: 'strava_unexpected_response' }, 502)
  }

  const athlete = token.athlete ?? {}
  const displayName =
    [athlete.firstname, athlete.lastname]
      .filter((part): part is string => typeof part === 'string' && part !== '')
      .join(' ') || null

  const user = await authenticatedUser(req)
  if (user && typeof athlete.id === 'number') {
    const client = serviceClient()
    const { error } = await client.from('strava_connections').upsert(
      {
        user_id: user.id,
        athlete_id: String(athlete.id),
        display_name: displayName,
        scopes: String(token.scope ?? '')
          .split(/[\s,]+/)
          .filter(Boolean),
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: new Date(token.expires_at * 1000).toISOString(),
        revoked_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (error) {
      console.error('Could not persist Strava connection', error)
      return json({ error: 'connection_persistence_failed' }, 500)
    }
  }

  return json(
    {
      athleteId: athlete.id === undefined ? null : String(athlete.id),
      displayName,
      // Strava documents this as "a comma- or URL-safe space-delimited string",
      // and the token response example uses spaces ("activity:read
      // activity:write"), so both delimiters are accepted.
      grantedScopes: String(token.scope ?? '')
        .split(/[\s,]+/)
        .map((value) => value.trim())
        .filter((value) => value !== ''),
      tokens: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: new Date(token.expires_at * 1000).toISOString(),
      },
    },
    200,
  )
})
