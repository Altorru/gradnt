import { format } from 'date-fns'
import { useRouter } from 'expo-router'
import { ChevronRight, Sparkles } from '@tamagui/lucide-icons-2'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { XStack } from 'tamagui'

import { GradntButton, GradntCard, GradntText, useThemeColor } from '@/design-system'
import { useDateLocale, useTranslation } from '@/i18n'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import type { Activity } from '@/lib/domain'
import { feedbackGuidance } from '../domain/ride-feedback'
import { useRideFeedbackQuery } from '../hooks/use-ride-feedback'

export function AfterRidePrompt({ activity }: { activity: Activity }) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const router = useRouter()
  const themeColor = useThemeColor()
  const accentInk = themeColor('accentInk')
  const reducedMotion = useReducedMotion()
  const ready = useOnboardingStore(
    (state) => state.hydrated && state.completed && !state.persistenceError,
  )
  const query = useRideFeedbackQuery(activity.id)
  if (!ready || query.isPending) return null
  const feedback = query.data?.feedback
  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(320).springify()}>
      <GradntCard accent gap="$3">
        <XStack alignItems="center" gap="$2">
          <Sparkles size={18} color={accentInk as never} />
          <GradntText weight="semibold">
            {t(feedback ? 'rides.prompt.answered' : 'rides.prompt.title')}
          </GradntText>
        </XStack>
        <GradntText muted fontSize={13}>
          {t('rides.prompt.rideDate', {
            date: format(new Date(activity.startAt), 'EEEE d MMM · HH:mm', { locale }),
          })}
        </GradntText>
        {query.isError ? (
          <>
            <GradntText color="$danger">{t('rides.feedback.readError')}</GradntText>
            <GradntButton tone="secondary" onPress={() => void query.refetch()}>
              {t('common.retry')}
            </GradntButton>
          </>
        ) : feedback ? (
          <>
            <GradntText>{t(`rides.guidance.${feedbackGuidance(feedback.responses)}`)}</GradntText>
            <GradntText muted fontSize={12}>
              {t('rides.prompt.basedOnFeelings')}
            </GradntText>
            <GradntButton
              tone="secondary"
              iconAfter={<ChevronRight size={17} color={accentInk as never} />}
              onPress={() =>
                router.push({
                  pathname: '/rides/[activityId]',
                  params: { activityId: activity.id },
                })
              }
            >
              {t('rides.open')}
            </GradntButton>
          </>
        ) : (
          <>
            <GradntText muted>{t('rides.feedback.invitation')}</GradntText>
            <GradntButton
              iconAfter={<ChevronRight size={17} color={themeColor('onAccent') as never} />}
              onPress={() =>
                router.push({
                  pathname: '/rides/[activityId]/feedback',
                  params: { activityId: activity.id },
                })
              }
            >
              {t('rides.feedback.add')}
            </GradntButton>
          </>
        )}
      </GradntCard>
    </Animated.View>
  )
}
