import { LocateFixed, Settings } from '@tamagui/lucide-icons-2'
import { ActivityIndicator, Pressable } from 'react-native'
import { YStack } from 'tamagui'

type LocationButtonProps = {
  isRequesting: boolean
  /** True when only Settings can change the outcome — a retry would do nothing. */
  needsSettings: boolean
  onPress: () => void
}

/**
 * The conventional floating control for "where am I".
 *
 * A crosshair, in the corner it lives in on every map application — a rider
 * already knows what it does, which is the whole point of using the conventional
 * icon rather than an expressive one.
 *
 * It changes to a settings glyph when a retry would be pointless: once the
 * permission is refused for good, or location is switched off for the device, a
 * location button that silently does nothing is worse than one that says where
 * to fix it.
 */
export function LocationButton({ isRequesting, needsSettings, onPress }: LocationButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={needsSettings ? 'Ouvrir les réglages' : 'Actualiser ma position'}
      accessibilityState={{ busy: isRequesting }}
      disabled={isRequesting}
      onPress={onPress}
    >
      {({ pressed }) => (
        <YStack
          width={44}
          height={44}
          borderRadius="$pill"
          alignItems="center"
          justifyContent="center"
          backgroundColor="$backgroundElevated"
          borderWidth={1}
          borderColor="$border"
          opacity={pressed || isRequesting ? 0.6 : 1}
          // Lifts the control off the map, where a flat disc would sink into the
          // tiles. Elevation is enough on Android; iOS needs the shadow.
          boxShadow="0 2px 8px rgba(0,0,0,0.22)"
          elevation={3}
        >
          {isRequesting ? (
            <ActivityIndicator size="small" />
          ) : needsSettings ? (
            <Settings size={20} color="$textPrimary" />
          ) : (
            <LocateFixed size={20} color="$textPrimary" />
          )}
        </YStack>
      )}
    </Pressable>
  )
}
