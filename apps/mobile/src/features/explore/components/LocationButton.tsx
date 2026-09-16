import { LocateFixed, LocateOff } from '@tamagui/lucide-icons-2'
import { ActivityIndicator } from 'react-native'

import { GradntGlassSurface } from '@/design-system'

type LocationButtonProps = {
  isRequesting: boolean
  /** True when only Settings can change the outcome — a retry would do nothing. */
  needsSettings: boolean
  onPress: () => void
}

const SIZE = 44

/**
 * The conventional floating control for "where am I".
 *
 * A crosshair, in the corner every map application puts it — a rider already
 * knows what it does, which is the whole point of using the conventional glyph
 * rather than an expressive one.
 *
 * When a retry would be pointless it becomes `LocateOff` — still a location
 * symbol, so the control keeps saying what it is about, with the slash saying
 * the location is unavailable. It used to become a gear, which named the fix
 * instead of the subject and read as a settings button that had wandered onto
 * the map.
 *
 * The surface is Liquid Glass where the system has it, so the map shows through
 * the control rather than being hidden behind an opaque disc.
 */
export function LocationButton({ isRequesting, needsSettings, onPress }: LocationButtonProps) {
  return (
    <GradntGlassSurface
      borderRadius={SIZE / 2}
      // Lifts the control off the map. The glass carries its own depth on iOS;
      // this is what the fallback platform needs.
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
      onPress={onPress}
      accessibilityLabel={needsSettings ? 'Ouvrir les réglages' : 'Actualiser ma position'}
      accessibilityState={{ busy: isRequesting }}
      disabled={isRequesting}
    >
      {isRequesting ? (
        <ActivityIndicator size="small" />
      ) : needsSettings ? (
        <LocateOff size={20} color="$textPrimary" />
      ) : (
        <LocateFixed size={20} color="$textPrimary" />
      )}
    </GradntGlassSurface>
  )
}
