import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import { getSupabaseClient } from '@/services/supabase/client'

WebBrowser.maybeCompleteAuthSession()

function tokensFromCallback(callbackUrl: string) {
  const callback = new URL(callbackUrl)
  const search = new URLSearchParams(callback.search)
  const fragment = new URLSearchParams(callback.hash.replace(/^#/, ''))
  const value = (name: string) => search.get(name) ?? fragment.get(name)
  const error = value('error_description') ?? value('error')
  const accessToken = value('access_token')
  const refreshToken = value('refresh_token')

  if (error) throw new Error(error)
  if (!accessToken || !refreshToken) throw new Error('google_callback_missing_session')
  return { access_token: accessToken, refresh_token: refreshToken }
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
  if (error || !data.url) throw error ?? new Error('google_authorization_unavailable')

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== 'success') throw new Error('google_authorization_cancelled')

  const { error: sessionError } = await client.auth.setSession(tokensFromCallback(result.url))
  if (sessionError) throw sessionError
}
