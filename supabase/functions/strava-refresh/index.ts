/**
 * Strava token refresh.
 *
 * A Strava access token lives about six hours. Without this endpoint the app
 * works for six hours and then fails — the refresh token was being captured and
 * stored, but nothing could ever spend it.
 *
 * Same shape as `strava-exchange`: a stateless secret-holder that owns the
 * client_secret and stores nothing.
 *
 * Strava ROTATES the refresh token on every call, so the caller must persist
 * what comes back: the one it sent is already spent. That is why a lost
 * response is unrecoverable rather than retryable, and why the caller is
 * expected to write the new tokens before using them.
 */

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'

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

  let tokenResponse: Response
  try {
    tokenResponse = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
  } catch (error) {
    console.error('Could not reach Strava', error)
    return json({ error: 'strava_unreachable' }, 502)
  }

  if (!tokenResponse.ok) {
    // A 400 or 401 here means the refresh token itself is dead — revoked, or
    // already spent by a refresh whose response was lost. There is no recovery
    // short of the rider authorizing again, so this is answered distinctly from
    // a transient failure and the client clears its session.
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
        refreshToken: typeof token.refresh_token === 'string' ? token.refresh_token : refreshToken,
        expiresAt: new Date(token.expires_at * 1000).toISOString(),
      },
    },
    200,
  )
})
