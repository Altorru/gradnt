import { format } from 'date-fns'
import { useRouter } from 'expo-router'
import { YStack } from 'tamagui'

import { GradntButton, GradntCard, GradntText } from '@/design-system'
import { useDateLocale, useNumberFormat, useTranslation } from '@/i18n'
import type { Activity } from '@/lib/domain'

/** A small action list, not a social feed: record sensations, then decide what's next. */
export function RecentRides({
  activities,
  refresh,
  refreshing,
}: {
  activities: Activity[]
  refresh: () => void
  refreshing: boolean
}) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const number = useNumberFormat()
  const router = useRouter()
  const recent = [...activities]
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))
    .slice(0, 3)
  return (
    <YStack gap="$3">
      <GradntText weight="semibold">{t('rides.recentTitle')}</GradntText>
      <GradntText muted fontSize={13}>
        {t('rides.recentDescription')}
      </GradntText>
      {recent.map((activity) => (
        <GradntCard key={activity.id} gap="$3">
          <GradntText weight="semibold">
            {format(new Date(activity.startAt), 'EEEE d MMM · HH:mm', { locale })}
          </GradntText>
          <GradntText muted>
            {number(activity.distanceMeters / 1000, { maximumFractionDigits: 1 })}
            {' km'}
            {' · '}
            {number(activity.durationSeconds / 60, { maximumFractionDigits: 0 })}{' '}
            {t('rides.minutes')}
          </GradntText>
          <GradntButton
            onPress={() =>
              router.push({
                pathname: '/rides/[activityId]/feedback',
                params: { activityId: activity.id },
              })
            }
          >
            {t('rides.feedback.add')}
          </GradntButton>
          <GradntButton
            tone="ghost"
            onPress={() =>
              router.push({ pathname: '/rides/[activityId]', params: { activityId: activity.id } })
            }
          >
            {t('rides.open')}
          </GradntButton>
        </GradntCard>
      ))}
      <GradntButton tone="secondary" disabled={refreshing} onPress={refresh}>
        {t('rides.refresh')}
      </GradntButton>
    </YStack>
  )
}
