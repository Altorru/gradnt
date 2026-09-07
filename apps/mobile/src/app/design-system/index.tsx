import { ScrollView } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntMetric,
  GradntScreen,
  GradntText,
} from '@/design-system'

export default function DesignSystemScreen() {
  return (
    <GradntScreen padded={false}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <YStack gap="$8">
          <YStack gap="$3">
            <GradntText muted fontSize={13} fontWeight="600">
              GRADNT DESIGN SYSTEM
            </GradntText>

            <GradntHeading>Ride what&apos;s next.</GradntHeading>

            <GradntText muted>
              Visual preview of the core GRADNT mobile design primitives.
            </GradntText>
          </YStack>

          <GradntCard>
            <GradntText muted fontSize={13} fontWeight="600">
              OBJECTIF PRINCIPAL
            </GradntText>

            <GradntHeading level={2}>FTP 280 W</GradntHeading>

            <GradntText muted>Tu progresses régulièrement vers ton objectif.</GradntText>
          </GradntCard>

          <YStack gap="$4">
            <GradntHeading level={3}>Buttons</GradntHeading>

            <GradntButton>Continuer</GradntButton>

            <GradntButton tone="secondary">Voir les détails</GradntButton>

            <GradntButton tone="ghost">Plus tard</GradntButton>

            <GradntButton tone="danger">Supprimer</GradntButton>
          </YStack>

          <YStack gap="$4">
            <GradntHeading level={3}>Metrics</GradntHeading>

            <XStack gap="$4">
              <GradntCard flex={1}>
                <GradntMetric
                  label="FTP"
                  value="258"
                  unit="W"
                  trend="+6 W ce mois-ci"
                  trendDirection="up"
                />
              </GradntCard>

              <GradntCard flex={1}>
                <GradntMetric label="Forme" value="78" trend="Bonne" trendDirection="up" />
              </GradntCard>
            </XStack>
          </YStack>

          <GradntCard>
            <GradntText muted fontSize={13} fontWeight="600">
              PROCHAINE ÉTAPE
            </GradntText>

            <GradntHeading level={2}>Sweet Spot</GradntHeading>

            <GradntText>1 h 15 · 3 × 12 min @ 88–94 % FTP</GradntText>
          </GradntCard>
        </YStack>
      </ScrollView>
    </GradntScreen>
  )
}
