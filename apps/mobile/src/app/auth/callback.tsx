import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'

import { GradntButton, GradntScreen, GradntText } from '@/design-system'
import {
  completeGoogleCallback,
  GoogleAuthError,
} from '@/features/auth/services/google-oauth.service'
import { useTranslation } from '@/i18n'

export default function GoogleAuthCallbackScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [failure, setFailure] = useState<'failed' | 'googleSaveFailed' | null>(null)
  const handledUrl = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    const consume = (callbackUrl: string | null) => {
      if (!mounted || !callbackUrl || handledUrl.current === callbackUrl) return
      handledUrl.current = callbackUrl
      void completeGoogleCallback(callbackUrl)
        .then((destination) => {
          if (mounted) router.replace(destination)
        })
        .catch((error: unknown) => {
          if (mounted)
            setFailure(
              error instanceof GoogleAuthError && error.code === 'save_failed'
                ? 'googleSaveFailed'
                : 'failed',
            )
        })
    }

    void Linking.getInitialURL().then(consume)
    const subscription = Linking.addEventListener('url', ({ url }) => consume(url))
    return () => {
      mounted = false
      subscription.remove()
    }
  }, [router])

  return (
    <GradntScreen>
      <GradntText muted>{t(failure ? `account.${failure}` : 'common.loading')}</GradntText>
      {failure ? (
        <GradntButton tone="secondary" onPress={() => router.replace('/onboarding/account')}>
          {t('common.retry')}
        </GradntButton>
      ) : null}
    </GradntScreen>
  )
}
