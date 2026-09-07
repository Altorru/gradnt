import type { ComponentProps } from 'react'
import * as Haptics from 'expo-haptics'
import { Button } from 'tamagui'

type GradntButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger'

type TamaguiButtonProps = ComponentProps<typeof Button>

type GradntButtonProps = Omit<TamaguiButtonProps, 'variant'> & {
  tone?: GradntButtonTone
  haptic?: boolean
}

export function GradntButton({
  tone = 'primary',
  haptic = true,
  onPress,
  ...props
}: GradntButtonProps) {
  const toneProps: Partial<TamaguiButtonProps> =
    tone === 'primary'
      ? {
          backgroundColor: '$accent',
          color: '$onAccent',
          borderColor: '$accent',
        }
      : tone === 'secondary'
        ? {
            backgroundColor: '$backgroundElevated',
            color: '$color',
            borderColor: '$border',
          }
        : tone === 'ghost'
          ? {
              backgroundColor: 'transparent',
              color: '$color',
              borderColor: '$border',
            }
          : {
              backgroundColor: '$danger',
              color: '$color',
              borderColor: '$danger',
            }

  return (
    <Button
      minHeight={52}
      borderWidth={1}
      borderRadius="$4"
      pressStyle={{
        scale: 0.97,
        opacity: 0.9,
      }}
      {...toneProps}
      onPress={(event) => {
        if (haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }

        onPress?.(event)
      }}
      {...props}
    />
  )
}
