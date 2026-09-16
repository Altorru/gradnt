import { CalendarDays, Gauge, Mountain, Route, TrendingUp } from '@tamagui/lucide-icons-2'

import type { CyclistGoalForm } from './goal.schema'

/**
 * What each goal type means, and how the rider picks it.
 *
 * Shared between the onboarding step and the settings editor rather than owned
 * by one of them: the two present it differently — a guided step with room for
 * explanation, a compact edit — but "what does 'mieux grimper' mean" is one
 * answer, and it should not drift between the two places that say it.
 */
export const goalTypes = [
  {
    value: 'ftp',
    title: 'Améliorer ma FTP',
    description: 'Développer ta puissance durable et suivre ta progression en watts.',
    icon: Gauge,
  },
  {
    value: 'distance',
    title: 'Rouler plus loin',
    description: 'Préparer une distance cible et améliorer ton endurance.',
    icon: Route,
  },
  {
    value: 'event',
    title: 'Préparer un événement',
    description: 'Construire ta progression autour d’une cyclosportive, course ou sortie.',
    icon: CalendarDays,
  },
  {
    value: 'climbing',
    title: 'Mieux grimper',
    description: 'Progresser dans les ascensions et accumuler davantage de dénivelé.',
    icon: Mountain,
  },
  {
    value: 'fitness',
    title: 'Progresser globalement',
    description: 'Rouler régulièrement et améliorer ta forme sans objectif chiffré précis.',
    icon: TrendingUp,
  },
] as const

export const goalTypeLabels = {
  ftp: 'Objectif FTP',
  distance: 'Objectif distance',
  event: 'Objectif événement',
  climbing: 'Objectif dénivelé',
  fitness: 'Objectif forme',
} as const satisfies Record<CyclistGoalForm['type'], string>

/**
 * How a distance or climbing target is read.
 *
 * "500 km" means a season to one rider and a single long day to another. The
 * app assumed the running total, which silently made a one-day target
 * unreachable rather than wrong-looking.
 */
export const goalMeasures = [
  {
    value: 'cumulative',
    label: 'Cumulé',
    description: 'Le total de tes sorties sur la période analysée.',
  },
  {
    value: 'best',
    label: 'En une sortie',
    description: 'Ta meilleure sortie, réussie d’un seul tenant.',
  },
] as const

/** The numeric target a goal type asks for, or null for the types that carry no
 * figure — an event has a name, "progresser globalement" has nothing.
 */
export function getTargetMeta(type: CyclistGoalForm['type']): {
  label: string
  placeholder: string
  unit: string
  keyboardType: 'numeric'
} | null {
  switch (type) {
    case 'ftp':
      return { label: 'FTP cible', placeholder: '280', unit: 'W', keyboardType: 'numeric' }

    case 'distance':
      return { label: 'Distance cible', placeholder: '150', unit: 'km', keyboardType: 'numeric' }

    case 'climbing':
      return {
        label: 'Dénivelé cible',
        placeholder: '2000',
        unit: 'm D+',
        keyboardType: 'numeric',
      }

    default:
      return null
  }
}
