import { Stack } from 'expo-router'

/**
 * Nested stack for the Plan tab.
 *
 * The workout detail opens inside the tab rather than over the whole app, so
 * the tab bar stays visible and returning lands back on the list with its
 * scroll position intact.
 */
export default function PlanLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
