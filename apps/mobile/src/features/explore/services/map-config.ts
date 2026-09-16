import type { StyleSpecification } from '@maplibre/maplibre-react-native'
import type { ColorSchemeName } from 'react-native'

/** OpenFreeMap's light style — the one the app has always drawn with. */
const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

/** Its dark counterpart. */
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

/**
 * The style the map draws with, following the app's appearance.
 *
 * The tiles cover more of the Explore screen than anything the theme paints, so
 * a bright map under a dark UI is the largest surface on the screen arguing
 * with the rest of it — and it was the last one still doing so, now that the
 * controls over it are glass and the chrome around it follows the theme.
 *
 * Light keeps `liberty`, which is what the app shipped in both appearances
 * before this: only the dark case changes.
 *
 * `EXPO_PUBLIC_MAP_STYLE_URL` wins over both. It exists to point the app at a
 * different tile host, and a host serves one appearance — so an override is a
 * whole style, not a pair. It is still localised: the URL picks the host, the
 * rewrite below handles the labels.
 *
 * Anything other than an explicit `light` is dark, which is the same rule
 * `GradntThemeProvider` applies.
 */
export function openFreeMapStyleUrl(scheme: ColorSchemeName): string {
  return (
    process.env.EXPO_PUBLIC_MAP_STYLE_URL?.trim() || (scheme === 'light' ? LIGHT_STYLE : DARK_STYLE)
  )
}

/**
 * The device's language, as the runtime reports it.
 *
 * `Intl` is the system's own answer, needs no permission and no native module.
 * Guarded because it is not guaranteed on every engine — and a map in the
 * style's own language is a far smaller failure than a map that does not draw.
 */
export function systemLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return 'en'
  }
}

/**
 * The languages to prefer for labels, most specific first.
 *
 * A script subtag is kept when the locale carries one, because `name:zh-Hant`
 * and `name:zh` are different words for the same city and the tiles hold both.
 * Two letters is a language; four in title case is a script.
 */
export function mapLanguageCandidates(locale: string): string[] {
  const [language, ...rest] = locale.split('-').filter(Boolean)

  if (!language) {
    return []
  }

  const primary = language.toLowerCase()
  const script = rest.find((part) => /^[A-Z][a-z]{3}$/.test(part))

  return script ? [`${primary}-${script}`, primary] : [primary]
}

/**
 * Wraps one label expression so it prefers the rider's language.
 *
 * The style's own expression stays the innermost fallback, so a label with no
 * translation reads exactly as it does today. This is the standard
 * localisation recipe, and it cannot make a label worse than it already is.
 */
function preferLanguage(expression: unknown, languages: string[]): unknown {
  return languages.reduceRight<unknown>(
    (fallback, language) => [
      'case',
      ['has', `name:${language}`],
      ['get', `name:${language}`],
      fallback,
    ],
    expression,
  )
}

function localizeNode(node: unknown, languages: string[]): unknown {
  if (Array.isArray(node)) {
    return node.map((child) => localizeNode(child, languages))
  }

  if (node === null || typeof node !== 'object') {
    return node
  }

  const localized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    // Only a layer that labels a *name*. A motorway shield reads `ref`, and a
    // road has no translated number: wrapping it would put the road's name on a
    // sign that exists to show its number.
    localized[key] =
      key === 'text-field' && JSON.stringify(value)?.includes('"name')
        ? preferLanguage(value, languages)
        : localizeNode(value, languages)
  }

  return localized
}

/**
 * Rewrites every label in a style into the rider's language.
 *
 * The tiles carry the whole language set — `name:fr`, `name:ja`, `name:zh-Hant`
 * and eighty more — but the style only ever reads `name:latin` or `name:en`, so
 * a French map calls München "Munich". The names were always there; nothing was
 * asking for them.
 */
export function localizeMapStyle(
  style: StyleSpecification,
  languages: string[],
): StyleSpecification {
  if (languages.length === 0) {
    return style
  }

  return localizeNode(style, languages) as StyleSpecification
}
