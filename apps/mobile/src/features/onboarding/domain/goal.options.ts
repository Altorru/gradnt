import { CalendarDays, Gauge, Mountain, Route, TrendingUp } from '@tamagui/lucide-icons-2'

import type { Translate } from '@/i18n'

import type { CyclistGoalForm } from './goal.schema'

type GoalType = CyclistGoalForm['type']
type GoalMeasure = NonNullable<CyclistGoalForm['measure']>

type GoalChoice = {
  value: GoalType
  title: string
  description: string
  icon: typeof Route
}

type MeasureChoice = { value: GoalMeasure; label: string; description: string }

/**
 * What each goal type means, and how the rider picks it.
 *
 * Shared between the onboarding step and the settings editor rather than owned
 * by one of them: the two present it differently — a guided step with room for
 * explanation, a compact edit — but "what does 'mieux grimper' mean" is one
 * answer, and it should not drift between the two places that say it.
 *
 * A function of `t`: a domain module has no hook, and these are sentences.
 */
export function goalTypes(t: Translate): GoalChoice[] {
  return [
    {
      value: 'ftp',
      title: t('onboarding.goals.ftp.title'),
      description: t('onboarding.goals.ftp.description'),
      icon: Gauge,
    },
    {
      value: 'distance',
      title: t('onboarding.goals.distance.title'),
      description: t('onboarding.goals.distance.description'),
      icon: Route,
    },
    {
      value: 'event',
      title: t('onboarding.goals.event.title'),
      description: t('onboarding.goals.event.description'),
      icon: CalendarDays,
    },
    {
      value: 'climbing',
      title: t('onboarding.goals.climbing.title'),
      description: t('onboarding.goals.climbing.description'),
      icon: Mountain,
    },
    {
      value: 'fitness',
      title: t('onboarding.goals.fitness.title'),
      description: t('onboarding.goals.fitness.description'),
      icon: TrendingUp,
    },
  ]
}

/** The short form of each goal, for rows with no room for the full title. */
export function goalTypeLabels(t: Translate): Record<GoalType, string> {
  return {
    ftp: t('onboarding.goalLabels.ftp'),
    distance: t('onboarding.goalLabels.distance'),
    event: t('onboarding.goalLabels.event'),
    climbing: t('onboarding.goalLabels.climbing'),
    fitness: t('onboarding.goalLabels.fitness'),
  }
}

/**
 * How a distance or climbing target is read.
 *
 * "500 km" means a season to one rider and a single long day to another. The
 * app assumed the running total, which silently made a one-day target
 * unreachable rather than wrong-looking.
 */
export function goalMeasures(t: Translate): MeasureChoice[] {
  return [
    {
      value: 'cumulative',
      label: t('onboarding.measures.cumulative.label'),
      description: t('onboarding.measures.cumulative.description'),
    },
    {
      value: 'best',
      label: t('onboarding.measures.best.label'),
      description: t('onboarding.measures.best.description'),
    },
  ]
}

/**
 * The numeric target a goal type asks for, or null for the types that carry no
 * figure — an event has a name, "progresser globalement" has nothing.
 *
 * The placeholder stays a figure: 280 is 280 in either language.
 */
export function getTargetMeta(
  type: GoalType,
  t: Translate,
): { label: string; placeholder: string; unit: string; keyboardType: 'numeric' } | null {
  switch (type) {
    case 'ftp':
      return {
        label: t('onboarding.target.ftp.label'),
        placeholder: '280',
        unit: t('onboarding.target.ftp.unit'),
        keyboardType: 'numeric',
      }

    case 'distance':
      return {
        label: t('onboarding.target.distance.label'),
        placeholder: '150',
        unit: t('onboarding.target.distance.unit'),
        keyboardType: 'numeric',
      }

    case 'climbing':
      return {
        label: t('onboarding.target.climbing.label'),
        placeholder: '2000',
        unit: t('onboarding.target.climbing.unit'),
        keyboardType: 'numeric',
      }

    default:
      return null
  }
}
