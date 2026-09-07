import { ScrollView } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntChip,
  GradntHeading,
  GradntMetric,
  GradntProgressBar,
  GradntScreen,
  GradntSurface,
  GradntText,
} from '@/design-system'

export default function DesignSystemScreen() {
  return (
    <GradntScreen padded={false}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <YStack gap="$8">
          <YStack gap="$3">
            <GradntBadge tone="positive">GRADNT SYSTEM</GradntBadge>

            <GradntHeading>Ride what&apos;s next.</GradntHeading>

            <GradntText muted>
              Une interface centrée sur ta progression, ton objectif et la prochaine étape.
            </GradntText>
          </YStack>

          <GradntSurface padding="$5" gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntText muted weight="semibold" fontSize={13}>
                OBJECTIF PRINCIPAL
              </GradntText>

              <GradntBadge tone="positive">EN BONNE VOIE</GradntBadge>
            </XStack>

            <YStack gap="$2">
              <GradntHeading level={2}>FTP 280 W</GradntHeading>
              <GradntText muted>258 W actuellement</GradntText>
            </YStack>

            <GradntProgressBar value={72} />

            <XStack justifyContent="space-between">
              <GradntText muted fontSize={13}>
                Départ 245 W
              </GradntText>

              <GradntText weight="semibold" fontSize={13}>
                72 %
              </GradntText>
            </XStack>
          </GradntSurface>

          <YStack gap="$4">
            <GradntHeading level={3}>Ton état</GradntHeading>

            <XStack gap="$4">
              <GradntCard flex={1}>
                <GradntMetric label="FTP" value="258" unit="W" trend="+6 W" trendDirection="up" />
              </GradntCard>

              <GradntCard flex={1}>
                <GradntMetric label="Forme" value="78" trend="Bonne" trendDirection="up" />
              </GradntCard>
            </XStack>
          </YStack>

          <GradntSurface padding="$5" gap="$4">
            <GradntBadge tone="recovery">PROCHAINE ÉTAPE</GradntBadge>

            <YStack gap="$1">
              <GradntHeading level={2}>Sweet Spot</GradntHeading>
              <GradntText muted>Vendredi · 1 h 15</GradntText>
            </YStack>

            <GradntText>3 × 12 min à 88–94 % FTP avec 5 min de récupération.</GradntText>

            <GradntButton>Voir la séance</GradntButton>
          </GradntSurface>

          <YStack gap="$4">
            <GradntHeading level={3}>Intensités</GradntHeading>

            <XStack flexWrap="wrap" gap="$3">
              <GradntChip label="Endurance" selected />
              <GradntChip label="Tempo" />
              <GradntChip label="Seuil" />
              <GradntChip label="VO₂ Max" />
              <GradntChip label="Récupération" />
            </XStack>
          </YStack>

          <YStack gap="$3">
            <GradntHeading level={3}>Actions</GradntHeading>

            <GradntButton>Continuer</GradntButton>
            <GradntButton tone="secondary">Voir les détails</GradntButton>
            <GradntButton tone="ghost">Plus tard</GradntButton>
          </YStack>
        </YStack>
      </ScrollView>
    </GradntScreen>
  )
}
