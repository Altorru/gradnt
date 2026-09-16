import { Bike, Mountain, Route } from '@tamagui/lucide-icons-2'

import type { Translate } from '@/i18n'

import type { CyclistProfileForm } from './profile.schema'

type Discipline = CyclistProfileForm['discipline']
type Experience = CyclistProfileForm['experience']
type WeeklyVolume = CyclistProfileForm['weeklyVolume']

type DisciplineChoice = {
  value: Discipline
  title: string
  description: string
  icon: typeof Route
}

type ProfileChoice<T extends string> = { value: T; label: string }

/**
 * What each answer means, and how the rider picks it.
 *
 * Shared between the onboarding step and the settings editor: the two present
 * it differently — a guided step with room to explain, a compact edit — but
 * "what counts as gravel" is one answer and should not drift between them.
 *
 * A function of `t` rather than a constant. A domain module has no hook to
 * call, and the label has to follow the language like every other sentence, so
 * the translator is handed in by whoever renders the list.
 */
export function disciplines(t: Translate): DisciplineChoice[] {
  return [
    {
      value: 'road',
      title: t('onboarding.disciplines.road.title'),
      description: t('onboarding.disciplines.road.description'),
      icon: Route,
    },
    {
      value: 'gravel',
      title: t('onboarding.disciplines.gravel.title'),
      description: t('onboarding.disciplines.gravel.description'),
      icon: Bike,
    },
    {
      value: 'mtb',
      title: t('onboarding.disciplines.mtb.title'),
      description: t('onboarding.disciplines.mtb.description'),
      icon: Mountain,
    },
  ]
}

export function experiences(t: Translate): ProfileChoice<Experience>[] {
  return [
    { value: 'beginner', label: t('onboarding.experiences.beginner') },
    { value: 'regular', label: t('onboarding.experiences.regular') },
    { value: 'advanced', label: t('onboarding.experiences.advanced') },
  ]
}

export function volumes(t: Translate): ProfileChoice<WeeklyVolume>[] {
  return [
    { value: 'lt3', label: t('onboarding.volumes.lt3') },
    { value: '3to6', label: t('onboarding.volumes.threeToSix') },
    { value: '6to10', label: t('onboarding.volumes.sixToTen') },
    { value: 'gt10', label: t('onboarding.volumes.gt10') },
  ]
}

/**
 * Reads a label off an option list, tolerating the `label` / `title` split.
 *
 * Exported so a screen that has to show one answer out of context — the review
 * step — reads it from the same list the rider chose from, rather than keeping
 * a second copy of the words.
 */
export function labelOf<T extends string>(
  options: readonly { value: T; label?: string; title?: string }[],
  value: T,
): string {
  const option = options.find((candidate) => candidate.value === value)

  return option?.label ?? option?.title ?? value
}

/** One line summarising the profile, for the settings row. */
export function describeProfile(profile: CyclistProfileForm | null, t: Translate): string {
  if (profile === null) {
    return t('settings.notSet')
  }

  return [
    labelOf(disciplines(t), profile.discipline),
    labelOf(experiences(t), profile.experience),
    labelOf(volumes(t), profile.weeklyVolume),
  ].join(' · ')
}
