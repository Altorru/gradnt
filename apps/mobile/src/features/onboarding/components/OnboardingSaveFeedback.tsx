import { GradntButton, GradntText } from '@/design-system'
import { YStack } from 'tamagui'
import { useTranslation } from '@/i18n'

import { useOnboardingStore } from '../store/onboarding.store'

export function OnboardingSaveFeedback() {
  const { t } = useTranslation()
  const error = useOnboardingStore((state) => state.persistenceError)
  const saving = useOnboardingStore((state) => state.saving)
  const hydrate = useOnboardingStore((state) => state.hydrate)
  if (!error && !saving) return null
  return (
    <YStack gap="$2">
      <GradntText accessibilityLiveRegion="polite" color={error ? '$danger' : '$textSecondary'}>
        {t(error ? 'common.saveFailed' : 'common.saving')}
      </GradntText>
      {error ? (
        <GradntButton tone="ghost" onPress={() => void hydrate()}>
          {t('common.reloadSaved')}
        </GradntButton>
      ) : null}
    </YStack>
  )
}
