import { Bike, CircleHelp, Wrench } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntBadge, GradntButton, GradntCard, GradntText } from '@/design-system'

import { useTranslation } from '@/i18n'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

export function GarageScreen() {
  const { t } = useTranslation()

  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro title={t('tabs.garage')} description={t('garage.description')} />

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <Bike size={21} color="$accentInk" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">{t('garage.mainBike')}</GradntText>
                <GradntText muted fontSize={13}>
                  {t('garage.noBike')}
                </GradntText>
              </YStack>
              <GradntBadge>Beta</GradntBadge>
            </XStack>
            <GradntButton tone="secondary">{t('garage.addBike')}</GradntButton>
          </GradntCard>

          <GradntCard padding="$4" gap="$4">
            <XStack alignItems="center" gap="$3">
              <Wrench size={19} color="$recovery" />
              <GradntText weight="semibold">{t('garage.maintenance')}</GradntText>
            </XStack>
            <GradntText muted lineHeight={20}>
              {t('garage.maintenanceNote')}
            </GradntText>
          </GradntCard>

          <GradntCard padding="$4" gap="$3">
            <XStack alignItems="center" gap="$3">
              <CircleHelp size={19} color="$textSecondary" />
              <GradntText weight="semibold">{t('garage.why')}</GradntText>
            </XStack>
            <GradntText muted fontSize={13} lineHeight={19}>
              {t('garage.whyNote')}
            </GradntText>
          </GradntCard>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
