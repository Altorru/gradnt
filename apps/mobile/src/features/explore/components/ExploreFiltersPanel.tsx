import { X } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import {
  GradntChip,
  GradntHeading,
  GradntIconButton,
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
  paved: 'Asphalte',
  mixed: 'Mixte',
  gravel: 'Gravier',
  trail: 'Sentier',
} as const
const INTENT_LABELS = {
  endurance: 'Endurance',
  recovery: 'Récupération',
  climbing: 'Dénivelé',
  tempo: 'Tempo',
} as const

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <YStack gap="$3">
      <GradntText muted fontSize={11} weight="semibold" letterSpacing={1}>
        {label.toUpperCase()}
      </GradntText>

      <XStack gap="$2" flexWrap="wrap">
        {children}
      </XStack>
    </YStack>
  )
}

/** A chip that behaves as a single choice among its siblings. */
function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return <GradntChip label={label} selected={selected} onPress={onPress} />
}

/**
 * The filters, as design-system controls.
 *
 * This was a native sheet of `@expo/ui` controls. They are real SwiftUI and
 * Compose widgets and they behave impeccably, but they carry the platform's
 * typography, spacing and colour — which on a screen already dressed in GRADNT
 * reads as a different application opening on top of this one. Brand coherence
 * won; the one genuinely missing control, a slider, now exists in the design
 * system rather than being borrowed.
 *
 * Two categorical groups stay as chips because that is what a choice between
 * four named options wants: a row you can read at a glance, not a menu you have
 * to open to discover what is in it.
 *
 * **A limit worth knowing.** Only the discipline, the distance and the start
 * point reach the routing service. Elevation, surface, intent and quiet roads
 * reorder the three routes that come back; they do not change their shape.
 * Moving the elevation slider changes the ranking, not the traces — a property
 * of the engine, not a fault to hide.
 */
export function ExploreFiltersPanel({ preferences, onChange, onClose }: ExploreFiltersPanelProps) {
  return (
    <YStack gap="$5">
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <GradntHeading level={3}>Filtres</GradntHeading>

        <GradntIconButton accessibilityLabel="Fermer les filtres" onPress={onClose}>
          <X size={18} color="$textPrimary" />
        </GradntIconButton>
      </XStack>

      <FilterGroup label="Discipline">
        {routeModeSchema.options.map((mode) => (
          <ChoiceChip
            key={mode}
            label={MODE_LABELS[mode]}
            selected={preferences.mode === mode}
            onPress={() => onChange({ mode })}
          />
        ))}
      </FilterGroup>

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

      <FilterGroup label="Surface">
        {surfacePreferenceSchema.options.map((surface) => (
          <ChoiceChip
            key={surface}
            label={SURFACE_LABELS[surface]}
            selected={preferences.surfacePreference === surface}
            onPress={() => onChange({ surfacePreference: surface })}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Intention">
        {trainingIntentSchema.options.map((intent) => (
          <ChoiceChip
            key={intent}
            label={INTENT_LABELS[intent]}
            selected={preferences.trainingIntent === intent}
            // The workout the plan scheduled and the intent of this ride are the
            // same choice here, so they move together.
            onPress={() => onChange({ trainingIntent: intent, plannedWorkoutIntent: intent })}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Type de voies">
        <ChoiceChip
          label="Plus calmes"
          selected={preferences.lowTraffic}
          onPress={() => onChange({ lowTraffic: !preferences.lowTraffic })}
        />
      </FilterGroup>
    </YStack>
  )
}

/** The compact control that opens the panel, carrying the current values. */
export function FilterSummary({
  preferences,
  onPress,
}: {
  preferences: RoutePreferences
  onPress: () => void
}) {
  return (
    <GradntChip
      label={`Filtres · ${MODE_LABELS[preferences.mode]} · ${preferences.distanceRangeKm.min}–${preferences.distanceRangeKm.max} km`}
      onPress={onPress}
    />
  )
}
