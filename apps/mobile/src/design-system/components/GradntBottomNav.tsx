import { BarChart3, Bike, House, Map, Target } from '@tamagui/lucide-icons-2'
import { usePathname, useRouter, type Href } from 'expo-router'
import { Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'

import { colors } from '../tokens'
import { GradntText } from './primitives'

const items = [
  {
    label: 'Accueil',
    href: '/' as Href,
    icon: House,
  },
  {
    label: 'Plan',
    href: '/plan' as Href,
    icon: Target,
  },
  {
    label: 'Progrès',
    href: '/progress' as Href,
    icon: BarChart3,
  },
  {
    label: 'Explorer',
    href: '/explore' as Href,
    icon: Map,
  },
  {
    label: 'Garage',
    href: '/garage' as Href,
    icon: Bike,
  },
] as const

export function GradntBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <XStack
      borderTopWidth={1}
      borderColor="$border"
      backgroundColor="$background"
      paddingTop="$2"
      paddingBottom={Math.max(12, insets.bottom)}
      paddingHorizontal="$2"
      justifyContent="space-between"
    >
      {items.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href

        return (
          <Pressable
            key={item.label}
            accessibilityLabel={`Ouvrir ${item.label}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                router.push(item.href)
              }
            }}
            style={{ flex: 1, minHeight: 44 }}
          >
            {({ pressed }) => (
              <YStack
                flex={1}
                alignItems="center"
                justifyContent="center"
                gap="$1"
                opacity={pressed ? 0.72 : 1}
              >
                <Icon size={21} color={active ? colors.lime : colors.stone500} />

                <GradntText
                  color={active ? '$accent' : '$textSecondary'}
                  weight={active ? 'semibold' : 'regular'}
                  fontSize={10}
                  lineHeight={13}
                >
                  {item.label}
                </GradntText>
              </YStack>
            )}
          </Pressable>
        )
      })}
    </XStack>
  )
}
