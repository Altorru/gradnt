import { useURL } from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'

import { GradntScreen, GradntText } from '@/design-system'
import { completeGoogleCallback } from '@/features/auth/services/google-oauth.service'
import { useTranslation } from '@/i18n'

export default function GoogleAuthCallbackScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const callbackUrl = useURL()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!callbackUrl) return
    void completeGoogleCallback(callbackUrl)
      .then(() => router.replace('/onboarding/account'))
      .catch(() => setFailed(true))
  }, [callbackUrl, router])

  return (
    <GradntScreen>
      <GradntText muted>{failed ? t('account.failed') : t('common.loading')}</GradntText>
    </GradntScreen>
  )
}
