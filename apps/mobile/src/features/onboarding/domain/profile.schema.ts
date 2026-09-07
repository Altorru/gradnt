import { z } from 'zod'

export const cyclistProfileSchema = z.object({
  discipline: z.enum(['road', 'gravel', 'mtb']),
  experience: z.enum(['beginner', 'regular', 'advanced']),
  weeklyVolume: z.enum(['lt3', '3to6', '6to10', 'gt10']),
})

export type CyclistProfileForm = z.infer<typeof cyclistProfileSchema>
