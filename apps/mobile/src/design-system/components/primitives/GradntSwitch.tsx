import { Switch } from 'react-native'
import { XStack } from 'tamagui'

import { useThemeColor } from '../../hooks/useThemeColor'
import { GradntText } from './GradntText'

type GradntSwitchProps = {
  label: string
  value: boolean
  onValueChange: (value: boolean) => void
}

/**
 * A boolean, as a switch.
 *
 * Not `GradntChip`: that one carries `role="radio"`, which tells a screen
 * reader the control is one of a set. This is not a set, it is on or off.
 */
export function GradntSwitch({ label, value, onValueChange }: GradntSwitchProps) {
  const color = useThemeColor()

  return (
    <XStack justifyContent="space-between" alignItems="center" gap="$3">
      <GradntText fontSize={15}>{label}</GradntText>

      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: color('accent'), false: color('border') }}
      />
    </XStack>
  )
}
