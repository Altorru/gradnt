import * as Crypto from 'expo-crypto'
import { z } from 'zod'

import { activitySchema, type Activity } from '@/lib/domain'
import { getSupabaseClient } from '@/services/supabase/client'

const rowSchema = z.object({
  id: z.string().uuid(),
  source: z.enum(['manual', 'file']),
  payload: activitySchema,
})

export type OwnedActivityInput = Omit<Activity, 'id' | 'externalId'> & {
  source: 'manual' | 'file'
}

async function userClient() {
  const client = getSupabaseClient()
  if (!client) throw new Error('supabase_unavailable')
  const { data, error } = await client.auth.getSession()
  if (error || !data.session) throw new Error('authentication_required')
  return { client, userId: data.session.user.id }
}

export async function listOwnedActivities(): Promise<Activity[]> {
  const { client } = await userClient()
  const activities: Activity[] = []
  const pageSize = 500
  for (let page = 0; page < 20; page += 1) {
    const { data, error } = await client
      .from('owned_activities')
      .select('id, source, payload')
      .order('start_at', { ascending: false })
      .order('id', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)
    if (error) throw error
    const rows = data ?? []
    for (const raw of rows) {
      const parsed = rowSchema.safeParse(raw)
      if (parsed.success && parsed.data.payload.source === parsed.data.source)
        activities.push(parsed.data.payload)
    }
    if (rows.length < pageSize) return activities
  }
  throw new Error('owned_activities_limit_exceeded')
}

export async function saveOwnedActivity(
  input: OwnedActivityInput,
  file?: { sha256: string; name: string },
): Promise<Activity> {
  const { client, userId } = await userClient()
  if ((input.source === 'file') !== Boolean(file)) throw new Error('invalid_activity_source')
  const id = Crypto.randomUUID()
  const activity = activitySchema.parse({ ...input, id: `${input.source}-${id}`, externalId: null })
  const { error } = await client.from('owned_activities').insert({
    id,
    user_id: userId,
    source: input.source,
    start_at: activity.startAt,
    file_sha256: file?.sha256 ?? null,
    file_name: file?.name ?? null,
    payload: activity,
  })
  if (error?.code === '23505') throw new Error('activity_already_imported')
  if (error) throw error
  return activity
}
