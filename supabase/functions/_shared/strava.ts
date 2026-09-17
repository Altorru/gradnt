const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'

export type StravaTokens = {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokens> {
  const clientId = Deno.env.get('STRAVA_CLIENT_ID')
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')
  if (!clientId || !clientSecret) throw new Error('strava_not_configured')
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!response.ok) throw new Error('strava_refresh_rejected')
  const value = (await response.json()) as Record<string, unknown>
  if (typeof value.access_token !== 'string' || typeof value.expires_at !== 'number') {
    throw new Error('strava_unexpected_response')
  }
  return {
    accessToken: value.access_token,
    refreshToken: typeof value.refresh_token === 'string' ? value.refresh_token : refreshToken,
    expiresAt: new Date(value.expires_at * 1000).toISOString(),
  }
}

export async function stravaFetch(
  path: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: string,
): Promise<{ response: Response; tokens?: StravaTokens }> {
  if (Date.parse(expiresAt) <= Date.now() + 60_000) {
    const tokens = await refreshStravaToken(refreshToken)
    return {
      response: await fetch(`https://www.strava.com/api/v3${path}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      }),
      tokens,
    }
  }
  return {
    response: await fetch(`https://www.strava.com/api/v3${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  }
}
