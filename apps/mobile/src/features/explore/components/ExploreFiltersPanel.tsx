import { ChevronDown } from '@tamagui/lucide-icons-2'
import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntHeading,
  GradntIconButton,
  GradntOptionList,
  GradntRangeSlider,
  GradntText,
} from '@/design-system'

import {
  routeModeSchema,
  surfacePreferenceSchema,
  trainingIntentSchema,
  type RoutePreferences,
} from '../domain'

type ExploreFiltersPanelProps = {
  preferences: RoutePreferences
  onChange: (update: Partial<RoutePreferences>) => void
  onClose: () => void
}

/**
 * The bounds a span is chosen inside.
 *
 * The distance ceiling is 180, not 200, because the engine is asked for the
 * middle of the span — and it refuses anything over 100 km. At 180 the widest
 * span asks for exactly 100; at 200 it would ask for 110 and fail.
 */
const DISTANCE_KM = { bounds: { min: 20, max: 180 }, step: 10 }
const ELEVATION_M = { bounds: { min: 0, max: 2000 }, step: 100 }

const MODE_LABELS = { road: 'Route', gravel: 'Gravel', mtb: 'VTT' } as const
const SURFACE_LABELS = {
  none: 'Sans préférence',
  paved: 'Asphalte',
  mixed: 'Mixte',
  gravel: 'Gravier',
  trail: 'Sentier',
} as const
const INTENT_LABELS = {
  none: 'Sans préférence',
  endurance: 'Endurance',
  recovery: 'Récupération',
  climbing: 'Dénivelé',
  tempo: 'Tempo',
} as const

/** A pill in the bar. Carries its own value, so the state reads at a glance. */
function FilterPill({
  label,
  isDefault,
  onPress,
}: {
  label: string
  /** Dimmed when the value is the one nobody chose. */
  isDefault?: boolean
  onPress: () => void
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}>
      {({ pressed }) => (
        <XStack
          alignItems="center"
          gap="$1"
          paddingHorizontal="$3"
          paddingVertical="$2"
          borderRadius="$pill"
          borderWidth={1}
          borderColor="$border"
          backgroundColor="$backgroundElevated"
          opacity={pressed ? 0.7 : 1}
        >
          <GradntText
            color={isDefault ? '$textSecondary' : '$color'}
            weight="semibold"
            fontSize={13}
          >
            {label}
          </GradntText>

          <ChevronDown size={14} color="$textSecondary" />
        </XStack>
      )}
    </Pressable>
  )
}

/**
 * The filter bar, floating over the map.
 *
 * Three pills, each showing the value it holds rather than the name of the
 * setting. That is the whole point: a bar of labels ("Discipline", "Distance")
 * tells a rider nothing without being opened, while a bar of values reads like a
 * summary of what is already chosen.
 *
 * They scroll rather than wrap, so the row never becomes two lines of chrome
 * over the map, and the trailing control holds everything that did not earn a
 * place here.
 */
export function FilterBar({
  preferences,
  onOpen,
}: {
  preferences: RoutePreferences
  onOpen: () => void
}) {
  const { min, max } = preferences.distanceRangeKm
  const hasExtras =
    preferences.surfacePreference !== 'none' ||
    preferences.trainingIntent !== 'none' ||
    !preferences.lowTraffic

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
    >
      <FilterPill label={MODE_LABELS[preferences.mode]} onPress={onOpen} />

      <FilterPill label={`${min}–${max} km`} onPress={onOpen} />

      <FilterPill label={preferences.loop ? 'Boucle' : 'Aller simple'} onPress={onOpen} />

      {/* Dimmed when nothing behind it has been touched, so a rider can tell at
          a glance that the extras are still at their defaults. */}
      <FilterPill
        label={hasExtras ? 'Filtres ·' : 'Filtres'}
        isDefault={!hasExtras}
        onPress={onOpen}
      />
    </ScrollView>
  )
}

/**
 * The filter panel.
 *
 * Seven groups of options stacked made a sheet nobody could take in — and four
 * of them are what a rider actually tunes, while the other three are refinements
 * most rides never touch. The four stay; the three wait behind a disclosure.
 *
 * That is the whole change: not smaller controls, fewer of them at once.
 */
export function ExploreFiltersPanel({ preferences, onChange, onClose }: ExploreFiltersPanelProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <YStack gap="$5">
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <GradntHeading level={3}>Filtres</GradntHeading>

        <GradntIconButton accessibilityLabel="Fermer les filtres" onPress={onClose}>
          <GradntText muted fontSize={14} weight="semibold">
            OK
          </GradntText>
        </GradntIconButton>
      </XStack>

      <GradntOptionList
        label="Discipline"
        value={preferences.mode}
        onChange={(mode) => onChange({ mode })}
        options={routeModeSchema.options.map((mode) => ({
          value: mode,
          label: MODE_LABELS[mode],
        }))}
      />

      <GradntRangeSlider
        label="Distance"
        unit="km"
        value={preferences.distanceRangeKm}
        bounds={DISTANCE_KM.bounds}
        step={DISTANCE_KM.step}
        accessibilityLabel="Fourchette de distance en kilomètres"
        onValueChange={(distanceRangeKm) => onChange({ distanceRangeKm })}
      />

      <GradntRangeSlider
        label="Dénivelé"
        unit="m"
        value={preferences.elevationRangeM}
        bounds={ELEVATION_M.bounds}
        step={ELEVATION_M.step}
        accessibilityLabel="Fourchette de dénivelé en mètres"
        onValueChange={(elevationRangeM) => onChange({ elevationRangeM })}
      />

      <GradntOptionList
        label="Type d'itinéraire"
        value={preferences.loop ? 'loop' : 'oneWay'}
        onChange={(routeType) => onChange({ loop: routeType === 'loop' })}
        options={[
          { value: 'loop', label: 'Boucle' },
          { value: 'oneWay', label: 'Aller simple' },
        ]}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: showMore }}
        accessibilityLabel="Plus de filtres"
        onPress={() => setShowMore((open) => !open)}
      >
        {({ pressed }) => (
          <XStack alignItems="center" gap="$2" opacity={pressed ? 0.6 : 1} paddingVertical="$2">
            <ChevronDown
              size={16}
              color="$textSecondary"
              style={{ transform: [{ rotate: showMore ? '180deg' : '0deg' }] }}
            />

            <GradntText muted weight="semibold" fontSize={13}>
              {showMore ? 'Moins de filtres' : 'Plus de filtres'}
            </GradntText>
          </XStack>
        )}
      </Pressable>

      {showMore ? (
        <YStack gap="$5">
          <GradntOptionList
            label="Surface"
            value={preferences.surfacePreference}
            onChange={(surfacePreference) => onChange({ surfacePreference })}
            options={surfacePreferenceSchema.options.map((surface) => ({
              value: surface,
              label: SURFACE_LABELS[surface],
            }))}
          />

          <GradntOptionList
            label="Intention"
            value={preferences.trainingIntent}
            onChange={(trainingIntent) => onChange({ trainingIntent })}
            options={trainingIntentSchema.options.map((intent) => ({
              value: intent,
              label: INTENT_LABELS[intent],
            }))}
          />

          <GradntOptionList
            label="Type de voies"
            value={preferences.lowTraffic ? 'quiet' : 'any'}
            onChange={(choice) => onChange({ lowTraffic: choice === 'quiet' })}
            options={[
              { value: 'any', label: 'Peu importe' },
              { value: 'quiet', label: 'Plus calmes' },
            ]}
          />
        </YStack>
      ) : null}
    </YStack>
  )
}
