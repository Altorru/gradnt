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
  const isPrimary = tone === 'primary'
  const isSecondary = tone === 'secondary'
  const isGhost = tone === 'ghost'

  return (
    <Button
      minHeight={52}
      borderRadius={16}
      borderWidth={1}
      fontFamily="$body"
      fontWeight="600"
      backgroundColor={
        isPrimary
          ? '$accent'
          : isSecondary
            ? '$backgroundElevated'
            : isGhost
              ? 'transparent'
              : '$danger'
      }
      borderColor={
        isPrimary ? '$accent' : isSecondary ? '$borderStrong' : isGhost ? '$border' : '$danger'
      }
      color={isPrimary ? '$onAccent' : isGhost || isSecondary ? '$color' : '$color'}
      hoverStyle={
        isPrimary
          ? {
              backgroundColor: '$accentHover',
              borderColor: '$accentHover',
            }
          : isSecondary
            ? {
                backgroundColor: '$backgroundSubtle',
                borderColor: '$borderStrong',
              }
            : isGhost
              ? {
                  backgroundColor: '$backgroundElevated',
                  borderColor: '$borderStrong',
                }
              : {
                  opacity: 0.9,
                }
      }
      pressStyle={
        isPrimary
          ? {
              scale: 0.975,
              backgroundColor: '$accentHover',
              borderColor: '$accentHover',
            }
          : isSecondary
            ? {
                scale: 0.975,
                backgroundColor: '$backgroundPress',
                borderColor: '$borderStrong',
              }
            : isGhost
              ? {
                  scale: 0.975,
                  backgroundColor: '$backgroundSubtle',
                }
              : {
                  scale: 0.975,
                  opacity: 0.84,
                }
      }
      focusStyle={{
        borderColor: '$accent',
      }}
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
