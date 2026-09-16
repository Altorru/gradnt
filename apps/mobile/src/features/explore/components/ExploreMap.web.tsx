import { YStack } from 'tamagui'

import { GradntText } from '@/design-system'

import type { Route, RoutePoint } from '../domain'
import { RouteMap } from './RouteMap'

type ExploreMapProps = {
  routes: Route[]
  selectedRouteId: string | null
  /** The rider's position, when it is known. */
  start: RoutePoint | null
}

/**
 * The web stand-in for the map.
 *
 * There is no map on this platform — MapLibre is native only, and the web
 * "map" in this project has always been a schematic projection of a route's
 * coordinates. Pretending otherwise would mean shipping a blank square where a
 * map should be, so this says what it is instead.
 *
 * `start` is taken but unused: it exists to keep both variants on one prop
 * contract, so the screen does not have to care which one it is rendering.
 */
export function ExploreMap({ routes, selectedRouteId }: ExploreMapProps) {
  const selectedRoute = routes.find((route) => route.id === selectedRouteId)

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
      {selectedRoute ? (
        <RouteMap route={selectedRoute} />
      ) : (
        <GradntText muted textAlign="center" fontSize={13} lineHeight={19}>
          {routes.length > 0
            ? 'Touche un parcours pour en voir le tracé.'
            : 'La carte nécessite la version native de l’application.'}
        </GradntText>
      )}

      <GradntText muted textAlign="center" fontSize={11} lineHeight={16}>
        Aperçu web schématique. La carte réelle s’affiche sur iOS et Android.
      </GradntText>
    </YStack>
  )
}
