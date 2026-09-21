import { authenticatedUser, serviceClient } from '../_shared/supabase.ts'
import { refreshStravaToken, stravaFetch, type StravaTokens } from '../_shared/strava.ts'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Cache-Control': 'no-store',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers })
}

type Candidate = { accessToken: string; refreshToken: string; expiresAt: string }

function candidate(value: unknown): Candidate | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (
    typeof item.accessToken !== 'string' ||
    !item.accessToken ||
    typeof item.refreshToken !== 'string' ||
    !item.refreshToken ||
    typeof item.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(item.expiresAt))
  )
    return null
  return {
    accessToken: item.accessToken,
    refreshToken: item.refreshToken,
    expiresAt: item.expiresAt,
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (!['GET', 'POST', 'DELETE'].includes(req.method))
    return json({ error: 'method_not_allowed' }, 405)
  const user = await authenticatedUser(req)
  if (!user) return json({ error: 'authentication_required' }, 401)
  const client = serviceClient()

  if (req.method === 'GET') {
    const { data, error } = await client
      .from('strava_connections')
      .select(
        'athlete_id, display_name, scopes, access_token, refresh_token, expires_at, revoked_at',
      )
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) return json({ error: 'connection_lookup_failed' }, 500)
    if (!data) return json({ connected: false, revoked: false })
    if (data.revoked_at) return json({ connected: false, revoked: true })
    return json({
      connected: true,
      athleteId: data.athlete_id,
      displayName: data.display_name,
      scopes: data.scopes,
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      },
    })
  }

  if (req.method === 'DELETE') {
    const { error } = await client.from('strava_connections').delete().eq('user_id', user.id)
    if (error) return json({ error: 'connection_delete_failed' }, 500)
    return json({ connected: false })
  }

  let tokens: Candidate | null
  try {
    tokens = candidate(await req.json())
  } catch {
    tokens = null
  }
  if (!tokens) return json({ error: 'invalid_tokens' }, 400)

  let fetched: { response: Response; tokens?: StravaTokens }
  try {
    fetched = await stravaFetch(
      '/athlete',
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresAt,
    )
    if (fetched.response.status === 401) {
      const refreshed = await refreshStravaToken(
        fetched.tokens?.refreshToken ?? tokens.refreshToken,
      )
      fetched = {
        response: await fetch('https://www.strava.com/api/v3/athlete', {
          headers: { Authorization: `Bearer ${refreshed.accessToken}` },
        }),
        tokens: refreshed,
      }
    }
  } catch {
    return json({ error: 'strava_unreachable' }, 502)
  }
  if (fetched.response.status === 401 || fetched.response.status === 403)
    return json({ error: 'strava_authorization_expired' }, 401)
  if (!fetched.response.ok) return json({ error: 'strava_unavailable' }, 502)
  const athlete = (await fetched.response.json()) as Record<string, unknown>
  if (typeof athlete.id !== 'number' || !Number.isSafeInteger(athlete.id))
    return json({ error: 'invalid_athlete' }, 502)
  const effective = fetched.tokens ?? tokens
  const displayName =
    [athlete.firstname, athlete.lastname]
      .filter((part): part is string => typeof part === 'string' && part.length > 0)
      .join(' ') || null
  const { error } = await client.from('strava_connections').upsert(
    {
      user_id: user.id,
      athlete_id: String(athlete.id),
      display_name: displayName,
      access_token: effective.accessToken,
      refresh_token: effective.refreshToken,
      expires_at: effective.expiresAt,
      revoked_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error?.code === '23505') return json({ error: 'athlete_already_linked' }, 409)
  if (error) return json({ error: 'connection_save_failed' }, 500)
  return json({
    connected: true,
    athleteId: String(athlete.id),
    displayName,
    tokens: effective,
  })
})
