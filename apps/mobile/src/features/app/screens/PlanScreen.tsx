import { CalendarDays, ChevronRight, Plus } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntBadge, GradntButton, GradntCard, GradntText } from '@/design-system'
import { useUpcomingWorkoutsQuery } from '@/hooks/use-gradnt-data'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

function formatWorkoutDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes}`
}

const statusTone = {
  planned: 'neutral',
  completed: 'positive',
  skipped: 'danger',
  moved: 'warning',
} as const

export function PlanScreen() {
  const workoutsQuery = useUpcomingWorkoutsQuery()
  const workouts = workoutsQuery.data ?? []
  const plannedWorkouts = workouts.filter((workout) => workout.status === 'planned')

  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro
            title="Ton plan"
            description="Les séances qui te rapprochent de ton objectif, avec de la marge pour la vraie vie."
          />

          {workoutsQuery.isError ? (
            <GradntText color="$danger" fontSize={13}>
              Le plan est momentanément indisponible.
            </GradntText>
          ) : null}

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <CalendarDays size={20} color="$accent" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Cette semaine</GradntText>
                <GradntText muted fontSize={13}>
                  {workoutsQuery.isPending
                    ? 'Chargement…'
                    : `${plannedWorkouts.length} séances · ${plannedWorkouts.reduce((total, workout) => total + workout.durationMinutes, 0) / 60} h prévues`}
                </GradntText>
              </YStack>
              <GradntBadge tone="positive">En cours</GradntBadge>
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            {workouts.map((workout) => (
              <GradntCard key={workout.id} padding="$4" gap="$3">
                <XStack alignItems="center" gap="$3">
                  <YStack flex={1} gap="$1">
                    <GradntText muted fontSize={11} weight="semibold" letterSpacing={0.7}>
                      {new Date(workout.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                    </GradntText>
                    <GradntText weight="semibold">{workout.title}</GradntText>
                    <GradntText muted fontSize={13}>
                      {formatWorkoutDuration(workout.durationMinutes)} · {workout.intensityTarget}
                    </GradntText>
                  </YStack>
                  <GradntBadge tone={statusTone[workout.status]}>
                    {workout.status === 'planned' ? 'À venir' : workout.status}
                  </GradntBadge>
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
