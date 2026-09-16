import { z } from 'zod'

import type { Translate } from '@/i18n'

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
        // A catalogue key, not a sentence: nothing user-facing lives outside
        // the catalogue. No screen renders this one today — the step checks
        // the same rule to enable its button — but a code cannot go stale.
        message: 'onboarding.availability.errors.noDay',
      })
    }

    availableSlots.forEach((slot) => {
      if (slot.durationMinutes === null) {
        const index = slots.findIndex((candidate) => candidate.day === slot.day)

        context.addIssue({
          code: 'custom',
          path: [index, 'durationMinutes'],
          message: 'onboarding.availability.errors.noDuration',
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

/** The day names, in the rider's language. A function of `t`: no hook here. */
export function weekdayLabels(t: Translate): Record<Weekday, string> {
  return {
    monday: t('onboarding.weekdays.monday'),
    tuesday: t('onboarding.weekdays.tuesday'),
    wednesday: t('onboarding.weekdays.wednesday'),
    thursday: t('onboarding.weekdays.thursday'),
    friday: t('onboarding.weekdays.friday'),
    saturday: t('onboarding.weekdays.saturday'),
    sunday: t('onboarding.weekdays.sunday'),
  }
}

export function durationLabels(
  t: Translate,
): Record<(typeof availabilityDurationMinutes)[number], string> {
  return {
    45: t('onboarding.durations.min45'),
    60: t('onboarding.durations.hour'),
    90: t('onboarding.durations.hour30'),
    120: t('onboarding.durations.hours2'),
    150: t('onboarding.durations.hours2plus'),
  }
}
