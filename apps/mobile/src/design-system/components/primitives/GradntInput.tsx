import type { ComponentProps } from 'react'
import { Input } from 'tamagui'

export type GradntInputProps = ComponentProps<typeof Input>

export function GradntInput(props: GradntInputProps) {
  return (
    <Input
      minHeight={52}
      paddingHorizontal="$4"
      borderRadius={16}
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$backgroundElevated"
      color="$color"
      fontFamily="$body"
      fontSize={15}
      placeholderTextColor="$textSecondary"
      hoverStyle={{
        borderColor: '$borderStrong',
        backgroundColor: '$backgroundSubtle',
      }}
      focusStyle={{
        borderColor: '$accent',
        backgroundColor: '$backgroundElevated',
      }}
      {...props}
    />
  )
}
