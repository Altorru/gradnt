import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import { getSupabaseClient } from '@/services/supabase/client'

WebBrowser.maybeCompleteAuthSession()

export class GoogleAuthError extends Error {
  constructor(public readonly code: 'provider_disabled' | 'cancelled' | 'failed') {
    super(code)
    this.name = 'GoogleAuthError'
  }
}

type GoogleCallbackCredentials = { code: string } | { access_token: string; refresh_token: string }

function tokensFromCallback(callbackUrl: string): GoogleCallbackCredentials {
  const callback = new URL(callbackUrl)
  const search = new URLSearchParams(callback.search)
  const fragment = new URLSearchParams(callback.hash.replace(/^#/, ''))
  const value = (name: string) => search.get(name) ?? fragment.get(name)
  const error = value('error_description') ?? value('error')
  const accessToken = value('access_token')
  const refreshToken = value('refresh_token')
  const code = value('code')

  if (error) {
    if (error.toLowerCase().includes('provider')) throw new GoogleAuthError('provider_disabled')
    throw new GoogleAuthError('failed')
  }
  if (code) return { code }
  if (!accessToken || !refreshToken) throw new GoogleAuthError('failed')
  return { access_token: accessToken, refresh_token: refreshToken }
}

export async function completeGoogleCallback(callbackUrl: string) {
  const client = getSupabaseClient()
  if (!client) throw new Error('supabase_unavailable')
  const credentials = tokensFromCallback(callbackUrl)
  const { error } =
    'code' in credentials
      ? await client.auth.exchangeCodeForSession(credentials.code)
      : await client.auth.setSession(credentials)
  if (error) throw new GoogleAuthError('failed')
}

/** Opens Google's hosted consent screen and persists the returned Supabase session. */
export async function signInWithGoogle() {
  const client = getSupabaseClient()
  if (!client) throw new Error('supabase_unavailable')

  const redirectTo = Linking.createURL('auth/callback')
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error || !data.url) {
    if (error?.message.toLowerCase().includes('provider'))
      throw new GoogleAuthError('provider_disabled')
    throw error ?? new GoogleAuthError('failed')
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== 'success') throw new GoogleAuthError('cancelled')

  await completeGoogleCallback(result.url)
}
