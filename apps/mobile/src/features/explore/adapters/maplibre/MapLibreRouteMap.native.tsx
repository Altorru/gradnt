import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native'
import type { FeatureCollection, LineString, Point } from 'geojson'
import { YStack } from 'tamagui'

import { GradntText } from '@/design-system'
import { colors } from '@/design-system/tokens'

import type { Route } from '../../domain'
import { openFreeMapStyleUrl } from '../../services'

type RouteMapProps = {
  route: Route
}

function toRouteFeatureCollection(route: Route): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          routeId: route.id,
        },
        geometry: {
          type: 'LineString',
          coordinates: route.geometry.map((point) => [point.longitude, point.latitude]),
        },
      },
    ],
  }
}

function toStartFeatureCollection(route: Route): FeatureCollection<Point> {
  const start = route.geometry[0]

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          routeId: route.id,
          role: 'start',
        },
        geometry: {
          type: 'Point',
          coordinates: [start.longitude, start.latitude],
        },
      },
    ],
  }
}

export function MapLibreRouteMap({ route }: RouteMapProps) {
  const longitudes = route.geometry.map((point) => point.longitude)
  const latitudes = route.geometry.map((point) => point.latitude)
  const routeBounds: [number, number, number, number] = [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ]
  const routeData = toRouteFeatureCollection(route)
  const startData = toStartFeatureCollection(route)

  return (
    <YStack
      height={220}
      borderRadius="$4"
      overflow="hidden"
      backgroundColor="$backgroundSubtle"
      borderWidth={1}
      borderColor="$border"
    >
      <Map style={{ flex: 1 }} mapStyle={openFreeMapStyleUrl} attribution logo compass scaleBar>
        <Camera
          initialViewState={{
            bounds: routeBounds,
            padding: { top: 28, right: 28, bottom: 28, left: 28 },
          }}
        />
        <GeoJSONSource id="gradnt-route" data={routeData}>
          <Layer
            id="gradnt-route-line"
            type="line"
            source="gradnt-route"
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': colors.lime,
              'line-width': 4,
              'line-opacity': 0.95,
            }}
          />
        </GeoJSONSource>
        <GeoJSONSource id="gradnt-route-start" data={startData}>
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
      </Map>
      <YStack
        position="absolute"
        left={10}
        bottom={10}
        backgroundColor="$backgroundElevated"
        paddingHorizontal="$2"
        paddingVertical="$1"
        borderRadius="$2"
      >
        <GradntText muted fontSize={10}>
          Parcours sélectionné · OpenFreeMap · MapLibre · HeiGIT
        </GradntText>
      </YStack>
    </YStack>
  )
}
