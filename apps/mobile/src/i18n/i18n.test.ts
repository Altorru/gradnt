import { describe, expect, it } from 'vitest'

import { resolveLanguage } from './languages'
import { en } from './messages/en'
import { fr } from './messages/fr'
import { translate, translatePlural, type MessageKey } from './translate'

/** Flattens a catalogue to leaf paths, so parity can be checked in a test too. */
function leaves(catalogue: unknown, prefix = ''): string[] {
  if (typeof catalogue === 'string') {
    return [prefix]
  }

  if (catalogue === null || typeof catalogue !== 'object') {
    return []
  }

  return Object.entries(catalogue as Record<string, unknown>).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  )
}

describe('catalogues', () => {
  it('define exactly the same keys', () => {
    // The type system already enforces this; the test says so out loud and
    // fails with the key names rather than with a compiler error.
    expect(leaves(en).sort()).toEqual(leaves(fr).sort())
  })

  it('have no empty sentence', () => {
    for (const key of leaves(fr)) {
      expect(translate('fr', key as MessageKey).trim(), `fr.${key}`).not.toBe('')
      expect(translate('en', key as MessageKey).trim(), `en.${key}`).not.toBe('')
    }
  })
})

describe('resolveLanguage', () => {
  it('follows the device when the preference is system', () => {
    expect(resolveLanguage('system', 'fr')).toBe('fr')
    expect(resolveLanguage('system', 'en')).toBe('en')
  })

  it('ignores the device once the rider has chosen', () => {
    expect(resolveLanguage('fr', 'en')).toBe('fr')
    expect(resolveLanguage('en', 'fr')).toBe('en')
  })
})

describe('translate', () => {
  it('interpolates what it is given and leaves what it was not', () => {
    expect(translate('en', 'common.openMenu', { label: 'Plan' })).toBe('Open Plan')
    expect(translate('en', 'common.openMenu')).toBe('Open {{label}}')
  })
})

describe('translatePlural', () => {
  it('picks the form the language asks for, not the one English would', () => {
    // French counts zero as singular: "0 sortie", not "0 sorties". A rule read
    // off English — `count > 1` — gets that wrong.
    expect(translatePlural('fr', 'progress.ridesThisWeek', 0)).toBe('0 sortie cette semaine')
    expect(translatePlural('fr', 'progress.ridesThisWeek', 1)).toBe('1 sortie cette semaine')
    expect(translatePlural('fr', 'progress.ridesThisWeek', 3)).toBe('3 sorties cette semaine')

    expect(translatePlural('en', 'progress.ridesThisWeek', 0)).toBe('0 rides this week')
    expect(translatePlural('en', 'progress.ridesThisWeek', 1)).toBe('1 ride this week')
    expect(translatePlural('en', 'progress.ridesThisWeek', 3)).toBe('3 rides this week')
  })
})
