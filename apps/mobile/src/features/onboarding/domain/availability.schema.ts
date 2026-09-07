import { z } from 'zod'

export const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export const availabilityDurationMinutes = [45, 60, 90, 120, 150] as const

export const availabilitySlotSchema = z.object({
  day: z.enum(weekdays),
  available: z.boolean(),
  durationMinutes: z.number().int().positive().nullable(),
})

export const weeklyAvailabilitySchema = z
  .array(availabilitySlotSchema)
  .length(weekdays.length)
  .superRefine((slots, context) => {
    const availableSlots = slots.filter((slot) => slot.available)

    if (availableSlots.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'Sélectionne au moins un jour disponible.',
      })
    }

    availableSlots.forEach((slot) => {
      if (slot.durationMinutes === null) {
        const index = slots.findIndex((candidate) => candidate.day === slot.day)

        context.addIssue({
          code: 'custom',
          path: [index, 'durationMinutes'],
          message: 'Choisis une durée approximative.',
        })
      }
    })
  })

export const weeklyAvailabilityFormSchema = z.object({
  slots: weeklyAvailabilitySchema,
})

export type Weekday = (typeof weekdays)[number]
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>
export type WeeklyAvailabilityForm = z.infer<typeof weeklyAvailabilitySchema>

export const defaultWeeklyAvailability: WeeklyAvailabilityForm = [
  { day: 'monday', available: false, durationMinutes: null },
  { day: 'tuesday', available: true, durationMinutes: 60 },
  { day: 'wednesday', available: false, durationMinutes: null },
  { day: 'thursday', available: true, durationMinutes: 60 },
  { day: 'friday', available: false, durationMinutes: null },
  { day: 'saturday', available: true, durationMinutes: 120 },
  { day: 'sunday', available: false, durationMinutes: null },
]

export const weekdayLabels: Record<Weekday, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

export const durationLabels: Record<(typeof availabilityDurationMinutes)[number], string> = {
  45: '45 min',
  60: '1 h',
  90: '1 h 30',
  120: '2 h',
  150: '2 h+',
}
