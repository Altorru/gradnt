import { ArrowLeft } from '@tamagui/lucide-icons-2'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { useController, useForm } from 'react-hook-form'
import { YStack } from 'tamagui'
import { z } from 'zod'

import {
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntIconButton,
  GradntInput,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { useTranslation } from '@/i18n'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import {
  loadOnboardingSnapshot,
  saveOnboardingSnapshot,
  emptyOnboardingSnapshot,
  clearDeviceStravaConnection,
} from '@/features/onboarding/services/onboarding.persistence'
import { stravaService } from '@/features/onboarding/services/strava.service'
import {
  clearStravaTokens,
  clearPendingStravaState,
} from '@/services/strava/oauth/strava-token.persistence'
import { getSupabaseClient } from '@/services/supabase/client'
import { waitForAuthTransition } from '@/services/auth/auth-transition'
import {
  loadPremiumState,
  purchasePremium,
  restorePremium,
  type PurchasesPackage,
} from '@/services/subscription.service'

export function AccountScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const client = getSupabaseClient()
  const [original] = useState(() => {
    const state = useOnboardingStore.getState()
    return state.cloud ? emptyOnboardingSnapshot : state
  })
  const { control, resetField } = useForm({ defaultValues: { email: '', password: '' } })
  const { field: emailField } = useController({ control, name: 'email' })
  const { field: passwordField } = useController({ control, name: 'password' })
  const email = emailField.value
  const password = passwordField.value
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<'checkEmail' | 'failed' | 'invalid' | null>(null)
  const [premiumConfigured, setPremiumConfigured] = useState(false)
  const [premiumActive, setPremiumActive] = useState(false)
  const [premiumPackage, setPremiumPackage] = useState<PurchasesPackage | null>(null)
  const [premiumPending, setPremiumPending] = useState(false)
  const [premiumError, setPremiumError] = useState(false)
  const account = useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      if (!client) return null
      const {
        data: { session },
        error,
      } = await client.auth.getSession()
      if (error) throw error
      return session?.user ?? null
    },
  })
  const profile = useOnboardingStore((state) => state.profile)

  useEffect(() => {
    const userId = account.data?.id
    if (!userId) return
    void loadPremiumState(userId)
      .then((state) => {
        setPremiumConfigured(state.configured)
        setPremiumActive(state.active)
        setPremiumPackage(state.package)
      })
      .catch(() => setPremiumError(true))
  }, [account.data?.id])

  async function buyPremium() {
    const userId = account.data?.id
    if (!userId || !premiumPackage) return
    setPremiumPending(true)
    setPremiumError(false)
    try {
      setPremiumActive(await purchasePremium(userId, premiumPackage))
    } catch {
      setPremiumError(true)
    } finally {
      setPremiumPending(false)
    }
  }

  async function restorePremiumPurchase() {
    const userId = account.data?.id
    if (!userId) return
    setPremiumPending(true)
    setPremiumError(false)
    try {
      setPremiumActive(await restorePremium(userId))
    } catch {
      setPremiumError(true)
    } finally {
      setPremiumPending(false)
    }
  }
  const goToApp = () => {
    const state = useOnboardingStore.getState()
    if (!state.hydrated || state.persistenceError) {
      setMessage('failed')
      return
    }
    router.replace(state.completed ? '/home' : '/onboarding')
  }

  async function finishSignIn() {
    await waitForAuthTransition()
    // A previous account's connection must not follow a new account.
    await clearStravaTokens()
    await clearPendingStravaState()
    const session = await client?.auth.getSession()
    if (session?.data.session) await clearDeviceStravaConnection(session.data.session.user.id)
    await useOnboardingStore.getState().hydrate()
    if (useOnboardingStore.getState().persistenceError) throw new Error('cloud_load_failed')
    await queryClient.cancelQueries()
    queryClient.clear()
    resetField('password')
  }

  async function authenticate(create: boolean) {
    if (!client || pending) return
    if (
      !z.email().safeParse(email.trim()).success ||
      !password ||
      (create && password.length < 8)
    ) {
      setMessage('invalid')
      return
    }
    setPending(true)
    setMessage(null)
    try {
      const result = create
        ? await client.auth.signUp({ email: email.trim(), password })
        : await client.auth.signInWithPassword({ email: email.trim(), password })
      if (result.error) throw result.error
      if (!result.data.session) {
        setMessage('checkEmail')
        resetField('password')
      } else await finishSignIn()
    } catch {
      setMessage('failed')
    } finally {
      setPending(false)
    }
  }

  async function importSettings() {
    if (pending || !original.profile) return
    setPending(true)
    setMessage(null)
    try {
      const snapshot = await loadOnboardingSnapshot()
      if (!snapshot?.cloud || snapshot.profile) throw new Error('account_not_empty')
      await saveOnboardingSnapshot({ ...original, strava: null, cloud: snapshot.cloud })
      await useOnboardingStore.getState().hydrate()
      if (useOnboardingStore.getState().persistenceError) throw new Error('cloud_load_failed')
      await queryClient.invalidateQueries()
      goToApp()
    } catch {
      setMessage('failed')
    } finally {
      setPending(false)
    }
  }

  async function signOut() {
    if (!client || pending) return
    setPending(true)
    setMessage(null)
    try {
      if (useOnboardingStore.getState().strava?.status === 'connected')
        await stravaService.disconnect()
      await clearStravaTokens()
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
      await waitForAuthTransition()
      await useOnboardingStore.getState().hydrate()
      await queryClient.cancelQueries()
      queryClient.clear()
      resetField('password')
    } catch {
      setMessage('failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$5">
          <GradntIconButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
            <ArrowLeft size={18} color="$textPrimary" />
          </GradntIconButton>
          <GradntHeading>{t('account.title')}</GradntHeading>
          <GradntText muted>{t('account.description')}</GradntText>
          {!client ? (
            <GradntText>{t('account.unavailable')}</GradntText>
          ) : account.isPending ? (
            <GradntText>{t('common.loading')}</GradntText>
          ) : account.data ? (
            <YStack gap="$4">
              <GradntText>{t('account.signedIn', { email: account.data.email ?? '' })}</GradntText>
              <GradntCard gap="$3">
                <GradntHeading level={3}>{t('account.premium.title')}</GradntHeading>
                <GradntText muted>{t('account.premium.description')}</GradntText>
                {premiumActive ? (
                  <GradntText color="$positive">{t('account.premium.active')}</GradntText>
                ) : premiumConfigured && premiumPackage ? (
                  <>
                    <GradntText weight="semibold">
                      {t('account.premium.price', { value: premiumPackage.product.priceString })}
                    </GradntText>
                    <GradntButton
                      disabled={pending || premiumPending}
                      onPress={() => void buyPremium()}
                    >
                      {t(
                        premiumPending ? 'account.premium.processing' : 'account.premium.subscribe',
                      )}
                    </GradntButton>
                  </>
                ) : (
                  <GradntText muted>{t('account.premium.unavailable')}</GradntText>
                )}
                <GradntButton
                  tone="ghost"
                  disabled={pending || premiumPending}
                  onPress={() => void restorePremiumPurchase()}
                >
                  {t('account.premium.restore')}
                </GradntButton>
                {premiumError ? (
                  <GradntText color="$danger">{t('account.premium.error')}</GradntText>
                ) : null}
              </GradntCard>
              {!profile && original.profile ? (
                <GradntCard gap="$3">
                  <GradntHeading level={3}>{t('account.importTitle')}</GradntHeading>
                  <GradntText muted>{t('account.importNote')}</GradntText>
                  <GradntButton disabled={pending} onPress={() => void importSettings()}>
                    {t('account.import')}
                  </GradntButton>
                  <GradntButton tone="secondary" disabled={pending} onPress={goToApp}>
                    {t('account.startFresh')}
                  </GradntButton>
                </GradntCard>
              ) : (
                <GradntButton disabled={pending} onPress={goToApp}>
                  {t('account.continue')}
                </GradntButton>
              )}
              <GradntButton tone="ghost" disabled={pending} onPress={() => void signOut()}>
                {t('account.signOut')}
              </GradntButton>
            </YStack>
          ) : (
            <YStack gap="$3">
              <GradntText>{t('account.email')}</GradntText>
              <GradntInput
                accessibilityLabel={t('account.email')}
                value={email}
                onChangeText={emailField.onChange}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                disabled={pending}
              />
              <GradntText>{t('account.password')}</GradntText>
              <GradntInput
                accessibilityLabel={t('account.password')}
                value={password}
                onChangeText={passwordField.onChange}
                secureTextEntry
                autoComplete="password"
                autoCapitalize="none"
                disabled={pending}
              />
              <GradntText muted fontSize={12}>
                {t('account.passwordHint')}
              </GradntText>
              <GradntButton disabled={pending} onPress={() => void authenticate(false)}>
                {t('account.signIn')}
              </GradntButton>
              <GradntButton
                tone="secondary"
                disabled={pending}
                onPress={() => void authenticate(true)}
              >
                {t('account.signUp')}
              </GradntButton>
            </YStack>
          )}
          {message ? (
            <GradntText
              accessibilityLiveRegion="polite"
              color={message === 'checkEmail' ? '$textSecondary' : '$danger'}
            >
              {t(`account.${message}`)}
            </GradntText>
          ) : null}
          {account.isError ? (
            <GradntButton tone="secondary" onPress={() => void account.refetch()}>
              {t('common.retry')}
            </GradntButton>
          ) : null}
          <GradntText muted fontSize={12}>
            {t('account.privateNote')}
          </GradntText>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
