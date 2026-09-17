import type { Translate } from '@/i18n'
import type { Goal } from '@/lib/domain/schemas'

/**
 * The unit as a symbol.
 *
 * Symbols, not words: a watt is `W` and a kilometre is `km` in both languages,
 * so they belong next to the codes rather than in the catalogue.
 */
const UNIT_SYMBOLS = {
  w: 'W',
  km: 'km',
  m: 'm',
  h: 'h',
  none: '',
} as const satisfies Record<Goal['targetUnit'], string>

/** The unit as a symbol, for the places that show a bare figure. */
export function goalUnitSymbol(unit: Goal['targetUnit']): string {
  return UNIT_SYMBOLS[unit]
}

/** The card's own heading for the goal, in the rider's language. */
export function goalEyebrow(t: Translate): string {
  return t('home.goalEyebrow')
}

/** The short name of a goal, for the card's title. */
export function goalTypeLabel(t: Translate, type: Goal['type']): string {
  return t(`home.goalTypes.${type}`)
}

/** What is being aimed at, or the fact that nothing is yet. */
export function goalTargetLabel(t: Translate, goal: Goal | null): string {
  if (goal === null || goal.targetValue === null) {
    return t('home.goalToPrecise')
  }

  const unit = UNIT_SYMBOLS[goal.targetUnit]

  return t('home.goalTarget', {
    value: unit === '' ? `${goal.targetValue}` : `${goal.targetValue} ${unit}`,
  })
}
