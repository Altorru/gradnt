import { ArrowLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useController, useForm } from 'react-hook-form'
import { YStack } from 'tamagui'
import { z } from 'zod'

import {
  GradntButton,
  GradntHeading,
  GradntIconButton,
  GradntInput,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { GoogleAuthError, signInWithGoogle } from '@/features/auth/services/google-oauth.service'
import { useTranslation } from '@/i18n'
import { getSupabaseClient } from '@/services/supabase/client'

import { OnboardingProgress } from '../components/OnboardingProgress'
import { saveOnboardingSnapshot, type OnboardingSnapshot } from '../services/onboarding.persistence'
import { useOnboardingStore } from '../store/onboarding.store'

export function OnboardingAccountScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const client = getSupabaseClient()
  const saving = useOnboardingStore((state) => state.saving)
  const { control, resetField } = useForm({ defaultValues: { email: '', password: '' } })
  const { field: emailField } = useController({ control, name: 'email' })
  const { field: passwordField } = useController({ control, name: 'password' })
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<
    'checkEmail' | 'failed' | 'invalid' | 'googleDisabled' | 'googleSaveFailed' | null
  >(null)

  function currentDraft(): OnboardingSnapshot {
    const draft = useOnboardingStore.getState()
    return {
      profile: draft.profile,
      goal: draft.goal,
      availability: draft.availability,
      strava: draft.strava,
      currentStep: 8,
      completed: true,
    }
  }

  async function finish(draft: OnboardingSnapshot) {
    // The AuthLifecycle deliberately clears in-memory state when identities
    // change. Take the completed draft from this device and write it under the
    // newly authenticated account, so that transition cannot drop onboarding.
    await saveOnboardingSnapshot(draft)
    await useOnboardingStore.getState().hydrate()
    if (useOnboardingStore.getState().persistenceError) throw new Error('onboarding_save_failed')
    router.replace('/home')
  }

  async function authenticate(create: boolean) {
    if (!client || pending) return
    const email = emailField.value.trim()
    const password = passwordField.value
    if (!z.email().safeParse(email).success || !password || (create && password.length < 8)) {
      setMessage('invalid')
      return
    }
    setPending(true)
    setMessage(null)
    const draft = currentDraft()
    try {
      const result = create
        ? await client.auth.signUp({ email, password })
        : await client.auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      if (!result.data.session) {
        setMessage('checkEmail')
        resetField('password')
        return
      }
      await finish(draft)
    } catch {
      setMessage('failed')
    } finally {
      setPending(false)
    }
  }

  async function authenticateWithGoogle() {
    if (pending) return
    setPending(true)
    setMessage(null)
    try {
      const destination = await signInWithGoogle()
      router.replace(destination)
    } catch (error) {
      setMessage(
        error instanceof GoogleAuthError && error.code === 'provider_disabled'
          ? 'googleDisabled'
          : error instanceof GoogleAuthError && error.code === 'save_failed'
            ? 'googleSaveFailed'
            : 'failed',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$6">
          <GradntIconButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
            <ArrowLeft size={18} color="$textPrimary" />
          </GradntIconButton>
          <OnboardingProgress step={8} total={8} />
          <YStack gap="$2">
            <GradntHeading>{t('onboarding.account.title')}</GradntHeading>
            <GradntText muted>{t('onboarding.account.subtitle')}</GradntText>
          </YStack>
          {!client ? (
            <GradntText color="$danger">{t('account.unavailable')}</GradntText>
          ) : (
            <YStack gap="$3">
              <GradntButton
                disabled={pending || saving}
                onPress={() => void authenticateWithGoogle()}
              >
                {t('onboarding.account.google')}
              </GradntButton>
              <GradntText muted textAlign="center" fontSize={12}>
                {t('onboarding.account.or')}
              </GradntText>
              <GradntText>{t('account.email')}</GradntText>
              <GradntInput
                accessibilityLabel={t('account.email')}
                value={emailField.value}
                onChangeText={emailField.onChange}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                disabled={pending || saving}
              />
              <GradntText>{t('account.password')}</GradntText>
              <GradntInput
                accessibilityLabel={t('account.password')}
                value={passwordField.value}
                onChangeText={passwordField.onChange}
                secureTextEntry
                autoComplete="password"
                autoCapitalize="none"
                disabled={pending || saving}
              />
              <GradntText muted fontSize={12}>
                {t('account.passwordHint')}
              </GradntText>
              <GradntButton disabled={pending || saving} onPress={() => void authenticate(false)}>
                {t('account.signIn')}
              </GradntButton>
              <GradntButton
                tone="secondary"
                disabled={pending || saving}
                onPress={() => void authenticate(true)}
              >
                {t('account.signUp')}
              </GradntButton>
            </YStack>
          )}
          {message ? (
            <GradntText color={message === 'checkEmail' ? '$textSecondary' : '$danger'}>
              {t(`account.${message}`)}
            </GradntText>
          ) : null}
          <GradntText muted fontSize={12}>
            {t('onboarding.account.privacy')}
          </GradntText>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
