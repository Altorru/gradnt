import { describe, expect, it } from 'vitest'

import { localizeMapStyle } from './map-config'

const label = ['coalesce', ['get', 'name:en'], ['get', 'name']]

function styleWith(textField: unknown) {
  return {
    version: 8,
    sources: {},
    layers: [{ id: 'place', type: 'symbol', 'text-field': textField }],
  }
}

describe('localizeMapStyle', () => {
  it('prefers the language and keeps the style expression as the fallback', () => {
    const style = localizeMapStyle(styleWith(label) as never, ['fr'])

    expect(style.layers[0]).toMatchObject({
      'text-field': ['case', ['has', 'name:fr'], ['get', 'name:fr'], label],
    })
  })

  it('chains the candidates from least to most specific', () => {
    const style = localizeMapStyle(styleWith(label) as never, ['zh-Hant', 'zh'])

    expect(style.layers[0]).toMatchObject({
      'text-field': [
        'case',
        ['has', 'name:zh-Hant'],
        ['get', 'name:zh-Hant'],
        ['case', ['has', 'name:zh'], ['get', 'name:zh'], label],
      ],
    })
  })

  it('leaves a shield alone, because a road number has no translation', () => {
    // Wrapping this would print the road's name on a sign that exists to show
    // its number — the motorway shield is the one layer that must not move.
    const shield = ['to-string', ['get', 'ref']]
    const style = localizeMapStyle(styleWith(shield) as never, ['fr'])

    expect(style.layers[0]).toMatchObject({ 'text-field': shield })
  })

  it('returns the style untouched when there is no language to prefer', () => {
    const original = styleWith(label)

    expect(localizeMapStyle(original as never, [])).toBe(original)
  })
})
