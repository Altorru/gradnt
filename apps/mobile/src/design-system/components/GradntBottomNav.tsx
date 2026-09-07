import { BarChart3, Bike, House, Map, Target } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { colors } from '../tokens'
import { GradntText } from './primitives'

const items = [
  {
    label: 'Accueil',
    icon: House,
    active: true,
  },
  {
    label: 'Plan',
    icon: Target,
  },
  {
    label: 'Progrès',
    icon: BarChart3,
  },
  {
    label: 'Explorer',
    icon: Map,
  },
  {
    label: 'Garage',
    icon: Bike,
  },
]

export function GradntBottomNav() {
  return (
    <XStack
      borderTopWidth={1}
      borderColor="$border"
      backgroundColor="$background"
      paddingTop="$3"
      paddingBottom="$3"
      paddingHorizontal="$3"
      justifyContent="space-between"
    >
      {items.map((item) => {
        const Icon = item.icon

        return (
          <YStack key={item.label} alignItems="center" gap="$1" width={68}>
            <Icon size={21} color={item.active ? colors.lime : colors.stone500} />

            <GradntText
              color={item.active ? '$accent' : '$textSecondary'}
              weight={item.active ? 'semibold' : 'regular'}
              fontSize={10}
              lineHeight={13}
            >
              {item.label}
            </GradntText>
          </YStack>
        )
      })}
    </XStack>
  )
}
