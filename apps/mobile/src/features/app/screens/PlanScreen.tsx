import { CalendarDays, ChevronRight, Plus } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntBadge, GradntButton, GradntCard, GradntText } from '@/design-system'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

const workouts = [
  {
    day: 'Mardi',
    title: 'Endurance fondamentale',
    detail: '1 h · Facile',
    tone: 'recovery' as const,
  },
  { day: 'Jeudi', title: 'Sweet Spot', detail: '1 h 15 · Structuré', tone: 'positive' as const },
  { day: 'Samedi', title: 'Sortie longue', detail: '2 h · Endurance', tone: 'neutral' as const },
]

export function PlanScreen() {
  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro
            title="Ton plan"
            description="Les séances qui te rapprochent de ton objectif, avec de la marge pour la vraie vie."
          />

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <CalendarDays size={20} color="$accent" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Cette semaine</GradntText>
                <GradntText muted fontSize={13}>
                  3 séances · 4 h 15 prévues
                </GradntText>
              </YStack>
              <GradntBadge tone="positive">En cours</GradntBadge>
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            {workouts.map((workout) => (
              <GradntCard key={workout.day} padding="$4" gap="$3">
                <XStack alignItems="center" gap="$3">
                  <YStack flex={1} gap="$1">
                    <GradntText muted fontSize={11} weight="semibold" letterSpacing={0.7}>
                      {workout.day}
                    </GradntText>
                    <GradntText weight="semibold">{workout.title}</GradntText>
                    <GradntText muted fontSize={13}>
                      {workout.detail}
                    </GradntText>
                  </YStack>
                  <GradntBadge tone={workout.tone}>À venir</GradntBadge>
                  <ChevronRight size={18} color="$textSecondary" />
                </XStack>
              </GradntCard>
            ))}
          </YStack>

          <GradntButton tone="secondary" iconAfter={<Plus size={18} color="$color" />}>
            Ajouter une disponibilité
          </GradntButton>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
