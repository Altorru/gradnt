import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'

import { GradntScreen, GradntText } from '@/design-system'
import { completeGoogleCallback } from '@/features/auth/services/google-oauth.service'
import { useTranslation } from '@/i18n'

export default function GoogleAuthCallbackScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [failed, setFailed] = useState(false)
  const handledUrl = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    const consume = (callbackUrl: string | null) => {
      if (!mounted || !callbackUrl || handledUrl.current === callbackUrl) return
      handledUrl.current = callbackUrl
      void completeGoogleCallback(callbackUrl)
        .then(() => router.replace('/onboarding/account'))
        .catch(() => {
          if (mounted) setFailed(true)
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
      <GradntText muted>{failed ? t('account.failed') : t('common.loading')}</GradntText>
    </GradntScreen>
  )
}
