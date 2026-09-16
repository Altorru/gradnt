import { z } from 'zod'

export const cyclistGoalSchema = z
  .object({
    type: z.enum(['ftp', 'distance', 'event', 'climbing', 'fitness']),

    targetValue: z.string().trim(),
    eventName: z.string().trim(),

    /**
     * Optional rather than defaulted: a default makes the parsed output differ
     * from the form's input type, which react-hook-form's resolver generics
     * reject. Absent means "not asked yet", and the repository reads a missing
     * measure as a running total — the only behaviour before this existed.
     */
    measure: z.enum(['cumulative', 'best']).optional(),
    targetDate: z.string().trim().nullable().optional(),
  })
  .superRefine((data, context) => {
    if (data.type === 'event') {
      if (!data.eventName) {
        context.addIssue({
          code: 'custom',
          path: ['eventName'],
          message: 'Indique le nom de ton événement.',
        })
      }

      return
    }

    if (data.type === 'fitness') {
      return
    }

    const value = Number(data.targetValue)

    if (!data.targetValue || !Number.isFinite(value) || value <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['targetValue'],
        message: 'Indique un objectif valide.',
      })
    }
  })

export type CyclistGoalForm = z.infer<typeof cyclistGoalSchema>
