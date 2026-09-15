import { describe, expect, it } from 'vitest'

import { stashStravaCallbackUrl, takeStravaCallbackUrl, toCallbackUrl } from './strava-callback-url'

describe('toCallbackUrl', () => {
  it('keeps a full deep link addressable on the app callback uri', () => {
    expect(toCallbackUrl('mobile://strava/callback?code=abc&state=xyz')).toBe(
      'mobile://strava/callback?code=abc&state=xyz',
    )
  })

  it('re-bases a bare path, so the host form does not matter', () => {
    expect(toCallbackUrl('/callback?code=abc&state=xyz')).toBe(
      'mobile://strava/callback?code=abc&state=xyz',
    )
  })

  it('preserves url-encoded values verbatim', () => {
    const raw = 'mobile://strava/callback?state=abc&scope=profile%3Aread_all%20activity%3Aread_all'

    expect(toCallbackUrl(raw)).toBe(raw)
  })

  it('carries an OAuth error through unchanged', () => {
    expect(toCallbackUrl('mobile://strava/callback?error=access_denied&state=xyz')).toBe(
      'mobile://strava/callback?error=access_denied&state=xyz',
    )
  })

  it('returns the bare callback uri when the link has no query', () => {
    expect(toCallbackUrl('mobile://strava/callback')).toBe('mobile://strava/callback')
  })
})

describe('stashStravaCallbackUrl / takeStravaCallbackUrl', () => {
  it('hands the url over exactly once', () => {
    stashStravaCallbackUrl('mobile://strava/callback?code=abc')

    expect(takeStravaCallbackUrl()).toBe('mobile://strava/callback?code=abc')
    expect(takeStravaCallbackUrl()).toBeNull()
  })
})
