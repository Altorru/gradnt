import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons-2'
import { ScrollView, View } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { XStack, YStack } from 'tamagui'

import {
  GradntGlassSurface,
  GradntRangeSlider,
  GradntText,
  radius,
  useThemeColor,
} from '@/design-system'

import { useTranslation, type Translate } from '@/i18n'

import {
  defaultRoutePreferences,
  routeModeSchema,
  surfacePreferenceSchema,
  trainingIntentSchema,
  type RoutePreferences,
} from '../domain'

/**
 * The bounds a span is chosen inside.
 *
 * The distance ceiling is 180, not 200, because the engine is asked for the
 * middle of the span — and it refuses anything over 100 km. At 180 the widest
 * span asks for exactly 100; at 200 it would ask for 110 and fail.
 */
const DISTANCE_KM = { bounds: { min: 20, max: 180 }, step: 10 }
const ELEVATION_M = { bounds: { min: 0, max: 2000 }, step: 100 }

/**
 * The words for each choice, built from `t`.
 *
 * The three discipline names are the onboarding ones: it is the same question,
 * and a rider who chose "Route" there should not meet a different word here.
 */
function modeLabels(t: Translate) {
  return {
    road: t('onboarding.disciplines.road.title'),
    gravel: t('onboarding.disciplines.gravel.title'),
    mtb: t('onboarding.disciplines.mtb.title'),
  }
}

function surfaceLabels(t: Translate) {
  return {
    none: t('explore.filters.noPreference'),
    paved: t('explore.surfaces.paved'),
    mixed: t('explore.surfaces.mixed'),
    gravel: t('explore.surfaces.gravel'),
    trail: t('explore.surfaces.trail'),
  }
}

function intentLabels(t: Translate) {
  return {
    none: t('explore.filters.noPreference'),
    endurance: t('explore.intents.endurance'),
    recovery: t('explore.intents.recovery'),
    climbing: t('explore.intents.climbing'),
    tempo: t('explore.intents.tempo'),
  }
}

/** The filters, in the order the bar shows them. */
const FILTERS = [
  'mode',
  'distance',
  'elevation',
  'routeType',
  'surface',
  'intent',
  'traffic',
] as const

export type ExploreFilterKey = (typeof FILTERS)[number]

function routeTypeOptions(t: Translate) {
  return [
    { value: 'loop' as const, label: t('explore.filters.loop') },
    { value: 'oneWay' as const, label: t('explore.filters.oneWay') },
  ]
}

function trafficOptions(t: Translate) {
  return [
    { value: 'any' as const, label: t('explore.filters.anyRoad') },
    { value: 'quiet' as const, label: t('explore.filters.quieter') },
  ]
}

/**
 * What the bar says for a filter, and whether that value is still the one
 * nobody chose.
 *
 * A filter with no value of its own says the name of its setting ("Surface")
 * and dims, because there is nothing to report yet. Once it has one, the value
 * is the pill — a bar of values reads as a summary of the ride, which is the
 * whole point of it.
 */
function summaryOf(filter: ExploreFilterKey, preferences: RoutePreferences, t: Translate) {
  const fallback = defaultRoutePreferences

  switch (filter) {
    case 'mode':
      return {
        label: modeLabels(t)[preferences.mode],
        isDefault: preferences.mode === fallback.mode,
      }
    case 'distance': {
      const { min, max } = preferences.distanceRangeKm

      return {
        label: `${min}–${max} km`,
        isDefault: min === fallback.distanceRangeKm.min && max === fallback.distanceRangeKm.max,
      }
    }
    case 'elevation': {
      const { min, max } = preferences.elevationRangeM

      return {
        label: `D+ ${min}–${max} m`,
        isDefault: min === fallback.elevationRangeM.min && max === fallback.elevationRangeM.max,
      }
    }
    case 'routeType':
      return {
        label: preferences.loop ? t('explore.filters.loop') : t('explore.filters.oneWay'),
        isDefault: preferences.loop === fallback.loop,
      }
    case 'surface':
      return preferences.surfacePreference === 'none'
        ? { label: t('explore.filters.surface'), isDefault: true }
        : { label: surfaceLabels(t)[preferences.surfacePreference], isDefault: false }
    case 'intent':
      return preferences.trainingIntent === 'none'
        ? { label: t('explore.filters.intent'), isDefault: true }
        : { label: intentLabels(t)[preferences.trainingIntent], isDefault: false }
    case 'traffic':
      return preferences.lowTraffic
        ? { label: t('explore.filters.quietRoads'), isDefault: true }
        : { label: t('explore.filters.allRoads'), isDefault: false }
  }
}

/** A pill in the bar. Carries its own value, so the state reads at a glance. */
function FilterPill({
  label,
  isDefault,
  isOpen,
  onPress,
}: {
  label: string
  /** Dimmed when the value is the one nobody chose. */
  isDefault?: boolean
  isOpen: boolean
  onPress: () => void
}) {
  const accent = useThemeColor()('accent')

  return (
    <GradntGlassSurface
      borderRadius="pill"
      // An open filter is carrying the screen, so it says so in colour rather
      // than only in a chevron that has to be read to be noticed.
      tintColor={isOpen ? accent : undefined}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ expanded: isOpen }}
    >
      <XStack alignItems="center" gap="$1" paddingHorizontal="$3" paddingVertical="$2">
        <GradntText
          // The open one reads as the active one, the same way a chosen option
          // does inside it.
          color={isOpen ? '$onAccent' : isDefault ? '$textSecondary' : '$color'}
          weight="semibold"
          fontSize={13}
        >
          {label}
        </GradntText>

        {/* Two glyphs, not one turned through 180°. A rotation is only as
            reliable as the glyph's own orientation and as the transform being
            applied where it lands — neither of which can be seen from this
            file. A chevron drawn pointing down cannot end up pointing right. */}
        <Animated.View key={isOpen ? 'up' : 'down'} entering={ZoomIn.springify().damping(15)}>
          {isOpen ? (
            <ChevronUp size={14} color="$onAccent" />
          ) : (
            <ChevronDown size={14} color="$textSecondary" />
          )}
        </Animated.View>
      </XStack>
    </GradntGlassSurface>
  )
}

/** One value, in the row that unfolds under the bar. */
function OptionPill({
  label,
  isSelected,
  onPress,
}: {
  label: string
  isSelected: boolean
  onPress: () => void
}) {
  const accent = useThemeColor()('accent')

  return (
    <GradntGlassSurface
      borderRadius="pill"
      tintColor={isSelected ? accent : undefined}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
    >
      <XStack alignItems="center" gap="$1" paddingHorizontal="$3" paddingVertical="$2">
        {/* The check stays alongside the fill: colour alone is not a state a
            rider with a colour deficiency can read. */}
        {isSelected ? <Check size={13} color="$onAccent" /> : null}

        <GradntText color={isSelected ? '$onAccent' : '$color'} weight="semibold" fontSize={13}>
          {label}
        </GradntText>
      </XStack>
    </GradntGlassSurface>
  )
}

/**
 * A set of choices, wrapping rather than scrolling.
 *
 * The bar above already scrolls; a second scrolling row under it would be two
 * horizontal gestures stacked on the same thumb, and the one you meant is never
 * the one you get. Wrapping shows every option at once, which is what a short
 * list of words wants anyway.
 *
 * Nothing here is animated, and that is not an oversight. A Reanimated view
 * wrapped around a `GlassView` costs the glass entirely on iOS: the effect is
 * built in `layoutSubviews` and lost for good the moment the view leaves its
 * window, which is exactly what an entering animation does to it. The row
 * arrives, it just does not spring — the alternative is arriving without a
 * surface at all.
 */
function OptionRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <XStack flexWrap="wrap" gap="$2">
      {options.map((option) => (
        <OptionPill
          key={option.value}
          label={option.label}
          isSelected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </XStack>
  )
}

/** The control a filter needs: pills for a choice, a slider for a span. */
function FilterRow({
  filter,
  preferences,
  onChange,
  t,
}: {
  filter: ExploreFilterKey
  preferences: RoutePreferences
  onChange: (update: Partial<RoutePreferences>) => void
  t: Translate
}) {
  switch (filter) {
    case 'mode':
      return (
        <OptionRow
          value={preferences.mode}
          onChange={(mode) => onChange({ mode })}
          options={routeModeSchema.options.map((mode) => ({
            value: mode,
            label: modeLabels(t)[mode],
          }))}
        />
      )
    /* A span is one control rather than a set of choices, so its row is one
       surface instead of several — but it is a surface all the same. Left bare
       it floated on the map, and the row read as though it had failed to load.
       A panel radius, not the pills': at a slider's height a full stadium stops
       looking like the pills above it and starts looking like a mistake. */
    case 'distance':
      return (
        <GradntGlassSurface borderRadius={radius[5]} style={{ padding: 16 }}>
          <GradntRangeSlider
            unit="km"
            value={preferences.distanceRangeKm}
            caption={t('explore.filters.rangeBetween', {
              label: t('explore.filters.distance'),
              min: preferences.distanceRangeKm.min,
              max: preferences.distanceRangeKm.max,
              unit: 'km',
            })}
            bounds={DISTANCE_KM.bounds}
            step={DISTANCE_KM.step}
            accessibilityLabel={t('explore.filters.distanceRange')}
            onValueChange={(distanceRangeKm) => onChange({ distanceRangeKm })}
          />
        </GradntGlassSurface>
      )
    case 'elevation':
      return (
        <GradntGlassSurface borderRadius={radius[5]} style={{ padding: 16 }}>
          <GradntRangeSlider
            unit="m"
            value={preferences.elevationRangeM}
            caption={t('explore.filters.rangeBetween', {
              label: t('explore.filters.elevation'),
              min: preferences.elevationRangeM.min,
              max: preferences.elevationRangeM.max,
              unit: 'm',
            })}
            bounds={ELEVATION_M.bounds}
            step={ELEVATION_M.step}
            accessibilityLabel={t('explore.filters.elevationRange')}
            onValueChange={(elevationRangeM) => onChange({ elevationRangeM })}
          />
        </GradntGlassSurface>
      )
    case 'routeType':
      return (
        <OptionRow
          value={preferences.loop ? 'loop' : 'oneWay'}
          onChange={(routeType) => onChange({ loop: routeType === 'loop' })}
          options={routeTypeOptions(t)}
        />
      )
    case 'surface':
      return (
        <OptionRow
          value={preferences.surfacePreference}
          onChange={(surfacePreference) => onChange({ surfacePreference })}
          options={surfacePreferenceSchema.options.map((surface) => ({
            value: surface,
            label: surfaceLabels(t)[surface],
          }))}
        />
      )
    case 'intent':
      return (
        <OptionRow
          value={preferences.trainingIntent}
          onChange={(trainingIntent) => onChange({ trainingIntent })}
          options={trainingIntentSchema.options.map((intent) => ({
            value: intent,
            label: intentLabels(t)[intent],
          }))}
        />
      )
    case 'traffic':
      return (
        <OptionRow
          value={preferences.lowTraffic ? 'quiet' : 'any'}
          onChange={(choice) => onChange({ lowTraffic: choice === 'quiet' })}
          options={trafficOptions(t)}
        />
      )
  }
}

/**
 * The filter bar, floating over the map.
 *
 * Every filter is a pill carrying the value it holds, and opening one unfolds
 * its choices directly underneath. That replaced a sheet holding all of them:
 * a sheet is a second screen for a decision that belongs on the map, and it
 * covered the routes being filtered. Unfolded in place, the map stays visible
 * and the value just chosen is still there in the bar above.
 *
 * One row at a time. A second opened filter would be a stack of chrome growing
 * down the screen, and a rider is tuning one thing at a time anyway.
 *
 * The controls are the same ones the sheet used — nothing was rebuilt to move
 * them here.
 */
export function FilterBar({
  preferences,
  openFilter,
  onToggleFilter,
  onChange,
}: {
  preferences: RoutePreferences
  openFilter: ExploreFilterKey | null
  onToggleFilter: (filter: ExploreFilterKey) => void
  onChange: (update: Partial<RoutePreferences>) => void
}) {
  const { t } = useTranslation()

  return (
    <YStack>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {FILTERS.map((filter) => {
          const { label, isDefault } = summaryOf(filter, preferences, t)

          return (
            <FilterPill
              key={filter}
              label={label}
              isDefault={isDefault}
              isOpen={openFilter === filter}
              onPress={() => onToggleFilter(filter)}
            />
          )
        })}
      </ScrollView>

      {openFilter ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <FilterRow filter={openFilter} preferences={preferences} onChange={onChange} t={t} />
        </View>
      ) : null}
    </YStack>
  )
}
