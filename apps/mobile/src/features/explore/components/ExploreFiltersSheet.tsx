import { BottomSheet, Column, Host, Picker, Row, Slider, Switch, Text } from '@expo/ui'
import { GradntChip, useThemeColor } from '@/design-system'

import {
  routeModeSchema,
  surfacePreferenceSchema,
  trainingIntentSchema,
  type RoutePreferences,
} from '../domain'

type ExploreFiltersSheetProps = {
  isOpen: boolean
  preferences: RoutePreferences
  onChange: (update: Partial<RoutePreferences>) => void
  onClose: () => void
}

/** Slider bounds. Distance and elevation are the two the rider thinks in. */
const DISTANCE_KM = { min: 20, max: 200, step: 10 }
const ELEVATION_M = { min: 0, max: 2000, step: 100 }

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

/**
 * The filters, as native controls in a native sheet.
 *
 * Chips became selects and sliders because three presets cannot express "137
 * km", and six rows of chips is what made the screen long. Everything here is
 * `@expo/ui`, so it is a real SwiftUI / Compose control on each platform rather
 * than a lookalike — the cost is that the sheet is styled by the platform, not
 * by the design system, which is the trade native controls always carry.
 *
 * **A limit worth knowing.** Only the discipline, the distance and the start
 * point are sent to the routing service. Elevation, surface, intent and quiet
 * roads reorder the three routes that come back; they do not change their
 * shape. Moving the elevation slider therefore changes the ranking, not the
 * traces — a property of the engine, not a fault to hide.
 */
export function ExploreFiltersSheet({
  isOpen,
  preferences,
  onChange,
  onClose,
}: ExploreFiltersSheetProps) {
  const themeColor = useThemeColor()

  return (
    <Host>
      <BottomSheet
        isPresented={isOpen}
        onDismiss={onClose}
        showDragIndicator
        snapPoints={['half', 'full']}
        containerColor={themeColor('backgroundElevated')}
        contentColor={themeColor('textPrimary')}
      >
        <Column spacing={18}>
          <Text textStyle={{ fontSize: 17, fontWeight: '600' }}>Filtres</Text>

          <Row spacing={12} alignment="center">
            <Text>Discipline</Text>
            <Picker
              appearance="menu"
              selectedValue={preferences.mode}
              onValueChange={(mode) => onChange({ mode })}
            >
              {routeModeSchema.options.map((mode) => (
                <Picker.Item key={mode} label={MODE_LABELS[mode]} value={mode} />
              ))}
            </Picker>
          </Row>

          <Text>{`Distance · ${preferences.targetDistanceKm} km`}</Text>
          <Slider
            value={preferences.targetDistanceKm}
            onValueChange={(targetDistanceKm) => onChange({ targetDistanceKm })}
            min={DISTANCE_KM.min}
            max={DISTANCE_KM.max}
            step={DISTANCE_KM.step}
          />

          <Text>{`Dénivelé · ${preferences.targetElevationGainMeters} m`}</Text>
          <Slider
            value={preferences.targetElevationGainMeters}
            onValueChange={(targetElevationGainMeters) => onChange({ targetElevationGainMeters })}
            min={ELEVATION_M.min}
            max={ELEVATION_M.max}
            step={ELEVATION_M.step}
          />

          <Row spacing={12} alignment="center">
            <Text>Surface</Text>
            <Picker
              appearance="menu"
              selectedValue={preferences.surfacePreference}
              onValueChange={(surfacePreference) => onChange({ surfacePreference })}
            >
              {surfacePreferenceSchema.options.map((surface) => (
                <Picker.Item key={surface} label={SURFACE_LABELS[surface]} value={surface} />
              ))}
            </Picker>
          </Row>

          <Row spacing={12} alignment="center">
            <Text>Intention</Text>
            <Picker
              appearance="menu"
              selectedValue={preferences.trainingIntent}
              onValueChange={(trainingIntent) =>
                onChange({ trainingIntent, plannedWorkoutIntent: trainingIntent })
              }
            >
              {trainingIntentSchema.options.map((intent) => (
                <Picker.Item key={intent} label={INTENT_LABELS[intent]} value={intent} />
              ))}
            </Picker>
          </Row>

          <Switch
            label="Voies calmes"
            value={preferences.lowTraffic}
            onValueChange={(lowTraffic) => onChange({ lowTraffic })}
          />
        </Column>
      </BottomSheet>
    </Host>
  )
}

/**
 * The compact control that opens the sheet, carrying the current values.
 *
 * Built from the design system rather than `@expo/ui`, because it floats over
 * the map beside our own chrome and a platform-styled pill would sit oddly next
 * to it. The controls inside the sheet are the ones worth being native.
 */
export function FilterSummary({
  preferences,
  onPress,
}: {
  preferences: RoutePreferences
  onPress: () => void
}) {
  return (
    <GradntChip
      label={`Filtres · ${MODE_LABELS[preferences.mode]} · ${preferences.targetDistanceKm} km`}
      onPress={onPress}
    />
  )
}
