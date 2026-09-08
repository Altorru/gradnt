import { Compass, MapPin, Route, Sparkles } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntBadge, GradntButton, GradntCard, GradntText } from '@/design-system'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

const routeModes = [
  { label: 'Route', selected: true },
  { label: 'Gravel', selected: false },
  { label: 'VTT', selected: false },
]

export function ExploreScreen() {
  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro
            title="Explorer"
            description="Prépare une sortie qui correspond à ton objectif et à l’envie du jour."
          />

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <Compass size={21} color="$accent" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Trouver une sortie</GradntText>
                <GradntText muted fontSize={13}>
                  La génération de parcours arrivera après la connexion à un moteur de routing.
                </GradntText>
              </YStack>
            </XStack>
            <XStack gap="$2" flexWrap="wrap">
              {routeModes.map((mode) => (
                <GradntBadge key={mode.label} tone={mode.selected ? 'positive' : 'neutral'}>
                  {mode.label}
                </GradntBadge>
              ))}
            </XStack>
          </GradntCard>

          <GradntCard padding="$4" gap="$4">
            <XStack alignItems="center" gap="$3">
              <MapPin size={19} color="$recovery" />
              <GradntText weight="semibold">Intention de sortie</GradntText>
            </XStack>
            <GradntText muted lineHeight={20}>
              Pour ta prochaine séance d’endurance, vise une sortie souple de 60 à 90 minutes, sur
              un itinéraire connu et peu contraignant.
            </GradntText>
            <GradntButton tone="secondary" iconAfter={<Route size={17} color="$color" />}>
              Définir mes préférences
            </GradntButton>
          </GradntCard>

          <GradntCard padding="$4" gap="$3">
            <XStack alignItems="center" gap="$3">
              <Sparkles size={19} color="$accent" />
              <GradntText weight="semibold">Plus tard dans Explore</GradntText>
            </XStack>
            <GradntText muted fontSize={13} lineHeight={19}>
              Trois propositions de parcours, influencées par ton plan et les conditions
              disponibles.
            </GradntText>
          </GradntCard>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
