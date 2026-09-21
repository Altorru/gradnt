import { z } from 'zod'

export const manualActivityFormSchema = z.object({
  dateTime: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/),
  sportType: z.enum(['road', 'gravel', 'mtb', 'indoor_cycling']),
  durationMinutes: z.coerce
    .number()
    .positive()
    .max(7 * 24 * 60),
  distanceKm: z.coerce.number().nonnegative().max(5000),
  elevationMeters: z.coerce.number().nonnegative().max(50000),
})

export type ManualActivityForm = {
  dateTime: string
  sportType: 'road' | 'gravel' | 'mtb' | 'indoor_cycling'
  durationMinutes: string
  distanceKm: string
  elevationMeters: string
}

export function parseLocalRideDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day) ||
    date.getHours() !== Number(hour) ||
    date.getMinutes() !== Number(minute) ||
    date.getTime() > Date.now() + 60_000
  )
    return null
  return date.toISOString()
}
