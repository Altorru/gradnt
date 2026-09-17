import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

type PushDevice = { id: string; expo_push_token: string }

export async function sendRideFeedbackPush(
  client: SupabaseClient,
  userId: string,
  activityId: string,
): Promise<void> {
  const { data, error } = await client
    .from('push_devices')
    .select('id, expo_push_token')
    .eq('user_id', userId)
    .eq('enabled', true)
  if (error) throw error
  const devices = (data ?? []) as PushDevice[]
  if (devices.length === 0) return
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      devices.map((device) => ({
        to: device.expo_push_token,
        title: 'Belle sortie 🚴',
        body: 'Ajoute tes sensations pour recevoir ton analyse personnalisée.',
        sound: 'default',
        data: { url: `/rides/${activityId}/feedback`, activityId, kind: 'ride_feedback' },
        channelId: 'sessions',
      })),
    ),
  })
  if (!response.ok) throw new Error(`expo_push_${response.status}`)
  const result = (await response.json()) as {
    data?: Array<{ status?: string; details?: { error?: string } }>
  }
  const invalidIds = devices
    .filter((_, index) => result.data?.[index]?.details?.error === 'DeviceNotRegistered')
    .map((device) => device.id)
  if (invalidIds.length > 0) {
    await client.from('push_devices').update({ enabled: false }).in('id', invalidIds)
  }
}
