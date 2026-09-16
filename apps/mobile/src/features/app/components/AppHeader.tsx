import { Bell, Settings } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { XStack, YStack } from 'tamagui'

import { GradntIconButton, GradntText, SCREEN_GUTTER } from '@/design-system'
import { useTranslation } from '@/i18n'

export function AppBrandHeader() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <XStack
      paddingHorizontal={SCREEN_GUTTER}
      paddingTop="$4"
      paddingBottom="$2"
      alignItems="center"
    >
      <XStack alignItems="center" gap="$2">
        <GradntText color="$accent" weight="bold" fontSize={17}>
          ▲
        </GradntText>
        <GradntText weight="bold" fontSize={18} letterSpacing={0.4}>
          GRADNT
        </GradntText>
      </XStack>

      <XStack marginLeft="auto" gap="$2">
        <GradntIconButton accessibilityLabel={t('header.notifications')}>
          <Bell size={18} color="$textPrimary" />
        </GradntIconButton>
        {/*
          Settings is pushed rather than given a tab: native tabs cap at five on
          Android, and the app already has five.
        */}
        <GradntIconButton
          accessibilityLabel={t('header.settings')}
          onPress={() => router.push('/settings')}
        >
          <Settings size={18} color="$textPrimary" />
        </GradntIconButton>
      </XStack>
    </XStack>
  )
}

export function AppScreenIntro({ title, description }: { title: string; description: string }) {
  return (
    <YStack gap="$2">
      <GradntText muted fontSize={12} weight="semibold" letterSpacing={1.1}>
        GRADNT
      </GradntText>
      <GradntText fontFamily="$heading" fontWeight="700" fontSize={32} lineHeight={36}>
        {title}
      </GradntText>
      <GradntText muted>{description}</GradntText>
    </YStack>
  )
}
