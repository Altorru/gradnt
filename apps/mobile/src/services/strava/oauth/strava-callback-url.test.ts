import { describe, expect, it } from 'vitest'

import appConfig from '../../../../app.json'
import { stravaAppCallbackUri } from './strava-config'
import { stashStravaCallbackUrl, takeStravaCallbackUrl, toCallbackUrl } from './strava-callback-url'

/**
 * The scheme the app actually registers, taken from the config that registers
 * it rather than restated here — the point of the check below is that the two
 * cannot drift.
 */
const registeredScheme = appConfig.expo.scheme

describe('the app callback uri', () => {
  it('uses the scheme app.json actually registers', () => {
    // The bridge redirects to this exact address, and it is hard-coded there
    // too. If the scheme moves in app.json and not in these two places, Strava
    // sends the rider to a URL no app answers — and it surfaces as a connection
    // that silently never comes back, not as a broken constant.
    expect(stravaAppCallbackUri).toBe(`${registeredScheme}://strava/callback`)
  })
})

describe('toCallbackUrl', () => {
  it('keeps a full deep link addressable on the app callback uri', () => {
    expect(toCallbackUrl('gradnt://strava/callback?code=abc&state=xyz')).toBe(
      'gradnt://strava/callback?code=abc&state=xyz',
    )
  })

  it('re-bases a bare path, so the host form does not matter', () => {
    expect(toCallbackUrl('/callback?code=abc&state=xyz')).toBe(
      'gradnt://strava/callback?code=abc&state=xyz',
    )
  })

  it('preserves url-encoded values verbatim', () => {
    const raw = 'gradnt://strava/callback?state=abc&scope=profile%3Aread_all%20activity%3Aread_all'

    expect(toCallbackUrl(raw)).toBe(raw)
  })

  it('carries an OAuth error through unchanged', () => {
    expect(toCallbackUrl('gradnt://strava/callback?error=access_denied&state=xyz')).toBe(
      'gradnt://strava/callback?error=access_denied&state=xyz',
    )
  })

  it('returns the bare callback uri when the link has no query', () => {
    expect(toCallbackUrl('gradnt://strava/callback')).toBe('gradnt://strava/callback')
  })
})

describe('stashStravaCallbackUrl / takeStravaCallbackUrl', () => {
  it('hands the url over exactly once', () => {
    stashStravaCallbackUrl('gradnt://strava/callback?code=abc')

    expect(takeStravaCallbackUrl()).toBe('gradnt://strava/callback?code=abc')
    expect(takeStravaCallbackUrl()).toBeNull()
  })
})
