import type { StyleSpecification } from '@maplibre/maplibre-react-native'
import { useQuery } from '@tanstack/react-query'

import { useGradntScheme } from '@/design-system'
import { useAppLanguage } from '@/i18n'

import { localizeMapStyle, openFreeMapStyleUrl } from '../services'

/**
 * The style the map draws with: the right appearance, in the rider's language.
 *
 * The language cannot be asked of the native map. The library exposes the
 * camera, the feature queries and `setSourceVisibility`, and nothing that
 * reaches a layer of the basemap — so the style is fetched here, its labels
 * rewritten, and the object handed over instead of the URL. It is 43 KB, and
 * TanStack Query keeps it for the life of the app.
 *
 * The language follows the app's, not the phone's: a rider who forced English
 * does not want a French map under an English screen.
 *
 * A failure is deliberately not fatal: until the style arrives, and if it never
 * does, the map draws from the URL with the labels the style ships. A blank map
 * is a poor trade for a translated one.
 */
export function useMapStyle(): string | StyleSpecification {
  const scheme = useGradntScheme()
  const language = useAppLanguage()
  const url = openFreeMapStyleUrl(scheme)

  const { data } = useQuery({
    queryKey: ['map-style', url, language],
    queryFn: async () => {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Map style ${response.status}`)
      }

      return localizeMapStyle((await response.json()) as StyleSpecification, [language])
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return data ?? url
}
