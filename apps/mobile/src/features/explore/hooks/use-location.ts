import * as Location from 'expo-location'
import { useCallback, useState } from 'react'
import { Platform } from 'react-native'

import type { RoutePoint } from '../domain'

export const defaultRouteStart: RoutePoint = {
  latitude: 45.764,
  longitude: 4.835,
  elevationMeters: 171,
}

export function useCurrentRouteStart() {
  const [start, setStart] = useState<RoutePoint>(defaultRouteStart)
  const [isRequesting, setIsRequesting] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requestCurrentLocation = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('La position réelle est disponible dans la development build native.')
      return null
    }

    setIsRequesting(true)
    setError(null)

    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      const granted = permission.granted
      setHasPermission(granted)

      if (!granted) {
        setError('Permission refusée : le départ local de démonstration reste utilisé.')
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
      setError('Position indisponible : le départ local de démonstration reste utilisé.')
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
    isDefaultStart: start === defaultRouteStart,
  }
}
