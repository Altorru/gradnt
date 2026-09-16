import { X } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import {
  GradntChip,
  GradntHeading,
  GradntIconButton,
  GradntOptionList,
  GradntRangeSlider,
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

/**
 * The filters, as design-system controls.
 *
 * This was a native sheet of `@expo/ui` controls. They are real SwiftUI and
 * Compose widgets and they behave impeccably, but they carry the platform's
 * typography, spacing and colour — which on a screen already dressed in GRADNT
 * reads as a different application opening on top of this one. Brand coherence
 * won.
 *
 * Choices are columns rather than a wrapping row of chips: the eye runs down one
 * left edge, every option gets a full-width target, and a check says which is on
 * without leaning on colour.
 *
 * **A limit worth knowing.** Only the discipline, the distance, the route type
 * and the start point reach the routing service. Surface, intent and quiet roads
 * reorder what comes back; they do not change its shape. The distance and
 * elevation spans are the exception — those *exclude*, because a span says what
 * a rider will accept rather than what they would like.
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
  )
}

/**
 * The compact control that opens the panel, carrying the current values.
 *
 * Built from the design system rather than `@expo/ui`, because it floats over
 * the map beside our own chrome and a platform-styled pill would sit oddly next
 * to it.
 */
export function FilterSummary({
  preferences,
  onPress,
}: {
  preferences: RoutePreferences
  onPress: () => void
}) {
  const { min, max } = preferences.distanceRangeKm

  return (
    <GradntChip
      label={`Filtres · ${MODE_LABELS[preferences.mode]} · ${min}–${max} km`}
      onPress={onPress}
    />
  )
}
