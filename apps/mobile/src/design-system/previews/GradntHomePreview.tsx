import { Bell, Settings } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import {
  GradntBottomNav,
  GradntChip,
  GradntGoalCard,
  GradntHeading,
  GradntIconButton,
  GradntProgressRing,
  GradntScreen,
  GradntScrollView,
  GradntSectionHeader,
  GradntStatTile,
  GradntText,
  GradntWordmark,
  GradntWorkoutCard,
} from '@/design-system'

export function GradntHomePreview() {
  return (
    <GradntScreen>
      <YStack flex={1}>
        <GradntScrollView fadingEdgeLength={0}>
          <YStack gap="$7">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntWordmark />

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
                <GradntStatTile label="Volume 7 j" value="8.4" unit="h" delta={2.1} />

                <GradntStatTile label="Sorties 7 j" value="4" delta={-1} />
              </XStack>

              <XStack gap="$3">
                <GradntStatTile label="Distance 7 j" value="312" unit="km" delta={48} />

                <GradntStatTile label="FTP" value="185" unit="W" delta={5} />
              </XStack>
            </YStack>

            <YStack gap="$4">
              <GradntSectionHeader title="Prochaine étape" action="Voir" />
              <GradntWorkoutCard
                day="VENDREDI 12 AVR."
                title="Sweet Spot"
                duration="1 h 15"
                intensity="3 × 12 min · 88–94 % FTP"
                actionLabel="Voir la séance"
              />
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

                  <GradntText color="$accentInk" weight="semibold" fontSize={13}>
                    FTP estimée
                  </GradntText>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </GradntScrollView>

        <GradntBottomNav />
      </YStack>
    </GradntScreen>
  )
}
