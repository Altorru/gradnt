import 'react-native-url-polyfill/auto'
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js'

import { authStorage } from '../auth/auth-storage'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) return null
  if (!key.startsWith('sb_publishable_')) throw new Error('supabase_publishable_key_required')
  const parsed = new URL(url)
  if (
    parsed.protocol !== 'https:' &&
    parsed.hostname !== 'localhost' &&
    parsed.hostname !== '127.0.0.1'
  ) {
    throw new Error('supabase_https_required')
  }
  client = createClient(url, key, {
    auth: {
      storage: authStorage,
      lock: processLock,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })
  return client
}
