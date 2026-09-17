import { Minus, Plus } from '@tamagui/lucide-icons-2'
import { XStack } from 'tamagui'

import { GradntCard, GradntIconButton, GradntSwitch, GradntText } from '@/design-system'
import { stepReminderTime } from '@/features/app/domain/notification-settings'
import { usePreferencesStore } from '@/features/app/store/preferences.store'
import { useTranslation } from '@/i18n'

/**
 * A time the rider steps by a quarter of an hour, either side of the readout.
 *
 * A quarter rather than five minutes: the granularity a rider sets a morning
 * reminder at, and two buttons that walk a whole day in 96 taps is a control
 * nobody uses.
 */
function GradntHourStepper({
  label,
  hour,
  minute,
  onChange,
}: {
  label: string
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
}) {
  const { t } = useTranslation()
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  const shift = (deltaMinutes: number) => {
    const next = stepReminderTime(hour, minute, deltaMinutes)
    onChange(next.hour, next.minute)
  }

  return (
    <XStack justifyContent="space-between" alignItems="center" gap="$3">
      <GradntText fontSize={15}>{label}</GradntText>

      <XStack alignItems="center" gap="$2">
        <GradntIconButton
          accessibilityLabel={t('notifications.settings.earlier')}
          onPress={() => shift(-15)}
        >
          <Minus size={16} color="$textPrimary" />
        </GradntIconButton>

        {/*
          The time is one control, not three: a reader adjusting it should hear
          "07:00, adjustable" and swipe, rather than hunt for a pair of buttons.
        */}
        <GradntText
          accessibilityRole="adjustable"
          accessibilityValue={{ text: time }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') {
              shift(15)
            } else if (event.nativeEvent.actionName === 'decrement') {
              shift(-15)
            }
          }}
          minWidth={66}
          textAlign="center"
        >
          {time}
        </GradntText>

        <GradntIconButton
          accessibilityLabel={t('notifications.settings.later')}
          onPress={() => shift(15)}
        >
          <Plus size={16} color="$textPrimary" />
        </GradntIconButton>
      </XStack>
    </XStack>
  )
}

/**
 * A last word before a switch is written.
 *
 * `apply` is what actually stores the choice, so a caller with a consent policy
 * can hold it back — Settings does, onboarding does not.
 */
export type ChangeGate = (wasOn: boolean, isOn: boolean, apply: () => void) => void

/**
 * What GRADNT may say, and when.
 *
 * The controls alone, with no heading: Settings asks for consent when a switch
 * goes on and onboarding asks when Continue is tapped, so the permission is the
 * caller's business. The heading is too, because the onboarding screen already
 * carries a title of its own.
 */
export function NotificationPreferenceCard({ beforeChange }: { beforeChange?: ChangeGate }) {
  const { t } = useTranslation()
  const preferences = usePreferencesStore()

  const change = (wasOn: boolean, setter: (value: boolean) => void) => (isOn: boolean) => {
    const apply = () => setter(isOn)

    if (beforeChange) {
      beforeChange(wasOn, isOn, apply)
      return
    }

    apply()
  }

  return (
    <GradntCard gap="$4" padding="$4">
      <GradntSwitch
        label={t('notifications.settings.sessionReminder')}
        value={preferences.sessionReminder}
        onValueChange={change(preferences.sessionReminder, preferences.setSessionReminder)}
      />

      {preferences.sessionReminder ? (
        <GradntHourStepper
          label={t('notifications.settings.reminderHour')}
          hour={preferences.reminderHour}
          minute={preferences.reminderMinute}
          onChange={preferences.setReminderTime}
        />
      ) : null}

      <GradntSwitch
        label={t('notifications.settings.weeklySummary')}
        value={preferences.weeklySummary}
        onValueChange={change(preferences.weeklySummary, preferences.setWeeklySummary)}
      />

      <GradntSwitch
        label={t('notifications.settings.inactivityNudge')}
        value={preferences.inactivityNudge}
        onValueChange={change(preferences.inactivityNudge, preferences.setInactivityNudge)}
      />
    </GradntCard>
  )
}
