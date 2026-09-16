import { Platform, Pressable, ScrollView } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'

import { GradntButton, GradntCard, GradntScreen, GradntText, SCREEN_GUTTER } from '@/design-system'
import { useTranslation, type MessageKey } from '@/i18n'
import { defaultRoutePreferences, type RoutePreferences } from '@/features/explore/domain'
import { FilterBar, RouteDetailPanel, type ExploreFilterKey } from '@/features/explore/components'
import { ExploreMap } from '@/features/explore/components/ExploreMap'
import { LocationButton } from '@/features/explore/components/LocationButton'
import { RouteResultStrip } from '@/features/explore/components/RouteResultStrip'
import {
  isRealRoutingConfigured,
  useCurrentRouteStart,
  useRouteProposalsQuery,
} from '@/features/explore/hooks'

import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { LocationErrorCode } from '@/features/explore/hooks/use-location'

/** Where each reason the position failed lives in the catalogue. */
const LOCATION_ERROR_KEYS: Record<LocationErrorCode, MessageKey> = {
  unsupported: 'explore.location.errors.unsupported',
  disabled: 'explore.location.errors.disabled',
  denied: 'explore.location.errors.denied',
  notGranted: 'explore.location.errors.notGranted',
  unavailable: 'explore.location.errors.unavailable',
}

/** A panel that rises from the foot of the screen, above the tab bar. */
function PanelFrame({ children }: { children: React.ReactNode }) {
  return (
    <YStack
      maxHeight={560}
      backgroundColor="$backgroundElevated"
      borderRadius="$5"
      borderWidth={1}
      borderColor="$border"
      overflow="hidden"
    >
      <ScrollView contentContainerStyle={{ padding: SCREEN_GUTTER }}>{children}</ScrollView>
    </YStack>
  )
}

export function ExploreScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [preferences, setPreferences] = useState<RoutePreferences>(defaultRoutePreferences)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [openFilter, setOpenFilter] = useState<ExploreFilterKey | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const routingConfigured = isRealRoutingConfigured()
  const routeStart = useCurrentRouteStart()
  // The controls render `preferences` immediately; only what reaches the
  // network waits for the drag to settle.
  const settledPreferences = useDebouncedValue(preferences)
  const proposalsQuery = useRouteProposalsQuery(settledPreferences, routeStart.start)
  const proposals = proposalsQuery.data ?? []

  // The chosen route, or the best one while nothing is chosen — so the strip has
  // something to say as soon as proposals arrive.
  const selectedRoute =
    proposals.find((route) => route.id === selectedRouteId) ?? proposals[0] ?? null

  // Both are needed to ask anything: a key to route with, and somewhere to
  // start from.
  const canPropose = routingConfigured && routeStart.hasStart

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

  // The row stays open across a change: a rider who moves the distance thumb
  // wants to see the map answer, not to reopen the row for a second look.
  function toggleFilter(filter: ExploreFilterKey) {
    setOpenFilter((current) => (current === filter ? null : filter))
  }

  return (
    /* No safe-area edge at the top: the map runs under the status bar, which
       is the difference between a screen with a map on it and a screen that
       is a map. The controls inset themselves instead. */
    <GradntScreen padded={false} edges={[]}>
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
          gap="$2"
          style={{ paddingTop: insets.top + 12 }}
          pointerEvents="box-none"
        >
          <FilterBar
            preferences={preferences}
            openFilter={openFilter}
            onToggleFilter={toggleFilter}
            onChange={updatePreferences}
          />

          <YStack paddingHorizontal="$3" gap="$2">
            {!routingConfigured ? (
              <GradntCard padding="$3">
                <GradntText muted fontSize={12} lineHeight={18}>
                  {t('explore.notConfigured')}
                </GradntText>
              </GradntCard>
            ) : null}

            {routingConfigured && !routeStart.hasStart ? (
              <GradntCard padding="$3">
                <GradntText muted fontSize={12} lineHeight={18}>
                  {routeStart.error
                    ? t(LOCATION_ERROR_KEYS[routeStart.error])
                    : t('explore.findingPosition')}
                </GradntText>
              </GradntCard>
            ) : null}

            {proposalsQuery.isError ? (
              <GradntCard padding="$3" gap="$2">
                <GradntText color="$danger" fontSize={12} lineHeight={18}>
                  {t('explore.routesFailed')}
                </GradntText>
                <GradntButton tone="secondary" onPress={() => void proposalsQuery.refetch()}>
                  {t('common.retry')}
                </GradntButton>
              </GradntCard>
            ) : null}
          </YStack>
        </YStack>

        {/* Tapping anywhere else closes the detail. */}
        {isDetailOpen ? (
          <Pressable
            accessibilityLabel={t('common.closePanel')}
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
            <PanelFrame>
              <RouteDetailPanel route={selectedRoute} onClose={() => setIsDetailOpen(false)} />
            </PanelFrame>
          ) : !selectedRoute &&
            canPropose &&
            !proposalsQuery.isPending &&
            !proposalsQuery.isError ? (
            /* Everything the engine returned fell outside the rider's spans.
               Saying so, and offering the way to widen them, beats showing
               routes that answer a question they did not ask. */
            <GradntCard padding="$4" gap="$3">
              <GradntText weight="semibold">{t('explore.noMatchTitle')}</GradntText>

              <GradntText muted fontSize={13} lineHeight={19}>
                {t('explore.noMatchBody')}
              </GradntText>

              <GradntButton tone="secondary" onPress={() => setOpenFilter('distance')}>
                {t('explore.widenDistance')}
              </GradntButton>
            </GradntCard>
          ) : selectedRoute ? (
            <RouteResultStrip
              route={selectedRoute}
              alternatives={proposals}
              onSelect={(routeId) => {
                setSelectedRouteId(routeId)
                // Choosing a route means looking at it, not at where you are.
                routeStart.stopFollowing()
              }}
              onOpenDetail={() => {
                // One thing open at a time: the detail is a reading state, and
                // a filter row left unfolded above it would be two answers to
                // the same tap.
                setOpenFilter(null)
                setIsDetailOpen(true)
              }}
            />
          ) : proposalsQuery.isPending && routeStart.hasStart ? (
            <GradntCard padding="$4">
              <XStack alignItems="center" justifyContent="center">
                <GradntText muted>{t('explore.findingRoutes')}</GradntText>
              </XStack>
            </GradntCard>
          ) : null}
        </YStack>
      </YStack>
    </GradntScreen>
  )
}
