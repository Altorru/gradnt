import { z } from 'zod'

export const stravaConnectionStatusSchema = z.enum(['not_connected', 'connected'])

export const stravaConnectionSchema = z.object({
  status: stravaConnectionStatusSchema,
  athleteName: z.string().nullable(),
})

export type StravaConnection = z.infer<typeof stravaConnectionSchema>
export type StravaConnectionStatus = z.infer<typeof stravaConnectionStatusSchema>

export const defaultStravaConnection: StravaConnection = {
  status: 'not_connected',
  athleteName: null,
}
