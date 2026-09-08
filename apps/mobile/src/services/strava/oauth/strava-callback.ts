import { type StravaScope, isStravaScope, requiredScopes } from './strava-scopes'

export type StravaCallbackResult =
  | {
      readonly status: 'success'
      readonly code: string
      readonly grantedScopes: readonly StravaScope[]
    }
  | { readonly status: 'invalidState' }
  | { readonly status: 'missingCode' }
  | {
      readonly status: 'insufficientScopes'
      readonly grantedScopes: readonly StravaScope[]
      readonly missingRequiredScopes: readonly StravaScope[]
    }
  | {
      readonly status: 'userDenied'
      readonly errorDescription?: string
    }
  | {
      readonly status: 'oauthError'
      readonly error: string
      readonly errorDescription?: string
    }

/**
 * Validates the OAuth redirect callback against the expected state.
 *
 * Pure and deterministic: no network, no token exchange. State
 * validation always wins. When state is valid, an OAuth `error`
 * parameter (e.g. `access_denied`) is reported separately from a
 * successful authorization code.
 */
export function handleCallback(callbackUrl: string, expectedState: string): StravaCallbackResult {
  const params = new URL(callbackUrl).searchParams

  const state = params.get('state')
  if (state === null || state !== expectedState) {
    return { status: 'invalidState' }
  }

  const error = params.get('error')
  if (error !== null) {
    const errorDescription = params.get('error_description') ?? undefined
    if (error === 'access_denied') {
      return { status: 'userDenied', errorDescription }
    }
    return { status: 'oauthError', error, errorDescription }
  }

  const code = params.get('code')
  if (code === null || code === '') {
    return { status: 'missingCode' }
  }

  const grantedScopes = parseScopes(params.get('scope'))
  const missingRequiredScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope))
  if (missingRequiredScopes.length > 0) {
    return { status: 'insufficientScopes', grantedScopes, missingRequiredScopes }
  }

  return { status: 'success', code, grantedScopes }
}

/**
 * Parses the space-separated `scope` callback parameter, keeping only the
 * scopes GRADNT recognizes. Unknown scopes are silently ignored so the
 * domain model never carries untyped scope strings.
 */
function parseScopes(scopeParam: string | null): StravaScope[] {
  return (scopeParam ?? '').split(' ').filter((value): value is StravaScope => isStravaScope(value))
}
