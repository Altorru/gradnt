import * as DocumentPicker from 'expo-document-picker'
import { format } from 'date-fns'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useController, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntCard,
  GradntChip,
  GradntHeading,
  GradntInput,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { useTranslation } from '@/i18n'
import { importFitFile } from '@/services/activities/fit-import'
import { saveOwnedActivity } from '@/services/activities/owned-activities.repository'

import {
  manualActivityFormSchema,
  parseLocalRideDate,
  type ManualActivityForm,
} from '../domain/manual-activity.schema'

export function AddRideScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { control, getValues } = useForm<ManualActivityForm>({
    defaultValues: {
      dateTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
      sportType: 'road',
      durationMinutes: '',
      distanceKm: '',
      elevationMeters: '0',
    },
  })
  const dateTime = useController({ control, name: 'dateTime' }).field
  const sportType = useController({ control, name: 'sportType' }).field
  const duration = useController({ control, name: 'durationMinutes' }).field
  const distance = useController({ control, name: 'distanceKm' }).field
  const elevation = useController({ control, name: 'elevationMeters' }).field
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openRide(id: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['activities'] }),
      queryClient.invalidateQueries({ queryKey: ['training-metrics'] }),
      queryClient.invalidateQueries({ queryKey: ['goal-current-value'] }),
    ])
    router.replace({ pathname: '/rides/[activityId]', params: { activityId: id } })
  }

  async function saveManual() {
    const parsed = manualActivityFormSchema.safeParse(getValues())
    const startAt = parseLocalRideDate(getValues().dateTime)
    if (!parsed.success || !startAt) {
      setError(t('rides.add.invalid'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const ride = await saveOwnedActivity({
        source: 'manual',
        provenance: 'declared',
        sportType: parsed.data.sportType,
        startAt,
        durationSeconds: Math.round(parsed.data.durationMinutes * 60),
        distanceMeters: parsed.data.distanceKm * 1000,
        elevationGainMeters: parsed.data.elevationMeters,
        averageHeartRate: null,
        maxHeartRate: null,
        averagePower: null,
        normalizedPower: null,
        weightedPower: null,
        calories: null,
      })
      await openRide(ride.id)
    } catch {
      setError(t('common.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function importFile() {
    setError(null)
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: true,
      })
      if (picked.canceled) return
      setBusy(true)
      const asset = picked.assets[0]
      if (!asset) throw new Error('file_missing')
      const ride = await importFitFile(asset.uri, asset.name)
      await openRide(ride.id)
    } catch (failure) {
      setError(
        failure instanceof Error && failure.message === 'activity_already_imported'
          ? t('rides.add.duplicate')
          : t('rides.add.fitError'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$6">
          <GradntHeading>{t('rides.add.title')}</GradntHeading>
          <GradntText muted>{t('rides.add.subtitle')}</GradntText>
          <GradntCard gap="$3">
            <GradntText weight="semibold">{t('rides.add.fitTitle')}</GradntText>
            <GradntText muted fontSize={13}>
              {t('rides.add.fitDescription')}
            </GradntText>
            <GradntButton tone="secondary" disabled={busy} onPress={() => void importFile()}>
              {t('rides.add.chooseFit')}
            </GradntButton>
          </GradntCard>
          <GradntCard gap="$4">
            <GradntText weight="semibold">{t('rides.add.manualTitle')}</GradntText>
            <GradntText>{t('rides.add.dateTime')}</GradntText>
            <GradntInput
              value={dateTime.value}
              onChangeText={dateTime.onChange}
              accessibilityLabel={t('rides.add.dateTime')}
              autoCapitalize="none"
            />
            <GradntText>{t('rides.add.sport')}</GradntText>
            <XStack gap="$2" flexWrap="wrap">
              {(['road', 'gravel', 'mtb', 'indoor_cycling'] as const).map((sport) => (
                <GradntChip
                  key={sport}
                  label={t(`rides.add.sports.${sport}`)}
                  selected={sportType.value === sport}
                  onPress={() => sportType.onChange(sport)}
                />
              ))}
            </XStack>
            <GradntText>{t('rides.add.duration')}</GradntText>
            <GradntInput
              value={duration.value}
              onChangeText={duration.onChange}
              accessibilityLabel={t('rides.add.duration')}
              keyboardType="decimal-pad"
            />
            <GradntText>{t('rides.add.distance')}</GradntText>
            <GradntInput
              value={distance.value}
              onChangeText={distance.onChange}
              accessibilityLabel={t('rides.add.distance')}
              keyboardType="decimal-pad"
            />
            <GradntText>{t('rides.add.elevation')}</GradntText>
            <GradntInput
              value={elevation.value}
              onChangeText={elevation.onChange}
              accessibilityLabel={t('rides.add.elevation')}
              keyboardType="decimal-pad"
            />
            <GradntButton disabled={busy} onPress={() => void saveManual()}>
              {busy ? t('common.saving') : t('rides.add.save')}
            </GradntButton>
          </GradntCard>
          {error ? <GradntText color="$danger">{error}</GradntText> : null}
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
