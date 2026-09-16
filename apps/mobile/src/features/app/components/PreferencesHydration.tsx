import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import { usePreferencesStore } from '../store/preferences.store'

/**
 * Reads the stored preferences before anything renders from them.
 *
 * Mounted outside the theme provider, so the first paint already knows which
 * theme it is: hydrating inside it would show the system's theme for a frame
 * and then swap, which reads as the app changing its mind on launch.
 */
export function PreferencesHydration({ children }: PropsWithChildren) {
  const hydrate = usePreferencesStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return children
}
