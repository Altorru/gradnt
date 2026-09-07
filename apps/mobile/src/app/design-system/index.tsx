import { Bell, Settings } from '@tamagui/lucide-icons-2'
import { ScrollView } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntBottomNav,
  GradntChip,
  GradntGoalCard,
  GradntHeading,
  GradntIconButton,
  GradntMobileShell,
  GradntProgressRing,
  GradntSectionHeader,
  GradntStatusCard,
  GradntText,
  GradntWorkoutCard,
} from '@/design-system'

export default function DesignSystemScreen() {
  return (
    <GradntMobileShell>
      <YStack flex={1}>
        <ScrollView
          style={{ flex: 1 }}
          fadingEdgeLength={0}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 28,
          }}
        >
          <YStack gap="$7">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap="$2">
                <GradntText color="$accent" weight="bold" fontSize={17}>
                  ▲
                </GradntText>

                <GradntText weight="bold" fontSize={18} letterSpacing={0.4}>
                  GRADNT
                </GradntText>
              </XStack>

              <XStack gap="$2">
                <GradntIconButton>
                  <Bell size={18} />
                </GradntIconButton>

                <GradntIconButton>
                  <Settings size={18} />
                </GradntIconButton>
              </XStack>
            </XStack>

            <YStack gap="$1">
              <GradntHeading>Bonjour Hugo</GradntHeading>

              <GradntText muted>Où tu en es aujourd&apos;hui ?</GradntText>
            </YStack>

            <GradntGoalCard />

            <YStack gap="$4">
              <GradntSectionHeader title="Ton état" action="Voir plus" />

              <XStack gap="$3">
                <GradntStatusCard label="Forme" value="78 ↗" detail="Bonne" accent />

                <GradntStatusCard
                  label="Charge"
                  value="Modérée"
                  detail="Stable"
                  visual={
                    <XStack alignItems="flex-end" gap={4} marginTop="$3">
                      {[20, 35, 58, 32, 46].map((height, index) => (
                        <YStack
                          key={index}
                          width={7}
                          height={height}
                          borderRadius={3}
                          backgroundColor={index < 3 ? '$accent' : '$backgroundSubtle'}
                        />
                      ))}
                    </XStack>
                  }
                />
              </XStack>
            </YStack>

            <YStack gap="$4">
              <GradntSectionHeader title="Prochaine étape" action="Voir" />

              <GradntWorkoutCard />
            </YStack>

            <YStack gap="$4">
              <GradntSectionHeader title="Intensités" action="Voir toutes" />

              <XStack gap="$2" flexWrap="wrap">
                <GradntChip label="Endurance" selected />

                <GradntChip label="Tempo" />
                <GradntChip label="Seuil" />
                <GradntChip label="VO₂ Max" />
              </XStack>
            </YStack>

            <YStack gap="$4">
              <GradntSectionHeader title="Progression" />

              <XStack alignItems="center" justifyContent="space-around">
                <GradntProgressRing value={78} />

                <YStack gap="$2">
                  <GradntText muted fontSize={12}>
                    Derniers 30 jours
                  </GradntText>

                  <GradntText weight="bold" fontSize={26}>
                    +6 W
                  </GradntText>

                  <GradntText color="$accent" weight="semibold" fontSize={13}>
                    FTP estimée
                  </GradntText>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </ScrollView>

        <GradntBottomNav />
      </YStack>
    </GradntMobileShell>
  )
}
