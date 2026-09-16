import { Platform, Pressable, ScrollView } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'

import { GradntButton, GradntCard, GradntText, SCREEN_GUTTER } from '@/design-system'
import { defaultRoutePreferences, type RoutePreferences } from '@/features/explore/domain'
import { RouteDetailPanel } from '@/features/explore/components'
import { ExploreMap } from '@/features/explore/components/ExploreMap'
import {
  ExploreFiltersSheet,
  FilterSummary,
} from '@/features/explore/components/ExploreFiltersSheet'
import { LocationButton } from '@/features/explore/components/LocationButton'
import { RouteResultStrip } from '@/features/explore/components/RouteResultStrip'
import {
  isRealRoutingConfigured,
  useCurrentRouteStart,
  useRouteProposalsQuery,
} from '@/features/explore/hooks'

import { AppShell } from '../components/AppShell'

export function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [preferences, setPreferences] = useState<RoutePreferences>(defaultRoutePreferences)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const routingConfigured = isRealRoutingConfigured()
  const routeStart = useCurrentRouteStart()
  const proposalsQuery = useRouteProposalsQuery(preferences, routeStart.start)
  const proposals = proposalsQuery.data ?? []

  // The chosen route, or the best one while nothing is chosen — so the strip has
  // something to say as soon as proposals arrive.
  const selectedRoute =
    proposals.find((route) => route.id === selectedRouteId) ?? proposals[0] ?? null

  // The tab bar owns the bottom of the screen on iOS and content runs under it,
  // so the strip is lifted clear by the same clearance the scroll container uses
  // elsewhere. Android already receives a bottom inset from the navigator.
  const bottomClearance = Platform.OS === 'ios' ? SCREEN_GUTTER + insets.bottom : SCREEN_GUTTER

  function updatePreferences(update: Partial<RoutePreferences>) {
    setSelectedRouteId(null)
    setIsDetailOpen(false)
    // New proposals mean the rider is looking at routes again, not at
    // themselves.
    routeStart.stopFollowing()
    setPreferences((current) => ({ ...current, ...update }))
  }

  return (
    <AppShell>
      <YStack flex={1}>
        <ExploreMap
          routes={proposals}
          selectedRouteId={selectedRoute?.id ?? null}
          start={routeStart.start}
          followUser={routeStart.isFollowing}
        />

        {/* Floating over the map, so the map is the screen rather than a block
            in a column. */}
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          padding="$3"
          gap="$2"
          pointerEvents="box-none"
        >
          <FilterSummary preferences={preferences} onPress={() => setIsFiltersOpen(true)} />

          {!routingConfigured ? (
            <GradntCard padding="$3">
              <GradntText muted fontSize={12} lineHeight={18}>
                Le calcul d’itinéraire n’est pas configuré : GRADNT n’affiche rien plutôt que des
                parcours inventés.
              </GradntText>
            </GradntCard>
          ) : null}

          {routingConfigured && !routeStart.hasStart ? (
            <GradntCard padding="$3">
              <GradntText muted fontSize={12} lineHeight={18}>
                {routeStart.error ?? 'Recherche de ta position…'}
              </GradntText>
            </GradntCard>
          ) : null}

          {proposalsQuery.isError ? (
            <GradntCard padding="$3" gap="$2">
              <GradntText color="$danger" fontSize={12} lineHeight={18}>
                Impossible de charger les parcours.
              </GradntText>
              <GradntButton tone="secondary" onPress={() => void proposalsQuery.refetch()}>
                Réessayer
              </GradntButton>
            </GradntCard>
          ) : null}
        </YStack>

        {/* Tapping anywhere else closes the detail. */}
        {isDetailOpen && selectedRoute ? (
          <Pressable
            accessibilityLabel="Fermer le détail"
            onPress={() => setIsDetailOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : null}

        {/* The detail rises from the foot of the screen.
            Hand-rolled rather than `@expo/ui`'s BottomSheet: the content is the
            existing detail panel, and hosting a long React Native view inside a
            native sheet needs a bridge for no gain. Native controls earn that
            bridge; a scroll container does not. */}
        <YStack
          position="absolute"
          left={0}
          right={0}
          bottom={0}
          padding="$3"
          gap="$2"
          style={{ paddingBottom: bottomClearance }}
          pointerEvents="box-none"
        >
          {/* Above the strip rather than beside it: stacked in the same column,
              the button sits directly on top of it at any strip height, with no
              offset guessed from a hardcoded size. It steps aside for the detail
              panel, which is a reading state rather than a map one. */}
          {!isDetailOpen && routingConfigured ? (
            <YStack alignSelf="flex-end">
              <LocationButton
                isRequesting={routeStart.isRequesting}
                needsSettings={routeStart.status === 'blocked'}
                onPress={() => {
                  if (routeStart.status === 'blocked') {
                    void routeStart.openSettings()
                    return
                  }

                  void routeStart.followCurrentLocation()
                }}
              />
            </YStack>
          ) : null}

          {isDetailOpen && selectedRoute ? (
            <YStack
              maxHeight={520}
              backgroundColor="$backgroundElevated"
              borderRadius="$5"
              borderWidth={1}
              borderColor="$border"
              overflow="hidden"
            >
              <ScrollView contentContainerStyle={{ padding: SCREEN_GUTTER }}>
                <RouteDetailPanel route={selectedRoute} onClose={() => setIsDetailOpen(false)} />
              </ScrollView>
            </YStack>
          ) : selectedRoute ? (
            <RouteResultStrip
              route={selectedRoute}
              alternatives={proposals}
              onSelect={(routeId) => {
                setSelectedRouteId(routeId)
                // Choosing a route means looking at it, not at where you are.
                routeStart.stopFollowing()
              }}
              onOpenDetail={() => setIsDetailOpen(true)}
            />
          ) : proposalsQuery.isPending && routeStart.hasStart ? (
            <GradntCard padding="$4">
              <XStack alignItems="center" justifyContent="center">
                <GradntText muted>Recherche de parcours…</GradntText>
              </XStack>
            </GradntCard>
          ) : null}
        </YStack>
      </YStack>

      <ExploreFiltersSheet
        isOpen={isFiltersOpen}
        preferences={preferences}
        onChange={updatePreferences}
        onClose={() => setIsFiltersOpen(false)}
      />
    </AppShell>
  )
}
