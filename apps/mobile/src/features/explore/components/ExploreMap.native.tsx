import { Camera, GeoJSONSource, Layer, Map, UserLocation } from '@maplibre/maplibre-react-native'
import type { FeatureCollection, LineString, Point } from 'geojson'

import { colors } from '@/design-system/tokens'

import type { Route, RoutePoint } from '../domain'
import { openFreeMapStyleUrl } from '../services'

type ExploreMapProps = {
  routes: Route[]
  selectedRouteId: string | null
  /** The rider's position, when it is known. */
  start: RoutePoint | null
  /**
   * Frame the rider rather than the route.
   *
   * The camera followed the selected route unconditionally, and a route is
   * almost always selected — so pressing "where am I" updated the position and
   * moved nothing at all.
   */
  followUser?: boolean
}

/**
 * Room for the controls that float over the map.
 *
 * The top clears the status bar and the filter bar over it; the bottom clears
 * the result strip. A route fitted flush to either edge would be hidden behind
 * the chrome that floats there.
 */
const VIEWPORT_PADDING = { top: 132, right: 48, bottom: 260, left: 48 }

/** Sources are named per route, so several can share one map. */
function routeSourceId(routeId: string) {
  return `gradnt-route-${routeId}`
}

function toLine(route: Route): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { routeId: route.id },
        geometry: {
          type: 'LineString',
          coordinates: route.geometry.map((point) => [point.longitude, point.latitude]),
        },
      },
    ],
  }
}

function toStartPoint(route: Route): FeatureCollection<Point> {
  const start = route.geometry[0]

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { routeId: route.id },
        geometry: { type: 'Point', coordinates: [start.longitude, start.latitude] },
      },
    ],
  }
}

function boundsOf(route: Route): [number, number, number, number] {
  const longitudes = route.geometry.map((point) => point.longitude)
  const latitudes = route.geometry.map((point) => point.latitude)

  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ]
}

/**
 * The map, as the screen rather than an illustration in a card.
 *
 * It draws every proposal at once and highlights the selected one. The earlier
 * map took a single route and hardcoded its source ids, so a second instance
 * would have collided with the first — this names each source after its route.
 *
 * The camera frames what the rider is looking at: the selected route, or their
 * own position when nothing is selected. Passing one or the other rather than
 * both keeps the camera from reconciling two instructions at once.
 */
export function ExploreMap({
  routes,
  selectedRouteId,
  start,
  followUser = false,
}: ExploreMapProps) {
  const selectedRoute = routes.find((route) => route.id === selectedRouteId)

  return (
    <Map style={{ flex: 1 }} mapStyle={openFreeMapStyleUrl} attribution logo compass>
      {followUser && start ? (
        <Camera center={[start.longitude, start.latitude]} zoom={14} duration={650} />
      ) : selectedRoute ? (
        <Camera bounds={boundsOf(selectedRoute)} padding={VIEWPORT_PADDING} duration={650} />
      ) : start ? (
        <Camera center={[start.longitude, start.latitude]} zoom={12} duration={650} />
      ) : null}

      {/* Draw the unselected first, so the selected line ends up on top. */}
      {[...routes]
        .sort((left, right) =>
          left.id === selectedRouteId ? 1 : right.id === selectedRouteId ? -1 : 0,
        )
        .map((route) => {
          const selected = route.id === selectedRouteId
          const sourceId = routeSourceId(route.id)

          return (
            <GeoJSONSource key={sourceId} id={sourceId} data={toLine(route)}>
              <Layer
                id={`${sourceId}-line`}
                type="line"
                source={sourceId}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': selected ? colors.lime : colors.stone500,
                  'line-width': selected ? 5 : 3,
                  'line-opacity': selected ? 1 : 0.55,
                }}
              />
            </GeoJSONSource>
          )
        })}

      {selectedRoute ? (
        <GeoJSONSource id="gradnt-route-start" data={toStartPoint(selectedRoute)}>
          <Layer
            id="gradnt-route-start-point"
            type="circle"
            source="gradnt-route-start"
            paint={{
              'circle-color': colors.lime,
              'circle-radius': 6,
              'circle-stroke-color': colors.graphite900,
              'circle-stroke-width': 2,
            }}
          />
        </GeoJSONSource>
      ) : null}

      <UserLocation animated />
    </Map>
  )
}
