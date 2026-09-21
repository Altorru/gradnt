import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import {
  loadLocalOnboardingSnapshot,
  loadOnboardingSnapshot,
  saveOnboardingSnapshot,
} from '@/features/onboarding/services/onboarding.persistence'
import { nextRequiredOnboardingStep } from '@/features/onboarding/domain/onboarding-progress'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import { waitForAuthTransition } from '@/services/auth/auth-transition'
import { getSupabaseClient } from '@/services/supabase/client'
import { readCloudDocument } from '@/services/supabase/documents'

WebBrowser.maybeCompleteAuthSession()

export class GoogleAuthError extends Error {
  constructor(public readonly code: 'provider_disabled' | 'cancelled' | 'failed' | 'save_failed') {
    super(code)
    this.name = 'GoogleAuthError'
  }
}

type GoogleSignInDestination =
  '/home' | '/onboarding/profile' | '/onboarding/goal' | '/onboarding/availability'

let callbackInProgress: { key: string; promise: Promise<GoogleSignInDestination> } | null = null
let onboardingCompletionInProgress: Promise<GoogleSignInDestination> | null = null

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

async function completeAuthenticatedOnboardingOnce(): Promise<GoogleSignInDestination> {
  await waitForAuthTransition()
  const cloud = await readCloudDocument('onboarding')
  if (cloud.mode !== 'cloud') throw new Error('google_session_missing')

  // A previous sign-in may already have saved a partial cloud document. Use
  // that account's answers rather than silently replacing them with local data.
  const snapshot =
    cloud.value === null ? await loadLocalOnboardingSnapshot() : await loadOnboardingSnapshot()
  const missing = nextRequiredOnboardingStep(snapshot)
  const step =
    missing === '/onboarding/profile'
      ? 2
      : missing === '/onboarding/goal'
        ? 3
        : missing === '/onboarding/availability'
          ? 4
          : 8

  if (
    snapshot &&
    (cloud.value === null ||
      snapshot.completed !== (missing === null) ||
      snapshot.currentStep !== step)
  ) {
    await saveOnboardingSnapshot({
      ...snapshot,
      cloud: cloud.metadata,
      currentStep: step,
      completed: missing === null,
    })
  }
  await useOnboardingStore.getState().hydrate()
  if (useOnboardingStore.getState().persistenceError) throw new Error('cloud_load_failed')
  return missing ?? '/home'
}

/** Also repairs an already authenticated account after an interrupted callback. */
export function completeAuthenticatedOnboarding(): Promise<GoogleSignInDestination> {
  if (onboardingCompletionInProgress) return onboardingCompletionInProgress
  const promise = completeAuthenticatedOnboardingOnce()
    .catch(() => {
      throw new GoogleAuthError('save_failed')
    })
    .finally(() => {
      if (onboardingCompletionInProgress === promise) onboardingCompletionInProgress = null
    })
  onboardingCompletionInProgress = promise
  return promise
}

async function completeGoogleCallbackOnce(
  credentials: GoogleCallbackCredentials,
): Promise<GoogleSignInDestination> {
  const client = getSupabaseClient()
  if (!client) throw new Error('supabase_unavailable')
  const { error } =
    'code' in credentials
      ? await client.auth.exchangeCodeForSession(credentials.code)
      : await client.auth.setSession(credentials)
  if (error) throw new GoogleAuthError('failed')

  return completeAuthenticatedOnboarding()
}

/** Both the browser result and Android deep link may deliver the same one-use code. */
export function completeGoogleCallback(callbackUrl: string): Promise<GoogleSignInDestination> {
  const credentials = tokensFromCallback(callbackUrl)
  const key = 'code' in credentials ? credentials.code : credentials.access_token
  if (callbackInProgress?.key === key) return callbackInProgress.promise
  const promise = completeGoogleCallbackOnce(credentials).catch((error: unknown) => {
    if (callbackInProgress?.key === key) callbackInProgress = null
    throw error
  })
  callbackInProgress = { key, promise }
  return promise
}

/** Opens Google's hosted consent screen and persists the returned Supabase session. */
export async function signInWithGoogle(): Promise<GoogleSignInDestination> {
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
  return completeGoogleCallback(result.url)
}
