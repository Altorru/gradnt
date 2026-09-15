import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod'

const stravaTokensStorageKey = 'gradnt.strava.tokens.v1'
const pendingStateStorageKey = 'gradnt.strava.pending-state.v1'

export const stravaTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().datetime(),
})

export type StravaTokens = z.infer<typeof stravaTokensSchema>

/**
 * Session-only fallback for web.
 *
 * Unlike the plan overrides, these values are credentials, so they must never
 * be mirrored into localStorage where any script on the origin can read them.
 * On web the tokens simply do not outlive the tab.
 */
let webSessionTokens: StravaTokens | null = null
let webPendingState: string | null = null

export async function saveStravaTokens(tokens: StravaTokens): Promise<void> {
  const parsedTokens = stravaTokensSchema.parse(tokens)

  if (Platform.OS === 'web') {
    webSessionTokens = parsedTokens
    return
  }

  await SecureStore.setItemAsync(stravaTokensStorageKey, JSON.stringify(parsedTokens))
}

export async function loadStravaTokens(): Promise<StravaTokens | null> {
  if (Platform.OS === 'web') {
    return webSessionTokens
  }

  try {
    const storedValue = await SecureStore.getItemAsync(stravaTokensStorageKey)

    if (!storedValue) {
      return null
    }

    const result = stravaTokensSchema.safeParse(JSON.parse(storedValue))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export async function clearStravaTokens(): Promise<void> {
  webSessionTokens = null

  if (Platform.OS === 'web') {
    return
  }

  await SecureStore.deleteItemAsync(stravaTokensStorageKey)
}

/**
 * The `state` of the authorization attempt currently in flight.
 *
 * It is persisted rather than held in memory because the callback can arrive as
 * a deep link that cold-starts the app, where no closure survives to remember
 * what was requested.
 */
export async function savePendingStravaState(state: string): Promise<void> {
  if (Platform.OS === 'web') {
    webPendingState = state
    return
  }

  await SecureStore.setItemAsync(pendingStateStorageKey, state)
}

/**
 * Reads the pending state and clears it in the same step, so a callback that is
 * delivered twice (browser session *and* deep link) can only ever be consumed
 * once — an authorization code is single use, and a second exchange of the same
 * code would fail.
 */
export async function takePendingStravaState(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const state = webPendingState
    webPendingState = null
    return state
  }

  try {
    const state = await SecureStore.getItemAsync(pendingStateStorageKey)

    if (state !== null) {
      await SecureStore.deleteItemAsync(pendingStateStorageKey)
    }

    return state
  } catch {
    return null
  }
}

export async function clearPendingStravaState(): Promise<void> {
  webPendingState = null

  if (Platform.OS === 'web') {
    return
  }

  await SecureStore.deleteItemAsync(pendingStateStorageKey)
}
