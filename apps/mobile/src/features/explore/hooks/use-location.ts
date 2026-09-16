import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'

import type { RoutePoint } from '../domain'

function toRoutePoint(position: Location.LocationObject): RoutePoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    elevationMeters: position.coords.altitude,
  }
}

/**
 * The rider's position, asked for as soon as the screen opens.
 *
 * There used to be a hardcoded point in Lyon standing in as the start, and the
 * screen proposed routes from it. Routing needs *a* start, but a made-up one is
 * worse than none: a rider in Lille was shown Lyon loops that looked like real
 * proposals, and nothing on the screen said where they began.
 *
 * The position is fetched in two steps rather than one. `getLastKnownPosition`
 * answers instantly from the system's cache without waking the GPS, so a start
 * is available immediately; `getCurrentPositionAsync` then refines it. Waiting
 * for a cold fix would leave the screen empty for seconds, and a cached position
 * alone can be hours old.
 *
 * A refusal is not silent: the message says what to do, and the request stays
 * callable so the rider can change their mind.
 */
export function useCurrentRouteStart() {
  const [start, setStart] = useState<RoutePoint | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Guards the mount effect against React 19's double invocation in
  // development, which would ask for the position twice.
  const hasAsked = useRef(false)

  const requestCurrentLocation = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('La position est disponible dans la development build native.')
      return null
    }

    setIsRequesting(true)
    setError(null)

    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      setHasPermission(permission.granted)

      if (!permission.granted) {
        setError('Autorise la localisation pour que GRADNT propose un départ près de chez toi.')
        return null
      }

      const lastKnown = await Location.getLastKnownPositionAsync()

      if (lastKnown) {
        setStart(toRoutePoint(lastKnown))
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      })

      const nextStart = toRoutePoint(position)
      setStart(nextStart)
      return nextStart
    } catch {
      setError("Ta position n'a pas pu être obtenue. Réessaie dans un instant.")
      return null
    } finally {
      setIsRequesting(false)
    }
  }, [])

  useEffect(() => {
    if (hasAsked.current) {
      return
    }

    hasAsked.current = true
    void requestCurrentLocation()
  }, [requestCurrentLocation])

  return {
    start,
    isRequesting,
    hasPermission,
    error,
    requestCurrentLocation,
    hasStart: start !== null,
  }
}
