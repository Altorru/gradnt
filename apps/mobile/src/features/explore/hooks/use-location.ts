import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Linking, Platform } from 'react-native'

import type { RoutePoint } from '../domain'

function toRoutePoint(position: Location.LocationObject): RoutePoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    elevationMeters: position.coords.altitude,
  }
}

export type LocationStatus =
  /** Never asked, or asking. */
  | 'idle'
  | 'granted'
  /** Refused, but the system will ask again — the button can retry. */
  | 'refused'
  /** Refused for good, or location is off: only Settings can change it. */
  | 'blocked'

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
 * Three refusals are distinguished because they need three different actions:
 * granting is the rider's to give, a denial the system will re-ask can simply
 * be retried, and a permanent denial — or location switched off for the whole
 * device — can only be changed in Settings. Asking again in the last case does
 * nothing at all, which is what made the old flow feel broken.
 */
export function useCurrentRouteStart() {
  const [start, setStart] = useState<RoutePoint | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [status, setStatus] = useState<LocationStatus>('idle')
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
      // Off at the device level: no permission dialog would even appear.
      if (!(await Location.hasServicesEnabledAsync())) {
        setStatus('blocked')
        setError('La localisation est désactivée sur ton téléphone.')
        return null
      }

      const existing = await Location.getForegroundPermissionsAsync()

      // Asked already, and the system will not ask again — retrying is a no-op,
      // so the only way forward is Settings.
      if (!existing.granted && !existing.canAskAgain) {
        setStatus('blocked')
        setError('La localisation est refusée. Autorise-la dans les réglages.')
        return null
      }

      const permission = existing.granted
        ? existing
        : await Location.requestForegroundPermissionsAsync()

      if (!permission.granted) {
        setStatus(permission.canAskAgain ? 'refused' : 'blocked')
        setError('Autorise la localisation pour que GRADNT propose un départ près de chez toi.')
        return null
      }

      setStatus('granted')

      // A cached point first: instant, and no GPS spin-up.
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

  /** The only thing that can help when the status is `blocked`. */
  const openSettings = useCallback(async () => {
    if (Platform.OS === 'web') {
      return
    }

    await Linking.openSettings()
  }, [])

  useEffect(() => {
    if (hasAsked.current) {
      return
    }

    hasAsked.current = true
    void requestCurrentLocation()
  }, [requestCurrentLocation])

  /**
   * Follow the rider as they move, rather than reading their position once.
   *
   * Only while they ask for it: a watcher keeps the GPS awake, and a rider
   * reading a route does not need to be tracked to the metre. It is also what
   * makes the location control mean something — pressing it recentres the map
   * on the rider and keeps it there.
   */
  const [isFollowing, setIsFollowing] = useState(false)

  const followCurrentLocation = useCallback(async () => {
    const position = await requestCurrentLocation()

    if (position !== null) {
      setIsFollowing(true)
    }

    return position
  }, [requestCurrentLocation])

  const stopFollowing = useCallback(() => {
    setIsFollowing(false)
  }, [])

  useEffect(() => {
    if (!isFollowing || Platform.OS === 'web') {
      return
    }

    let subscription: Location.LocationSubscription | null = null
    let cancelled = false

    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync()

      if (!permission.granted || cancelled) {
        return
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.LocationAccuracy.Balanced,
          // A rider moves at tens of metres a second at most; waking the radio
          // on every metre would cost battery for nothing visible.
          distanceInterval: 10,
        },
        (position) => setStart(toRoutePoint(position)),
      )
    })()

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [isFollowing])

  return {
    start,
    isRequesting,
    status,
    error,
    isFollowing,
    requestCurrentLocation,
    followCurrentLocation,
    stopFollowing,
    openSettings,
    hasStart: start !== null,
  }
}
