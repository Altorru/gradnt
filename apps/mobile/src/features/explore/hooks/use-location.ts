import * as Location from 'expo-location'
import { useCallback, useState } from 'react'
import { Platform } from 'react-native'

import type { RoutePoint } from '../domain'

/**
 * The rider's position, or null until they grant it.
 *
 * There used to be a hardcoded point in Lyon standing in as the start, and the
 * screen proposed routes from it. Routing needs *a* start, but a made-up one is
 * worse than none: a rider in Lille was shown Lyon loops that looked like real
 * proposals, and nothing on the screen said where they began.
 */
export function useCurrentRouteStart() {
  const [start, setStart] = useState<RoutePoint | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requestCurrentLocation = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('La position est disponible dans la development build native.')
      return null
    }

    setIsRequesting(true)
    setError(null)

    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      const granted = permission.granted
      setHasPermission(granted)

      if (!granted) {
        setError('Autorise la localisation pour que GRADNT propose un départ près de chez toi.')
        return null
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      })

      const nextStart: RoutePoint = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        elevationMeters: position.coords.altitude,
      }

      setStart(nextStart)
      return nextStart
    } catch {
      setError("Ta position n'a pas pu être obtenue. Réessaie dans un instant.")
      return null
    } finally {
      setIsRequesting(false)
    }
  }, [])

  return {
    start,
    isRequesting,
    hasPermission,
    error,
    requestCurrentLocation,
    hasStart: start !== null,
  }
}
