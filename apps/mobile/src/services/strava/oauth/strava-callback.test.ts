import { describe, expect, it } from 'vitest'

import { handleCallback } from './strava-callback'

const CALLBACK = 'gradnt://strava/callback'

describe('handleCallback', () => {
  it('returns insufficientScopes with all required scopes when the scope parameter is absent', () => {
    const result = handleCallback(`${CALLBACK}?code=code-abc&state=fixed-state`, 'fixed-state')

    expect(result).toEqual({
      status: 'insufficientScopes',
      grantedScopes: [],
      missingRequiredScopes: ['profile:read_all', 'activity:read_all'],
    })
  })

  it('returns success with the granted scopes when all required scopes are present', () => {
    const result = handleCallback(
      `${CALLBACK}?code=code-abc&state=fixed-state&scope=profile:read_all%20activity:read_all`,
      'fixed-state',
    )

    expect(result).toEqual({
      status: 'success',
      code: 'code-abc',
      grantedScopes: ['profile:read_all', 'activity:read_all'],
    })
  })

  it('ignores unknown scopes when all required scopes are present', () => {
    const result = handleCallback(
      `${CALLBACK}?code=code-abc&state=fixed-state&scope=unknown_scope%20profile:read_all%20activity:read_all`,
      'fixed-state',
    )

    expect(result).toEqual({
      status: 'success',
      code: 'code-abc',
      grantedScopes: ['profile:read_all', 'activity:read_all'],
    })
  })

  it('returns insufficientScopes with missing required scopes when one is missing', () => {
    const result = handleCallback(
      `${CALLBACK}?code=code-abc&state=fixed-state&scope=profile:read_all`,
      'fixed-state',
    )

    expect(result).toEqual({
      status: 'insufficientScopes',
      grantedScopes: ['profile:read_all'],
      missingRequiredScopes: ['activity:read_all'],
    })
  })

  it('returns insufficientScopes with all required scopes missing when scope is empty', () => {
    const result = handleCallback(
      `${CALLBACK}?code=code-abc&state=fixed-state&scope=`,
      'fixed-state',
    )

    expect(result).toEqual({
      status: 'insufficientScopes',
      grantedScopes: [],
      missingRequiredScopes: ['profile:read_all', 'activity:read_all'],
    })
  })

  it('returns invalidState when state is missing', () => {
    const result = handleCallback(`${CALLBACK}?code=code-abc`, 'fixed-state')

    expect(result).toEqual({ status: 'invalidState' })
  })

  it('returns invalidState when state differs from the expected one', () => {
    const result = handleCallback(`${CALLBACK}?code=code-abc&state=other-state`, 'fixed-state')

    expect(result).toEqual({ status: 'invalidState' })
  })

  it('returns missingCode when state matches but no code is present', () => {
    const result = handleCallback(`${CALLBACK}?state=fixed-state`, 'fixed-state')

    expect(result).toEqual({ status: 'missingCode' })
  })

  it('returns userDenied when error is access_denied and state matches', () => {
    const result = handleCallback(
      `${CALLBACK}?error=access_denied&state=fixed-state`,
      'fixed-state',
    )

    expect(result).toEqual({ status: 'userDenied' })
  })

  it('returns oauthError with the error code for other OAuth errors', () => {
    const result = handleCallback(
      `${CALLBACK}?error=invalid_scope&state=fixed-state`,
      'fixed-state',
    )

    expect(result).toEqual({ status: 'oauthError', error: 'invalid_scope' })
  })

  it('keeps the error description when it is present', () => {
    const result = handleCallback(
      `${CALLBACK}?error=invalid_scope&error_description=Scope%20not%20authorized&state=fixed-state`,
      'fixed-state',
    )

    expect(result).toEqual({
      status: 'oauthError',
      error: 'invalid_scope',
      errorDescription: 'Scope not authorized',
    })
  })

  it('keeps the error description on userDenied when it is present', () => {
    const result = handleCallback(
      `${CALLBACK}?error=access_denied&error_description=User%20denied&state=fixed-state`,
      'fixed-state',
    )

    expect(result).toEqual({
      status: 'userDenied',
      errorDescription: 'User denied',
    })
  })

  it('returns invalidState over an OAuth error when state is missing', () => {
    const result = handleCallback(`${CALLBACK}?error=access_denied`, 'fixed-state')

    expect(result).toEqual({ status: 'invalidState' })
  })

  it('returns invalidState over an OAuth error when state differs', () => {
    const result = handleCallback(
      `${CALLBACK}?error=invalid_scope&state=other-state`,
      'fixed-state',
    )

    expect(result).toEqual({ status: 'invalidState' })
  })
})
