import { z } from 'zod'

import { getSupabaseClient } from './supabase/client'

const eventNameSchema = z.enum([
  'ride_feedback_opened',
  'ride_feedback_deferred',
  'ride_feedback_saved',
  'ride_detail_opened',
  'adaptation_accepted',
  'app_opened',
])

const propertySchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))

export type ProductEventName = z.infer<typeof eventNameSchema>

/**
 * Product events contain decisions and coarse dimensions only, never ride notes,
 * activity payloads, or AI prompts. Analytics must never make the provenance
 * boundary less private than the feature itself.
 */
export async function recordProductEvent(
  name: ProductEventName,
  properties: Record<string, string | number | boolean> = {},
): Promise<void> {
  const parsedName = eventNameSchema.safeParse(name)
  const parsedProperties = propertySchema.safeParse(properties)
  if (!parsedName.success || !parsedProperties.success) return

  const client = getSupabaseClient()
  if (!client) return
  const { data } = await client.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return

  try {
    await client.from('product_events').insert({
      user_id: userId,
      event_name: parsedName.data,
      properties: parsedProperties.data,
    })
  } catch {
    // Measurement must never make the rider's feedback or adaptation fail.
  }
}
