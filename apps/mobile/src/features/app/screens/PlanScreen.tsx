import { CalendarDays, ChevronRight } from '@tamagui/lucide-icons-2'
import { useRouter, type Href } from 'expo-router'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntProgressBar,
  GradntText,
} from '@/design-system'
import {
  useMoveWorkoutMutation,
  useSkipWorkoutMutation,
  useUpcomingWorkoutsQuery,
} from '@/hooks/use-gradnt-data'

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

const statusLabels = {
  planned: 'À venir',
  completed: 'Terminée',
  skipped: 'Sautée',
  moved: 'Déplacée',
} as const

export function PlanScreen() {
  const router = useRouter()
  const workoutsQuery = useUpcomingWorkoutsQuery()
  const skipWorkout = useSkipWorkoutMutation()
  const moveWorkout = useMoveWorkoutMutation()
  const workouts = workoutsQuery.data ?? []
  const plannedWorkouts = workouts.filter((workout) => workout.status === 'planned')
  const completedWorkouts = workouts.filter((workout) => workout.status === 'completed')
  const trackedWorkouts = workouts.filter((workout) => workout.status !== 'planned')
  const completionPercentage = workouts.length
    ? Math.round((completedWorkouts.length / workouts.length) * 100)
    : 0
  const plannedMinutes = plannedWorkouts.reduce(
    (total, workout) => total + workout.durationMinutes,
    0,
  )
  const isMutating = skipWorkout.isPending || moveWorkout.isPending

  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro
            title="Ton plan"
            description="Les séances qui te rapprochent de ton objectif, avec de la marge pour la vraie vie."
          />

          {workoutsQuery.isError ? (
            <GradntCard padding="$4" gap="$3">
              <GradntText color="$danger" fontSize={13} weight="semibold">
                Le plan est momentanément indisponible.
              </GradntText>
              <GradntButton tone="secondary" onPress={() => void workoutsQuery.refetch()}>
                Réessayer
              </GradntButton>
            </GradntCard>
          ) : null}

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <CalendarDays size={20} color="$accent" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Cette semaine</GradntText>
                <GradntText muted fontSize={13}>
                  {workoutsQuery.isPending
                    ? 'Chargement…'
                    : workouts.length
                      ? `${plannedWorkouts.length} à venir · ${completedWorkouts.length} terminée${completedWorkouts.length > 1 ? 's' : ''}`
                      : 'Aucune séance planifiée'}
                </GradntText>
              </YStack>
              <GradntBadge tone={completionPercentage === 100 ? 'positive' : 'neutral'}>
                {workoutsQuery.isPending ? '—' : `${completionPercentage}%`}
              </GradntBadge>
            </XStack>
            {!workoutsQuery.isPending && workouts.length ? (
              <YStack gap="$2">
                <XStack justifyContent="space-between">
                  <GradntText muted fontSize={12}>
                    Avancement du plan
                  </GradntText>
                  <GradntText muted fontSize={12}>
                    {trackedWorkouts.length}/{workouts.length} suivies
                  </GradntText>
                </XStack>
                <GradntProgressBar value={completionPercentage} />
                <GradntText muted fontSize={12}>
                  {plannedMinutes
                    ? `${(plannedMinutes / 60).toFixed(1)} h encore prévues`
                    : 'Semaine suivie'}
                </GradntText>
              </YStack>
            ) : null}
          </GradntCard>

          {!workoutsQuery.isPending && !workoutsQuery.isError && workouts.length === 0 ? (
            <GradntCard padding="$4" gap="$2">
              <GradntHeading level={3}>Ton plan est vide</GradntHeading>
              <GradntText muted>
                Termine l&apos;onboarding avec au moins un jour disponible pour générer ta première
                semaine.
              </GradntText>
            </GradntCard>
          ) : null}

          <YStack gap="$3">
            {workouts.map((workout) => (
              <GradntCard key={workout.id} padding="$4" gap="$3">
                <XStack
                  alignItems="center"
                  gap="$3"
                  onPress={() => {
                    router.push(`/plan/${workout.id}` as Href)
                  }}
                >
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
                    {statusLabels[workout.status]}
                  </GradntBadge>
                  <ChevronRight size={18} color="$textSecondary" />
                </XStack>

                {workout.status === 'planned' ? (
                  <XStack gap="$2">
                    <YStack flex={1}>
                      <GradntButton
                        tone="ghost"
                        minHeight={44}
                        disabled={isMutating}
                        onPress={() => {
                          skipWorkout.mutate(workout.id)
                        }}
                      >
                        Sauter
                      </GradntButton>
                    </YStack>
                    <YStack flex={1}>
                      <GradntButton
                        tone="secondary"
                        minHeight={44}
                        disabled={isMutating}
                        onPress={() => {
                          const nextDate = new Date(workout.date)
                          nextDate.setDate(nextDate.getDate() + 1)
                          moveWorkout.mutate({ workoutId: workout.id, date: nextDate })
                        }}
                      >
                        Décaler d&apos;un jour
                      </GradntButton>
                    </YStack>
                  </XStack>
                ) : null}
              </GradntCard>
            ))}
          </YStack>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
