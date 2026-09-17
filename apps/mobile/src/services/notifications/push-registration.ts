import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { getSupabaseClient } from '@/services/supabase/client'

export async function registerPushDevice(): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false
  const client = getSupabaseClient()
  if (!client) return false
  const { data: session } = await client.auth.getSession()
  if (!session.session) return false
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  if (!projectId) return false
  const token = await Notifications.getExpoPushTokenAsync({ projectId })
  const { error } = await client.rpc('register_push_device', {
    device_token: token.data,
    device_platform: Platform.OS,
  })
  return !error
}

export async function unregisterPushDevices(): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return
  const userId = (await client.auth.getUser()).data.user?.id
  if (userId) await client.from('push_devices').delete().eq('user_id', userId)
}
