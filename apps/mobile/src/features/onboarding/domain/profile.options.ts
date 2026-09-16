import { Bike, Mountain, Route } from '@tamagui/lucide-icons-2'

import type { CyclistProfileForm } from './profile.schema'

/**
 * What each answer means, and how the rider picks it.
 *
 * Shared between the onboarding step and the settings editor: the two present
 * it differently — a guided step with room to explain, a compact edit — but
 * "what counts as gravel" is one answer and should not drift between them.
 */
export const disciplines = [
  {
    value: 'road',
    title: 'Route',
    description: 'Performance, endurance et sorties sur route.',
    icon: Route,
  },
  {
    value: 'gravel',
    title: 'Gravel',
    description: 'Route et chemins, avec plus de liberté.',
    icon: Bike,
  },
  {
    value: 'mtb',
    title: 'VTT',
    description: 'Sentiers, technique et dénivelé.',
    icon: Mountain,
  },
] as const

export const experiences = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'regular', label: 'Régulier' },
  { value: 'advanced', label: 'Avancé' },
] as const

export const volumes = [
  { value: 'lt3', label: '< 3 h' },
  { value: '3to6', label: '3–6 h' },
  { value: '6to10', label: '6–10 h' },
  { value: 'gt10', label: '10 h+' },
] as const

/** Reads a label off an option list, tolerating the `label` / `title` split. */
function labelOf<T extends string>(
  options: readonly { value: T; label?: string; title?: string }[],
  value: T,
): string {
  const option = options.find((candidate) => candidate.value === value)

  return option?.label ?? option?.title ?? value
}

/** One line summarising the profile, for the settings row. */
export function describeProfile(profile: CyclistProfileForm | null): string {
  if (profile === null) {
    return 'À définir'
  }

  return [
    labelOf(disciplines, profile.discipline),
    labelOf(experiences, profile.experience),
    labelOf(volumes, profile.weeklyVolume),
  ].join(' · ')
}
