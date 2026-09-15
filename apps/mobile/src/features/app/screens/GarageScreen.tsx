import { Bike, CircleHelp, Wrench } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntBadge, GradntButton, GradntCard, GradntText } from '@/design-system'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

export function GarageScreen() {
  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro
            title="Garage"
            description="Garde une trace de ton matériel et de ce qui mérite ton attention."
          />

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <Bike size={21} color="$accentInk" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Ton vélo principal</GradntText>
                <GradntText muted fontSize={13}>
                  Aucun vélo ajouté pour le moment
                </GradntText>
              </YStack>
              <GradntBadge>Beta</GradntBadge>
            </XStack>
            <GradntButton tone="secondary">Ajouter un vélo</GradntButton>
          </GradntCard>

          <GradntCard padding="$4" gap="$4">
            <XStack alignItems="center" gap="$3">
              <Wrench size={19} color="$recovery" />
              <GradntText weight="semibold">Maintenance</GradntText>
            </XStack>
            <GradntText muted lineHeight={20}>
              Associe ton matériel à tes sorties et note les entretiens importants quand le Garage
              sera activé.
            </GradntText>
          </GradntCard>

          <GradntCard padding="$4" gap="$3">
            <XStack alignItems="center" gap="$3">
              <CircleHelp size={19} color="$textSecondary" />
              <GradntText weight="semibold">Pourquoi un Garage ?</GradntText>
            </XStack>
            <GradntText muted fontSize={13} lineHeight={19}>
              Pour mieux comprendre ton équipement sans détourner GRADNT de l’essentiel : ta
              progression.
            </GradntText>
          </GradntCard>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
