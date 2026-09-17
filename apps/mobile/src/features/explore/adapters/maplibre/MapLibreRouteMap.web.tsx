import Svg, { Circle, Polyline } from 'react-native-svg'
import { YStack } from 'tamagui'

import { GradntText } from '@/design-system'
import { useTranslation } from '@/i18n'
import { colors } from '@/design-system/tokens'

import type { Route } from '../../domain'

type RouteMapProps = {
  route: Route
}

export function MapLibreRouteMap({ route }: RouteMapProps) {
  const { t } = useTranslation()
  const width = 320
  const height = 220
  const longitudes = route.geometry.map((point) => point.longitude)
  const latitudes = route.geometry.map((point) => point.latitude)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const longitudeRange = maxLongitude - minLongitude || 1
  const latitudeRange = maxLatitude - minLatitude || 1
  const points = route.geometry
    .map((point) => {
      const x = 18 + ((point.longitude - minLongitude) / longitudeRange) * (width - 36)
      const y = height - 18 - ((point.latitude - minLatitude) / latitudeRange) * (height - 36)
      return `${x},${y}`
    })
    .join(' ')
  const firstPoint = points.split(' ')[0]?.split(',') ?? ['18', `${height - 18}`]

  return (
    <YStack gap="$2">
      <YStack
        height={height}
        borderRadius="$4"
        overflow="hidden"
        backgroundColor="$backgroundSubtle"
        borderWidth={1}
        borderColor="$border"
      >
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Polyline
            points={points}
            fill="none"
            stroke={colors.alpine}
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.12}
          />
          <Polyline
            points={points}
            fill="none"
            stroke={colors.alpine}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={Number(firstPoint[0])} cy={Number(firstPoint[1])} r={6} fill={colors.lime} />
        </Svg>
      </YStack>
      <GradntText muted fontSize={11}>
        {t('explore.map.schematic')}
      </GradntText>
    </YStack>
  )
}
