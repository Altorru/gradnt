import { Activity, ArrowUpRight, CalendarDays, TrendingUp } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import {
  GradntCard,
  GradntMiniBars,
  GradntProgressRing,
  GradntSparkline,
  GradntText,
} from '@/design-system'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

export function ProgressScreen() {
  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro
            title="Ta progression"
            description="Les tendances utiles pour comprendre où tu en es, sans bruit inutile."
          />

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$4">
              <GradntProgressRing value={78} size={92} />
              <YStack flex={1} gap="$2">
                <GradntText muted fontSize={12}>
                  Objectif FTP
                </GradntText>
                <GradntText weight="bold" fontSize={28}>
                  258 → 280 W
                </GradntText>
                <XStack alignItems="center" gap="$1">
                  <ArrowUpRight size={15} color="$accent" />
                  <GradntText color="$accent" weight="semibold" fontSize={13}>
                    +6 W ce mois-ci
                  </GradntText>
                </XStack>
              </YStack>
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            <GradntCard padding="$4" gap="$4">
              <XStack alignItems="center" gap="$3">
                <Activity size={19} color="$accent" />
                <GradntText weight="semibold">Volume hebdomadaire</GradntText>
              </XStack>
              <GradntText muted fontSize={13}>
                4 h 32 cette semaine · stable sur 4 semaines
              </GradntText>
              <GradntMiniBars data={[30, 42, 36, 56, 48, 62, 58]} width={250} height={62} gap={7} />
            </GradntCard>

            <GradntCard padding="$4" gap="$4">
              <XStack alignItems="center" gap="$3">
                <TrendingUp size={19} color="$accent" />
                <GradntText weight="semibold">Régularité</GradntText>
              </XStack>
              <GradntText muted fontSize={13}>
                8 sorties sur les 30 derniers jours
              </GradntText>
              <GradntSparkline data={[30, 38, 33, 52, 58, 50, 68, 76]} width={250} height={62} />
            </GradntCard>
          </YStack>

          <GradntCard padding="$4" gap="$3">
            <XStack alignItems="center" gap="$3">
              <CalendarDays size={19} color="$recovery" />
              <GradntText weight="semibold">À retenir</GradntText>
            </XStack>
            <GradntText muted lineHeight={20}>
              Ta progression est régulière. La prochaine étape est de conserver ce rythme avant
              d’ajouter davantage d’intensité.
            </GradntText>
          </GradntCard>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
