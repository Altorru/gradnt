# Notifications locales GRADNT — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Programmer sur l'appareil un rappel de séance, un bilan hebdomadaire, une relance d'inactivité et un palier d'objectif, tous bilingues, sans serveur, et garantir qu'une notification programmée reste vraie.

**Architecture:** Une fonction pure décide _ce qui_ doit être programmé et _quand_ ; une seconde, pure aussi, décide _comment ça se dit_. Un service impur réconcilie l'ensemble désiré avec ce qui est réellement programmé, appelé depuis un point d'entrée unique. Le pur se teste sans téléphone.

**Tech Stack:** Expo SDK 57, `expo-notifications` ~57.0.19, expo-router, zustand, TanStack Query 5.103, zod, Tamagui, vitest.

**Spec:** `docs/superpowers/specs/2026-09-16-notifications-design.md`

## Global Constraints

- **Aucun serveur.** Tout est programmé localement. Ne jamais introduire d'appel réseau ni de token d'appareil.
- **Aucun chiffre non vérifiable.** Un chiffre ne paraît que si les données ont moins de `FRESHNESS_WINDOW_MS`.
- **Tout le texte vient du catalogue i18n.** Aucune chaîne visible en dur, en français ou en anglais. Le test de parité fr/en (`i18n.test.ts`) doit rester vert.
- **Aucun style inline hors des cas déjà présents** ; suivre le design-system existant.
- **`shouldShowBanner` / `shouldShowList`**, jamais `shouldShowAlert` (disparu en SDK 57).
- **`weekday` va de 1 à 7 avec 1 = dimanche** (numérotation `expo-notifications`, différente de `Date.getDay()`).
- **`SCHEDULE_EXACT_ALARM` se déclare dans `app.json`**, jamais dans `android/AndroidManifest.xml` : `android/` est gitignoré et régénéré.
- **Commandes :** `pnpm test` (racine, vitest), `pnpm --filter @gradnt/mobile exec tsc --noEmit`, `pnpm --filter @gradnt/mobile exec eslint . --max-warnings=0`.

### Deux raffinements par rapport au spec

Le spec est valide ; deux détails d'implémentation se sont révélés meilleurs en écrivant le plan. Le spec est corrigé en même temps que ce plan.

1. **`planNotifications` ne prend pas `translation`.** Le planificateur décide de _ce qui_ et _quand_ ; la mise en mots est une seconde fonction pure (`describeNotification`) dans le même module. Deux préoccupations, deux fonctions, chacune testable seule. Le déclencheur « changement de langue » fonctionne toujours : la réconciliation re-décrit à chaque passage.
2. **`lastSyncedAt` n'est pas persisté.** TanStack Query 5.103 expose `dataUpdatedAt` sur le résultat de requête : c'est exactement l'instant de la dernière lecture réussie. Le spec annonçait un état à introduire de zéro ; il n'y en a pas besoin.

---

## Structure des fichiers

| Fichier                                                               | Responsabilité                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/lib/domain/notification-plan.ts` _(créer)_                       | Le pur : constantes, ensemble désiré, mise en mots.     |
| `src/lib/domain/notification-plan.test.ts` _(créer)_                  | Les cas qui comptent, sans téléphone.                   |
| `src/services/notifications/notification.scheduler.ts` _(créer)_      | L'impur : canaux, réconciliation, programmation.        |
| `src/services/notifications/notification.scheduler.test.ts` _(créer)_ | Le diff et l'idempotence, avec un faux ordonnanceur.    |
| `src/services/preferences/preferences.persistence.ts` _(modifier)_    | Les cinq champs de préférence.                          |
| `src/services/preferences/preferences.persistence.test.ts` _(créer)_  | La migration : les préférences existantes survivent.    |
| `src/features/app/hooks/use-notification-sync.ts` _(créer)_           | Le point d'entrée unique de réconciliation.             |
| `src/features/app/components/NotificationObserver.tsx` _(créer)_      | Handler au niveau module + deep link au tap.            |
| `src/design-system/components/primitives/GradntSwitch.tsx` _(créer)_  | Un booléen se règle avec un interrupteur, pas un radio. |
| `src/features/app/screens/NotificationSettingsSection.tsx` _(créer)_  | La section de Réglages.                                 |
| `src/features/app/screens/SettingsScreen.tsx` _(modifier)_            | Monte la section.                                       |
| `src/features/app/components/AppHeader.tsx` _(modifier)_              | Perd la cloche.                                         |
| `src/app/_layout.tsx` _(modifier)_                                    | Monte l'observateur.                                    |
| `src/i18n/messages/fr.ts`, `en.ts` _(modifier)_                       | Le catalogue.                                           |
| `app.json` _(modifier)_                                               | `SCHEDULE_EXACT_ALARM`.                                 |

---

## Task 1 : Les préférences, sans casser celles qui existent

C'est la tâche la plus risquée du plan : `loadPreferences` fait un `safeParse` et retombe sur les valeurs par défaut en cas d'échec. Des champs requis feraient perdre à tout rider existant sa langue et son apparence, en silence.

**Files:**

- Modify: `apps/mobile/src/services/preferences/preferences.persistence.ts`
- Test: `apps/mobile/src/services/preferences/preferences.persistence.test.ts`

**Interfaces:**

- Produces: `NotificationPreferences`, et `preferencesSchema` acceptant cinq champs neufs avec défauts.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'

import { defaultPreferences, preferencesSchema } from './preferences.persistence'

describe('preferencesSchema', () => {
  it('reads preferences stored before notifications existed', () => {
    // Exactly what an installed app has on disk today: two keys, no more.
    const stored = JSON.stringify({ language: 'en', appearance: 'light' })

    const result = preferencesSchema.safeParse(JSON.parse(stored))

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ language: 'en', appearance: 'light' })
  })

  it('gives the new fields their defaults rather than undefined', () => {
    const result = preferencesSchema.parse({ language: 'fr', appearance: 'dark' })

    expect(result.sessionReminder).toBe(true)
    expect(result.reminderHour).toBe(7)
    expect(result.reminderMinute).toBe(0)
    expect(result.weeklySummary).toBe(true)
    expect(result.inactivityNudge).toBe(false)
  })

  it('rejects an hour outside the clock', () => {
    const result = preferencesSchema.safeParse({
      ...defaultPreferences,
      reminderHour: 24,
    })

    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- preferences.persistence`
Expected: FAIL — `result.data.sessionReminder` is `undefined`, and the schema strips the unknown keys.

- [ ] **Step 3: Write minimal implementation**

In `preferences.persistence.ts`, add the fields **flat**, each with `.default()`. Not nested in a `notifications` object: in zod, `.default({})` on an object does **not** apply its fields' defaults — `ZodDefault` returns the default without reparsing it, so the nested fields would be `undefined` instead of `true`/`7`.

```ts
export const preferencesSchema = z.object({
  language: languagePreferenceSchema,
  appearance: appearancePreferenceSchema,

  // Flat, each with its own default. A nested object would need `.default({...})`
  // to spell out every value again: zod returns a default without reparsing it,
  // so the inner defaults would never run.
  sessionReminder: z.boolean().default(true),
  reminderHour: z.number().int().min(0).max(23).default(7),
  reminderMinute: z.number().int().min(0).max(59).default(0),
  weeklySummary: z.boolean().default(true),
  inactivityNudge: z.boolean().default(false),
})

export type NotificationPreferences = Pick<
  Preferences,
  'sessionReminder' | 'reminderHour' | 'reminderMinute' | 'weeklySummary' | 'inactivityNudge'
>
```

`defaultPreferences` gains the same five values, since it is what `loadPreferences` returns when nothing is stored.

`savePreferences` calls `preferencesSchema.parse`, which now fills the defaults, so a rider who never opens the section still writes a complete record.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- preferences.persistence`
Expected: PASS, three tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/services/preferences/
git commit -m "✨ feat(app): store the notification choices without resetting the others"
```

---

## Task 2 : L'ensemble désiré — constantes et rappels de séance

**Files:**

- Create: `apps/mobile/src/lib/domain/notification-plan.ts`
- Test: `apps/mobile/src/lib/domain/notification-plan.test.ts`

**Interfaces:**

- Consumes: `NotificationPreferences` (Task 1), `PlannedWorkout` from `./schemas`
- Produces: `DesiredNotification`, `planNotifications`, et les constantes `FRESHNESS_WINDOW_MS`, `SCHEDULE_CAP`, `INACTIVITY_DAYS`, `WEEKLY_HOUR`, `WEEKLY_MINUTE`, `WEEKLY_WEEKDAY`, `MILESTONE_THRESHOLDS`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'

import type { PlannedWorkout } from './schemas'
import { planNotifications, type PlanInput } from './notification-plan'

const NOW = new Date('2026-09-16T06:00:00.000Z') // a Wednesday

function workout(over: Partial<PlannedWorkout> = {}): PlannedWorkout {
  return {
    id: 'w1',
    date: '2026-09-17T07:00:00.000Z',
    type: 'endurance',
    title: 'Endurance fondamentale',
    durationMinutes: 90,
    intensityTarget: 'Facile',
    structure: 'Continu',
    status: 'planned',
    reason: 'Base',
    ...over,
  }
}

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    workouts: [],
    preferences: {
      sessionReminder: true,
      reminderHour: 7,
      reminderMinute: 0,
      weeklySummary: false,
      inactivityNudge: false,
    },
    lastActivityAt: null,
    lastSyncedAt: null,
    weeklySummary: null,
    goal: null,
    celebrated: {},
    now: NOW,
    ...over,
  }
}

describe('session reminders', () => {
  it('fires on the day of the session, at the hour the rider chose', () => {
    const result = planNotifications(input({ workouts: [workout()] }))

    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('session:w1')
    expect(result[0].fireAt.getHours()).toBe(7)
    expect(result[0].fireAt.getMinutes()).toBe(0)
  })

  it('says nothing about a session already completed, skipped or moved', () => {
    for (const status of ['completed', 'skipped', 'moved'] as const) {
      const result = planNotifications(input({ workouts: [workout({ status })] }))
      expect(result, status).toHaveLength(0)
    }
  })

  it('says nothing about a session in the past', () => {
    const result = planNotifications(
      input({ workouts: [workout({ date: '2026-09-15T07:00:00.000Z' })] }),
    )

    expect(result).toHaveLength(0)
  })

  it('says nothing at all when the rider turned reminders off', () => {
    const result = planNotifications(
      input({
        workouts: [workout()],
        preferences: { ...input().preferences, sessionReminder: false },
      }),
    )

    expect(result).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- notification-plan`
Expected: FAIL — cannot resolve `./notification-plan`.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { NotificationPreferences } from '../../services/preferences/preferences.persistence'

import type { PlannedWorkout } from './schemas'

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

/** Beyond this, the data is too old to put a figure in a notification. */
export const FRESHNESS_WINDOW_MS = 24 * HOUR_MS

/** iOS silently drops pending local notifications past 64. Stay well clear. */
export const SCHEDULE_CAP = 20

export const INACTIVITY_DAYS = 4

/**
 * The weekly summary is fixed, not configured.
 *
 * The Settings section offers one hour — the session reminder's — because that
 * is the only one a rider organises a day around. Nobody schedules Sunday
 * around a summary.
 */
export const WEEKLY_HOUR = 18
export const WEEKLY_MINUTE = 0
/** Sunday in `expo-notifications` numbering, which runs 1..7 from Sunday. */
export const WEEKLY_WEEKDAY = 1

/** The progress levels worth telling a rider about, lowest first. */
export const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const
export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number]

export type WeeklySummary = {
  rides: number
  hours: number
  distanceKm: number
  elevationGainM: number
}

export type CelebrationRecord = Record<string, number>

type Base = { key: string; fireAt: Date }

export type DesiredNotification =
  | (Base & { kind: 'session'; workout: PlannedWorkout })
  | (Base & { kind: 'weekly'; summary: WeeklySummary | null })
  | (Base & { kind: 'inactivity' })
  | (Base & { kind: 'milestone'; threshold: MilestoneThreshold; progress: number })

export type PlanInput = {
  workouts: PlannedWorkout[]
  preferences: NotificationPreferences
  lastActivityAt: string | null
  lastSyncedAt: string | null
  weeklySummary: WeeklySummary | null
  goal: { key: string; progress: number } | null
  celebrated: CelebrationRecord
  now: Date
}

/**
 * The hour the rider chose, on the calendar day the workout falls on.
 *
 * Built from local components rather than by adding milliseconds to the stored
 * instant: the stored instant is 07:00 UTC as often as not, and the rider means
 * seven o'clock where they are.
 */
function fireAtOnDay(workoutDate: string, hour: number, minute: number): Date {
  const day = new Date(workoutDate)

  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0)
}

function sessionNotifications(input: PlanInput): DesiredNotification[] {
  const { preferences, now } = input

  if (!preferences.sessionReminder) {
    return []
  }

  return input.workouts
    .filter((workout) => workout.status === 'planned')
    .map((workout) => ({
      key: `session:${workout.id}`,
      kind: 'session' as const,
      workout,
      fireAt: fireAtOnDay(workout.date, preferences.reminderHour, preferences.reminderMinute),
    }))
    .filter((notification) => notification.fireAt > now)
}

export function planNotifications(input: PlanInput): DesiredNotification[] {
  return [...sessionNotifications(input)].sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- notification-plan`
Expected: PASS, four tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/domain/notification-plan.ts apps/mobile/src/lib/domain/notification-plan.test.ts
git commit -m "✨ feat(app): decide which session reminders should exist"
```

---

## Task 3 : Le bilan de semaine, et la règle de fraîcheur

**Files:**

- Modify: `apps/mobile/src/lib/domain/notification-plan.ts`
- Test: `apps/mobile/src/lib/domain/notification-plan.test.ts`

**Interfaces:**

- Produces: `isFresh(lastSyncedAt, now)`, et les entrées `kind: 'weekly'` dans l'ensemble désiré.

- [ ] **Step 1: Write the failing test**

```ts
describe('weekly summary', () => {
  const summary = { rides: 4, hours: 6.5, distanceKm: 142, elevationGainM: 850 }

  it('carries the figures while the data is fresh', () => {
    const result = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: summary,
        lastSyncedAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('weekly')
    expect(result[0]).toMatchObject({ summary })
  })

  it('drops the figures once the data is stale, rather than showing last week', () => {
    const result = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: summary,
        lastSyncedAt: new Date(NOW.getTime() - 30 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result[0]).toMatchObject({ summary: null })
  })

  it('drops the figures when nothing was ever synced', () => {
    const result = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: summary,
        lastSyncedAt: null,
      }),
    )

    expect(result[0]).toMatchObject({ summary: null })
  })

  it('lands on the next Sunday evening', () => {
    const result = planNotifications(
      input({ preferences: { ...input().preferences, weeklySummary: true } }),
    )

    expect(result[0].fireAt.getDay()).toBe(0) // Sunday
    expect(result[0].fireAt.getHours()).toBe(18)
  })
})

describe('isFresh', () => {
  it('treats a missing sync as stale', () => {
    expect(isFresh(null, NOW)).toBe(false)
  })

  it('holds for just under the window and fails at it', () => {
    const justInside = new Date(NOW.getTime() - FRESHNESS_WINDOW_MS + 1000).toISOString()
    const atTheEdge = new Date(NOW.getTime() - FRESHNESS_WINDOW_MS).toISOString()

    expect(isFresh(justInside, NOW)).toBe(true)
    expect(isFresh(atTheEdge, NOW)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- notification-plan`
Expected: FAIL — no `weekly` notification is produced, and `isFresh` is not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * Whether the figures we hold were read recently enough to be quoted.
 *
 * A local notification carries only what the app knew when it was scheduled,
 * and Strava only syncs while the app is open. Past this window we cannot vouch
 * for a number, so we stop using numbers.
 */
export function isFresh(lastSyncedAt: string | null, now: Date): boolean {
  if (lastSyncedAt === null) {
    return false
  }

  const synced = Date.parse(lastSyncedAt)

  return !Number.isNaN(synced) && now.getTime() - synced < FRESHNESS_WINDOW_MS
}

/**
 * The next Sunday evening, in local time.
 *
 * `WEEKLY_WEEKDAY` is Sunday in `expo-notifications` numbering, which runs 1..7
 * from Sunday — one off `Date.getDay()`, which runs 0..6 from Sunday. Hence the
 * `- 1`.
 */
function nextWeeklyFire(now: Date): Date {
  const fireAt = new Date(now)
  fireAt.setHours(WEEKLY_HOUR, WEEKLY_MINUTE, 0, 0)

  const daysUntil = (WEEKLY_WEEKDAY - 1 - fireAt.getDay() + 7) % 7
  fireAt.setDate(fireAt.getDate() + daysUntil)

  if (fireAt <= now) {
    fireAt.setDate(fireAt.getDate() + 7)
  }

  return fireAt
}

function weeklyNotifications(input: PlanInput): DesiredNotification[] {
  if (!input.preferences.weeklySummary) {
    return []
  }

  const fresh = isFresh(input.lastSyncedAt, input.now)
  const fireAt = nextWeeklyFire(input.now)

  return [
    {
      key: `weekly:${fireAt.toISOString().slice(0, 10)}`,
      kind: 'weekly',
      summary: fresh ? input.weeklySummary : null,
      fireAt,
    },
  ]
}
```

Add `...weeklyNotifications(input)` to the array in `planNotifications`, and export `isFresh`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- notification-plan`
Expected: PASS. The stale cases produce `summary: null` — that is what makes the second wording reachable in Task 7.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/domain/
git commit -m "✨ feat(app): quote weekly figures only while they can be vouched for"
```

---

## Task 4 : La relance d'inactivité

**Files:**

- Modify: `apps/mobile/src/lib/domain/notification-plan.ts`
- Test: `apps/mobile/src/lib/domain/notification-plan.test.ts`

**Interfaces:**

- Produces: les entrées `kind: 'inactivity'`.

- [ ] **Step 1: Write the failing test**

```ts
describe('inactivity nudge', () => {
  const enabled = { ...input().preferences, inactivityNudge: true }
  const fresh = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString()

  it('stays quiet about a rider who rode yesterday', () => {
    const result = planNotifications(
      input({
        preferences: enabled,
        lastSyncedAt: fresh,
        lastActivityAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result).toHaveLength(0)
  })

  it('speaks up after four days without a ride', () => {
    const result = planNotifications(
      input({
        preferences: enabled,
        lastSyncedAt: fresh,
        lastActivityAt: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('inactivity')
  })

  it('stays quiet on stale data, because it cannot know whether he rode', () => {
    const result = planNotifications(
      input({
        preferences: enabled,
        lastSyncedAt: new Date(NOW.getTime() - 30 * 60 * 60 * 1000).toISOString(),
        lastActivityAt: new Date(NOW.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result).toHaveLength(0)
  })

  it('says nothing when the rider never rode at all', () => {
    const result = planNotifications(
      input({ preferences: enabled, lastSyncedAt: fresh, lastActivityAt: null }),
    )

    expect(result).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- notification-plan`
Expected: FAIL — no `inactivity` notification is produced.

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * The next time the clock passes the rider's hour.
 *
 * The nudge is not fired the moment it is detected: an app that has just
 * noticed you were idle should not also interrupt you about it. It waits for
 * the hour the rider already nominated for hearing from us.
 */
function nextDailyFire(now: Date, hour: number, minute: number): Date {
  const fireAt = new Date(now)
  fireAt.setHours(hour, minute, 0, 0)

  if (fireAt <= now) {
    fireAt.setDate(fireAt.getDate() + 1)
  }

  return fireAt
}

function inactivityNotifications(input: PlanInput): DesiredNotification[] {
  const { preferences, lastActivityAt, lastSyncedAt, now } = input

  if (!preferences.inactivityNudge || lastActivityAt === null) {
    return []
  }

  // Without a recent sync we cannot tell idleness from not having looked.
  if (!isFresh(lastSyncedAt, now)) {
    return []
  }

  const idleMs = now.getTime() - Date.parse(lastActivityAt)

  if (Number.isNaN(idleMs) || idleMs < INACTIVITY_DAYS * DAY_MS) {
    return []
  }

  return [
    {
      // Keyed on the last ride, so it fires once per idle stretch rather than
      // once per reconcile.
      key: `inactivity:${lastActivityAt.slice(0, 10)}`,
      kind: 'inactivity',
      fireAt: nextDailyFire(now, preferences.reminderHour, preferences.reminderMinute),
    },
  ]
}
```

Add `...inactivityNotifications(input)` to `planNotifications`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- notification-plan`
Expected: PASS, four tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/domain/
git commit -m "✨ feat(app): notice when a rider has stopped riding"
```

---

## Task 5 : Le palier d'objectif, et le plafond

**Files:**

- Modify: `apps/mobile/src/lib/domain/notification-plan.ts`
- Test: `apps/mobile/src/lib/domain/notification-plan.test.ts`

**Interfaces:**

- Produces: les entrées `kind: 'milestone'`, et l'application de `SCHEDULE_CAP`.

- [ ] **Step 1: Write the failing test**

```ts
describe('goal milestones', () => {
  const goal = { key: 'goal-1', progress: 78 }

  it('celebrates the highest level reached', () => {
    const result = planNotifications(input({ goal }))

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ kind: 'milestone', threshold: 75, progress: 78 })
  })

  it('never celebrates the same level twice', () => {
    const first = planNotifications(input({ goal }))
    const celebrated = { 'goal-1': 75 }

    const second = planNotifications(input({ goal, celebrated }))

    expect(first).toHaveLength(1)
    expect(second).toHaveLength(0)
  })

  it('still celebrates a level further up', () => {
    const result = planNotifications(
      input({ goal: { key: 'goal-1', progress: 100 }, celebrated: { 'goal-1': 75 } }),
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ threshold: 100 })
  })

  it('says nothing below the first level', () => {
    expect(planNotifications(input({ goal: { key: 'goal-1', progress: 12 } }))).toHaveLength(0)
  })
})

describe('the scheduling cap', () => {
  it('keeps the soonest and drops the rest', () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      workout({
        id: `w${index}`,
        date: new Date(NOW.getTime() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    const result = planNotifications(input({ workouts: many }))

    expect(result).toHaveLength(SCHEDULE_CAP)
    expect(result[0].key).toBe('session:w0')
  })

  it('never drops a milestone, which fires now rather than later', () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      workout({
        id: `w${index}`,
        date: new Date(NOW.getTime() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    const result = planNotifications(
      input({ workouts: many, goal: { key: 'goal-1', progress: 50 } }),
    )

    expect(result.filter((n) => n.kind === 'milestone')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- notification-plan`
Expected: FAIL — milestones are not produced and the cap is not applied.

- [ ] **Step 3: Write minimal implementation**

```ts
function milestoneNotifications(input: PlanInput): DesiredNotification[] {
  const { goal, celebrated, now } = input

  if (goal === null) {
    return []
  }

  const reached = MILESTONE_THRESHOLDS.filter((threshold) => goal.progress >= threshold)
  const highest = reached.at(-1)

  if (highest === undefined || (celebrated[goal.key] ?? 0) >= highest) {
    return []
  }

  return [
    {
      key: `milestone:${goal.key}:${highest}`,
      kind: 'milestone',
      threshold: highest,
      progress: goal.progress,
      fireAt: now,
    },
  ]
}

/**
 * Everything that should be scheduled, capped.
 *
 * iOS drops pending local notifications past 64 without saying so, and a plan
 * of several weeks clears that on its own. We keep the soonest, because a
 * reminder three weeks out is the one a rider can most afford to lose.
 *
 * Milestones are exempt: they fire now, not later, and a cap that swallowed the
 * one notification the rider did something to earn would be the worst possible
 * thing to drop.
 */
export function planNotifications(input: PlanInput): DesiredNotification[] {
  const all = [
    ...sessionNotifications(input),
    ...weeklyNotifications(input),
    ...inactivityNotifications(input),
    ...milestoneNotifications(input),
  ]

  const immediate = all.filter((notification) => notification.fireAt <= input.now)
  const later = all
    .filter((notification) => notification.fireAt > input.now)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())

  const room = Math.max(0, SCHEDULE_CAP - immediate.length)

  return [...immediate, ...later.slice(0, room)]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- notification-plan`
Expected: PASS, six more tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/domain/
git commit -m "✨ feat(app): mark the levels reached, and cap what we schedule"
```

---

## Task 6 : La mise en mots

**Files:**

- Modify: `apps/mobile/src/lib/domain/notification-plan.ts`
- Test: `apps/mobile/src/lib/domain/notification-plan.test.ts`

**Interfaces:**

- Consumes: `Translation` de `@/i18n` (déjà défini : `{ t, plural }`)
- Produces: `describeNotification(notification, translation, platform) → { title, body, url }`, et `NotificationWording`

Le texte est composé ici et **recopié dans la notification au moment de la programmation**. C'est pourquoi un changement de langue doit redéclencher la réconciliation.

- [ ] **Step 1: Write the failing test**

```ts
import { translate, translatePlural } from '@/i18n'
import { describeNotification } from './notification-plan'

const frTranslation = {
  t: (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate('fr', key, params),
  plural: (key: Parameters<typeof translatePlural>[1], count: number) =>
    translatePlural('fr', key, count),
}
const enTranslation = {
  t: (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate('en', key, params),
  plural: (key: Parameters<typeof translatePlural>[1], count: number) =>
    translatePlural('en', key, count),
}

describe('describeNotification', () => {
  it('names the session type from the code, never from the stored French title', () => {
    const notification = planNotifications(input({ workouts: [workout()] }))[0]

    const wording = describeNotification(notification, enTranslation)

    expect(wording.body).toContain('Endurance')
    expect(wording.body).not.toContain('fondamentale')
  })

  it('writes in the language it is handed', () => {
    const notification = planNotifications(input({ workouts: [workout()] }))[0]

    expect(describeNotification(notification, frTranslation).title).not.toBe(
      describeNotification(notification, enTranslation).title,
    )
  })

  it('deep links a session to its own screen', () => {
    const notification = planNotifications(input({ workouts: [workout()] }))[0]

    expect(describeNotification(notification, frTranslation).url).toBe('/plan/w1')
  })

  it('has two weekly wordings, and uses the one the data allows', () => {
    const fresh = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: { rides: 4, hours: 6.5, distanceKm: 142, elevationGainM: 850 },
        lastSyncedAt: new Date(NOW.getTime() - 60 * 1000).toISOString(),
      }),
    )[0]
    const stale = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: { rides: 4, hours: 6.5, distanceKm: 142, elevationGainM: 850 },
        lastSyncedAt: null,
      }),
    )[0]

    expect(describeNotification(fresh, frTranslation).body).toContain('4')
    expect(describeNotification(stale, frTranslation).body).not.toContain('4')
  })

  it('has no url for a nudge, which has no screen of its own', () => {
    const notification = planNotifications(
      input({
        preferences: { ...input().preferences, inactivityNudge: true },
        lastSyncedAt: new Date(NOW.getTime() - 60 * 1000).toISOString(),
        lastActivityAt: new Date(NOW.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )[0]

    expect(describeNotification(notification, frTranslation).url).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- notification-plan`
Expected: FAIL — `describeNotification` is not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { MessageKey, Translation } from '@/i18n'

/** The workout type, as a catalogue key. Never `workout.title`. */
const SESSION_TITLE_KEYS = {
  endurance: 'notifications.session.endurance',
  tempo: 'notifications.session.tempo',
  sweet_spot: 'notifications.session.sweetSpot',
  threshold: 'notifications.session.threshold',
  vo2_max: 'notifications.session.vo2Max',
  recovery: 'notifications.session.recovery',
} as const satisfies Record<PlannedWorkout['type'], MessageKey>

export type NotificationWording = {
  title: string
  body: string
  /** Where a tap lands, or null when there is no screen to land on. */
  url: string | null
}

export function describeNotification(
  notification: DesiredNotification,
  { t, plural }: Translation,
): NotificationWording {
  switch (notification.kind) {
    case 'session':
      return {
        title: t('notifications.session.title'),
        body: `${t(SESSION_TITLE_KEYS[notification.workout.type])} · ${t(
          'notifications.session.duration',
          { minutes: notification.workout.durationMinutes },
        )}`,
        url: `/plan/${notification.workout.id}`,
      }

    case 'weekly':
      return {
        title: t('notifications.weekly.title'),
        body:
          notification.summary === null
            ? t('notifications.weekly.bodyWithoutFigures')
            : t('notifications.weekly.bodyWithFigures', {
                rides: notification.summary.rides,
                hours: notification.summary.hours,
                distance: notification.summary.distanceKm,
              }),
        url: '/progress',
      }

    case 'inactivity':
      return {
        title: t('notifications.inactivity.title'),
        body: t('notifications.inactivity.body'),
        url: null,
      }

    case 'milestone':
      return {
        title: t('notifications.milestone.title'),
        body: t('notifications.milestone.body', { threshold: notification.threshold }),
        url: '/progress',
      }
  }
}
```

Note : `durationMinutes` se dit en heures et minutes ; la clé de catalogue reçoit des minutes et le texte français/anglais les met en forme. Ajouter `minutesToWords` dans `src/i18n/format.ts` si les deux langues divergent — elles ne divergent pas ici (« 1 h 30 » / « 1 h 30 »), donc une seule clé suffit.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- notification-plan`
Expected: PASS, cinq tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/domain/
git commit -m "✨ feat(app): word the notifications from the catalogue"
```

---

## Task 7 : Le catalogue

**Files:**

- Modify: `apps/mobile/src/i18n/messages/fr.ts`, `apps/mobile/src/i18n/messages/en.ts`
- Modify: `apps/mobile/src/i18n/messages/en.ts` : retirer `header.notifications`

**Interfaces:**

- Consumes: les clés employées en Task 6
- Produces: `notifications.*` dans les deux catalogues, à parité

`en.ts` est typé `satisfies typeof fr` : une clé oubliée d'un côté **ne compile pas**. C'est le filet.

- [ ] **Step 1: Write the failing test**

Le test de parité existe déjà (`i18n.test.ts`, « define exactly the same keys »). Il échouera tant que les deux catalogues ne sont pas d'accord, mais il ne vérifie pas que les clés _existent_. Ajouter :

```ts
describe('notification copy', () => {
  it('has both weekly wordings, so the stale one is never a missing key', () => {
    expect(translate('fr', 'notifications.weekly.bodyWithoutFigures')).not.toContain(
      'notifications.',
    )
    expect(
      translate('fr', 'notifications.weekly.bodyWithFigures', {
        rides: 4,
        hours: 6,
        distance: 100,
      }),
    ).not.toContain('notifications.')
    expect(translate('en', 'notifications.weekly.bodyWithoutFigures')).not.toContain(
      'notifications.',
    )
    expect(
      translate('en', 'notifications.weekly.bodyWithFigures', {
        rides: 4,
        hours: 6,
        distance: 100,
      }),
    ).not.toContain('notifications.')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- i18n`
Expected: FAIL — `translate` falls back to the key itself, so the string contains `notifications.`.

- [ ] **Step 3: Write the copy**

Ajouter à `fr.ts` (et l'équivalent anglais à `en.ts`) :

```ts
notifications: {
  section: 'NOTIFICATIONS',

  session: {
    title: 'Ta séance t’attend',
    endurance: 'Endurance',
    tempo: 'Tempo',
    sweetSpot: 'Sweet Spot',
    threshold: 'Seuil',
    vo2Max: 'VO₂ max',
    recovery: 'Récupération',
    duration: '{{minutes}} min',
  },

  weekly: {
    title: 'Ta semaine',
    bodyWithFigures: '{{rides}} sorties · {{hours}} h · {{distance}} km',
    bodyWithoutFigures: 'Ta semaine est prête. Ouvre GRADNT pour la voir.',
  },

  inactivity: {
    title: 'On reprend ?',
    body: 'Ta dernière sortie remonte à quelques jours.',
  },

  milestone: {
    title: 'Objectif avancé',
    body: 'Tu as passé les {{threshold}} % de ton objectif.',
  },

  settings: {
    sessionReminder: 'Rappel de séance',
    reminderHour: 'Heure du rappel',
    weeklySummary: 'Bilan de semaine',
    inactivityNudge: 'Relance d’inactivité',
    permissionDenied: 'Les notifications sont coupées dans les réglages du système.',
    openSystemSettings: 'Ouvrir les réglages',
    channelSessions: 'Rappels de séance',
    channelWeekly: 'Bilan de semaine',
    channelNudges: 'Relances',
  },
},
```

Retirer `header.notifications` des deux catalogues : plus aucun bouton cloche ne l'emploie, et une clé morte est une clé que quelqu'un réintroduira.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- i18n`
Expected: PASS, et le test de parité aussi.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/i18n/
git commit -m "📝 docs(app): write the notification copy in both languages"
```

---

## Task 8 : L'ordonnanceur

**Files:**

- Create: `apps/mobile/src/services/notifications/notification.scheduler.ts`
- Test: `apps/mobile/src/services/notifications/notification.scheduler.test.ts`

**Interfaces:**

- Consumes: `DesiredNotification`, `describeNotification` (Tasks 2–6)
- Produces: `reconcile(desired, translation)`, `ensureChannels()`, `NOTIFICATION_PREFIX`

Le service est écrit pour être testable : il reçoit les primitives d'`expo-notifications` en paramètre plutôt que de les importer directement, ce qui permet un faux ordonnanceur en test.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest'

import { reconcile, type SchedulerPort } from './notification.scheduler'
import type { DesiredNotification } from '@/lib/domain/notification-plan'
import { fr } from '@/i18n/messages/fr'
import { translate, translatePlural } from '@/i18n'

const translation = {
  t: (key: never, params?: never) => translate('fr', key, params as never),
  plural: (key: never, count: number) => translatePlural('fr', key, count),
}

function port(scheduled: { key: string; identifier: string }[] = []) {
  const cancel = vi.fn(async () => {})
  const schedule = vi.fn(async () => 'new-id')

  const scheduler: SchedulerPort = {
    list: async () => scheduled.map(({ key, identifier }) => ({ identifier, key })),
    cancel,
    schedule,
  }

  return { scheduler, cancel, schedule }
}

const session: DesiredNotification = {
  key: 'session:w1',
  kind: 'session',
  fireAt: new Date('2026-09-17T07:00:00.000Z'),
  workout: {
    id: 'w1',
    date: '2026-09-17T07:00:00.000Z',
    type: 'endurance',
    title: 'Endurance fondamentale',
    durationMinutes: 90,
    intensityTarget: 'Facile',
    structure: 'Continu',
    status: 'planned',
    reason: 'Base',
  },
}

describe('reconcile', () => {
  it('schedules what is missing', async () => {
    const { scheduler, schedule } = port()

    await reconcile([session], translation, scheduler)

    expect(schedule).toHaveBeenCalledTimes(1)
  })

  it('cancels what is no longer wanted', async () => {
    const { scheduler, cancel } = port([{ key: 'session:gone', identifier: 'old-id' }])

    await reconcile([session], translation, scheduler)

    expect(cancel).toHaveBeenCalledWith('old-id')
  })

  it('leaves alone what is already scheduled and still wanted', async () => {
    const { scheduler, schedule, cancel } = port([{ key: 'session:w1', identifier: 'kept' }])

    await reconcile([session], translation, scheduler)

    expect(schedule).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('is idempotent: a second pass changes nothing', async () => {
    const { scheduler, schedule, cancel } = port([{ key: 'session:w1', identifier: 'kept' }])

    await reconcile([session], translation, scheduler)
    await reconcile([session], translation, scheduler)

    expect(schedule).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('never touches a notification that is not ours', async () => {
    const { scheduler, cancel } = port([{ key: 'someone-elses', identifier: 'foreign' }])

    await reconcile([], translation, scheduler)

    expect(cancel).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- notification.scheduler`
Expected: FAIL — cannot resolve `./notification.scheduler`.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Translation } from '@/i18n'
import { describeNotification, type DesiredNotification } from '@/lib/domain/notification-plan'

/** Ours, and only ours. Anything without this prefix is left alone. */
export const NOTIFICATION_PREFIX = 'gradnt:'

export type ScheduledSummary = { identifier: string; key: string }

/**
 * The four things we need from expo-notifications, as an interface.
 *
 * Injected rather than imported so the reconciliation — the part where a
 * mistake goes unnoticed for days — can be tested without a device. The real
 * implementation lives in `expoScheduler` below.
 */
export type SchedulerPort = {
  list: () => Promise<ScheduledSummary[]>
  cancel: (identifier: string) => Promise<void>
  schedule: (input: {
    key: string
    title: string
    body: string
    url: string | null
    fireAt: Date
    channelId: string
  }) => Promise<string>
}

export async function reconcile(
  desired: DesiredNotification[],
  translation: Translation,
  scheduler: SchedulerPort,
): Promise<void> {
  const wanted = new Map(desired.map((notification) => [notification.key, notification]))
  const existing = await scheduler.list()

  for (const scheduled of existing) {
    if (
      scheduled.key.startsWith(NOTIFICATION_PREFIX) &&
      !wanted.has(scheduled.key.slice(NOTIFICATION_PREFIX.length))
    ) {
      await scheduler.cancel(scheduled.identifier)
    }
  }

  const present = new Set(
    existing
      .filter((scheduled) => scheduled.key.startsWith(NOTIFICATION_PREFIX))
      .map((scheduled) => scheduled.key.slice(NOTIFICATION_PREFIX.length)),
  )

  for (const [key, notification] of wanted) {
    if (present.has(key)) {
      continue
    }

    const wording = describeNotification(notification, translation)

    await scheduler.schedule({
      key: `${NOTIFICATION_PREFIX}${key}`,
      title: wording.title,
      body: wording.body,
      url: wording.url,
      fireAt: notification.fireAt,
      channelId: CHANNEL_FOR_KIND[notification.kind],
    })
  }
}
```

with

```ts
export const CHANNEL_FOR_KIND = {
  session: 'sessions',
  weekly: 'weekly',
  inactivity: 'nudges',
  milestone: 'weekly',
} as const
```

Then the real adapter, in the same file, importing `expo-notifications`:

```ts
/**
 * The real scheduler.
 *
 * The key travels in `content.data`, because `getAllScheduledNotificationsAsync`
 * hands back identifiers the OS chose, not ours. Reading our own key back is
 * what makes the reconciliation exact rather than a cancel-everything.
 */
export const expoScheduler: SchedulerPort = {
  list: async () => {
    const requests = await Notifications.getAllScheduledNotificationsAsync()

    return requests.flatMap((request) => {
      const key = request.content.data?.gradntKey

      return typeof key === 'string' ? [{ identifier: request.identifier, key }] : []
    })
  },

  cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),

  schedule: ({ key, title, body, url, fireAt, channelId }) =>
    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { gradntKey: key, url },
        color: GRADNT_GREEN,
        // Groups a rider's notifications of one kind in the iOS list, the way
        // the Android channel does on the other platform.
        threadIdentifier: channelId,
        // 'passive' for the summary, so it lands in the list without lighting
        // the screen: a weekly digest that wakes someone is one they switch off.
        interruptionLevel: channelId === 'sessions' ? 'active' : 'passive',
      },
      trigger:
        fireAt.getTime() <= Date.now()
          ? null
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId },
    }),
}
```

**Important :** le déclencheur `DATE` prend un `Date` local ; `fireAt` est déjà construit en composants locaux (Task 2), donc rien à convertir.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- notification.scheduler`
Expected: PASS, cinq tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/services/notifications/
git commit -m "✨ feat(app): reconcile what is scheduled against what is wanted"
```

---

## Task 9 : Les canaux Android, et le handler

**Files:**

- Modify: `apps/mobile/src/services/notifications/notification.scheduler.ts`

**Interfaces:**

- Produces: `ensureChannels()`

Les canaux doivent exister **avant** la demande de permission : sur Android 13, le prompt système n'apparaît pas tant qu'aucun canal n'existe.

- [ ] **Step 1: Write the failing test**

`ensureChannels` ne fait qu'appeler la plateforme ; son intérêt est d'exister avant la demande. Le test vérifie l'intention, pas l'appel natif :

```ts
import { CHANNEL_FOR_KIND } from './notification.scheduler'

describe('channels', () => {
  it('has one per kind, so an OS-level mute maps to one of our switches', () => {
    expect(new Set(Object.values(CHANNEL_FOR_KIND))).toEqual(
      new Set(['sessions', 'weekly', 'nudges']),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- notification.scheduler`
Expected: FAIL si `CHANNEL_FOR_KIND` n'est pas exporté.

- [ ] **Step 3: Write minimal implementation**

```ts
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

const CHANNELS = [
  {
    id: 'sessions',
    nameKey: 'notifications.settings.channelSessions',
    importance: Notifications.AndroidImportance.HIGH,
  },
  {
    id: 'weekly',
    nameKey: 'notifications.settings.channelWeekly',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  {
    id: 'nudges',
    nameKey: 'notifications.settings.channelNudges',
    importance: Notifications.AndroidImportance.LOW,
  },
] as const

/**
 * Creates the channels, and is safe to call on every launch.
 *
 * Android lets an app change only a channel's name after creation, so the
 * importance set here is the importance for the life of the install — which is
 * the point: the rider can then lower it themselves in system settings, per
 * channel, and that survives everything we do.
 */
export async function ensureChannels(translation: Translation): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  for (const channel of CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: translation.t(channel.nameKey as never),
      importance: channel.importance,
      lightColor: GRADNT_GREEN,
    })
  }
}
```

And at **module scope**, not inside a component, because the handler must be registered before any notification arrives:

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    // No badge: there is no history, so a count would announce unread things
    // that do not exist.
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- notification.scheduler`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/services/notifications/
git commit -m "✨ feat(app): give each kind its own Android channel"
```

---

## Task 10 : Le point d'entrée unique

**Files:**

- Create: `apps/mobile/src/features/app/hooks/use-notification-sync.ts`
- Modify: `apps/mobile/src/app/_layout.tsx`

**Interfaces:**

- Consumes: `planNotifications`, `reconcile`, `expoScheduler`, `ensureChannels`, `useActivitiesQuery`, `useUpcomingWorkoutsQuery`, `useGoalQuery`, `useCurrentGoalValueQuery`, `usePreferencesStore`, `useTranslation`
- Produces: le hook `useNotificationSync()`

- [ ] **Step 1: Write the failing test**

Ce hook est un assemblage ; ce qui se teste, c'est que **les cinq déclencheurs** sont bien dans la liste des dépendances. Un test de comportement demanderait un renderer. On teste donc la fonction pure qui décide si l'on doit réconcilier :

```ts
import { describe, expect, it } from 'vitest'
import { syncFingerprint } from './use-notification-sync'

describe('syncFingerprint', () => {
  it('changes when the language changes', () => {
    const base = { workouts: [], lastSyncedAt: 0, preferences: {}, language: 'fr' }

    expect(syncFingerprint({ ...base, language: 'en' })).not.toBe(syncFingerprint(base))
  })

  it('changes when a workout moves', () => {
    const a = {
      workouts: [{ id: 'w1', status: 'planned' }],
      lastSyncedAt: 0,
      preferences: {},
      language: 'fr',
    }
    const b = {
      workouts: [{ id: 'w1', status: 'moved' }],
      lastSyncedAt: 0,
      preferences: {},
      language: 'fr',
    }

    expect(syncFingerprint(a)).not.toBe(syncFingerprint(b))
  })

  it('is stable when nothing meaningful changed', () => {
    const value = {
      workouts: [{ id: 'w1', status: 'planned' }],
      lastSyncedAt: 7,
      preferences: { a: true },
      language: 'fr',
    }

    expect(syncFingerprint(value)).toBe(syncFingerprint({ ...value }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- use-notification-sync`
Expected: FAIL — module absent.

- [ ] **Step 3: Write minimal implementation**

```ts
import { useEffect, useMemo } from 'react'
import { AppState } from 'react-native'

import { useTranslation } from '@/i18n'
import { planNotifications } from '@/lib/domain/notification-plan'
import {
  ensureChannels,
  expoScheduler,
  reconcile,
} from '@/services/notifications/notification.scheduler'

import {
  useActivitiesQuery,
  useCurrentGoalValueQuery,
  useGoalQuery,
  useUpcomingWorkoutsQuery,
} from '@/hooks/use-gradnt-data'
import { usePreferencesStore } from '../store/preferences.store'

/**
 * A string that changes exactly when the desired set could change.
 *
 * Cheaper than a deep comparison and honest about what matters: the reconcile
 * is idempotent, so an extra run costs one native call and an unnecessary run
 * costs nothing.
 */
export function syncFingerprint(input: {
  workouts: { id: string; status: string }[]
  lastSyncedAt: number
  preferences: Record<string, unknown>
  language: string
}): string {
  return JSON.stringify(input)
}
```

Then the hook. The five triggers are: mount, return to foreground, `workoutsQuery.data`, `lastSyncedAt` (from `dataUpdatedAt`), the notification preferences, and the language.

Les trois dérivations dont le hook a besoin, définies ici et pas ailleurs :

```ts
/** The most recent ride we know about, or null. */
function latestActivityAt(activities: Activity[]): string | null {
  return activities.reduce<string | null>(
    (latest, activity) =>
      latest === null || activity.startAt > latest ? activity.startAt : latest,
    null,
  )
}

/** The last seven days, from the same selectors the Progress screen reads. */
function weeklySummaryFrom(activities: Activity[]): WeeklySummary {
  return {
    rides: getWeeklyRideCount(activities),
    hours: getRecentTrainingVolumeHours({
      durationSeconds: activities.reduce((total, a) => total + a.durationSeconds, 0),
    } as never),
    distanceKm: getTotalDistanceKm(activities),
    elevationGainM: getTotalElevationGainMeters(activities),
  }
}

/** The goal, and how far along it is, or null when there is nothing to celebrate. */
function goalProgress(
  goal: Goal | undefined,
  progress: number,
): { key: string; progress: number } | null {
  return goal === undefined ? null : { key: goal.type, progress }
}
```

Le hook, avec **un seul** `useEffect` qui possède `run` — deux effets ne partagent pas de portée, et c'est l'erreur facile ici :

```ts
export function useNotificationSync(): void {
  const translation = useTranslation()
  const language = useAppLanguage()
  const reminded = usePreferencesStore((state) => state.sessionReminder)
  const hour = usePreferencesStore((state) => state.reminderHour)
  const minute = usePreferencesStore((state) => state.reminderMinute)
  const weekly = usePreferencesStore((state) => state.weeklySummary)
  const nudge = usePreferencesStore((state) => state.inactivityNudge)
  const celebrated = usePreferencesStore((state) => state.celebratedThresholds)
  const setCelebrated = usePreferencesStore((state) => state.setCelebrated)

  const activitiesQuery = useActivitiesQuery()
  const workoutsQuery = useUpcomingWorkoutsQuery()
  const goalQuery = useGoalQuery()
  const currentValueQuery = useCurrentGoalValueQuery()

  const activities = activitiesQuery.data ?? []
  const workouts = workoutsQuery.data ?? []
  const progress = getGoalProgressPercentage(
    goalQuery.data ?? null,
    currentValueQuery.data?.value ?? null,
  )

  /**
   * TanStack Query already records when it last read successfully, so the
   * freshness rule needs no storage of its own.
   */
  const lastSyncedAt = activitiesQuery.dataUpdatedAt
    ? new Date(activitiesQuery.dataUpdatedAt).toISOString()
    : null

  const preferences = {
    sessionReminder: reminded,
    reminderHour: hour,
    reminderMinute: minute,
    weeklySummary: weekly,
    inactivityNudge: nudge,
  }

  const fingerprint = syncFingerprint({
    workouts: workouts.map((workout) => ({ id: workout.id, status: workout.status })),
    lastSyncedAt: activitiesQuery.dataUpdatedAt,
    preferences,
    language,
  })

  useEffect(() => {
    if (Platform.OS === 'web') {
      return
    }

    const run = async () => {
      const now = new Date()

      await ensureChannels(translation)

      const desired = planNotifications({
        workouts,
        preferences,
        lastActivityAt: latestActivityAt(activities),
        lastSyncedAt,
        weeklySummary: weeklySummaryFrom(activities),
        goal: goalProgress(goalQuery.data, progress),
        celebrated,
        now,
      })

      await reconcile(desired, translation, expoScheduler)

      // Remembered only once it has actually been scheduled, so a reconcile that
      // failed does not silently swallow the milestone.
      for (const notification of desired) {
        if (notification.kind === 'milestone' && notification.fireAt <= now) {
          setCelebrated(goalQuery.data?.type ?? 'unknown', notification.threshold)
        }
      }
    }

    void run()

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void run()
      }
    })

    return () => subscription.remove()
  }, [fingerprint, translation, setCelebrated])
}
```

Ce qui est dans les dépendances et ce qui n'y est pas est délibéré : tout passe par `fingerprint` sauf `translation`, qui change d'identité à chaque rendu et ferait boucler l'effet — il est lu à l'intérieur de `run`, où sa valeur du moment suffit.

Ajouter `celebratedThresholds: z.record(z.string(), z.number()).default({})` au schéma de la Task 1, et au store un `setCelebrated(goalKey, threshold)` qui garde **le plus haut** atteint : `Math.max(existing, threshold)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- use-notification-sync`
Expected: PASS, trois tests.

- [ ] **Step 5: Mount it**

Dans `src/app/_layout.tsx`, sous `PreferencesHydration` (sans préférences hydratées, on programmerait avec les défauts) et à l'intérieur de `GradntQueryProvider` (le hook lit des requêtes) :

```tsx
<GradntNotificationSync />
```

un petit composant qui appelle le hook et rend `null`, comme `PreferencesHydration` rend ses enfants. Il doit être sous `PreferencesHydration` : sans préférences hydratées, on programmerait avec les défauts.

- [ ] **Step 6: Run everything**

Run: `pnpm --filter @gradnt/mobile exec tsc --noEmit && pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/features/app/ apps/mobile/src/app/_layout.tsx
git commit -m "✨ feat(app): reconcile from one place, on five triggers"
```

---

## Task 11 : Le deep link au tap, et le réveil à froid

**Files:**

- Create: `apps/mobile/src/features/app/components/NotificationObserver.tsx`
- Modify: `apps/mobile/src/app/_layout.tsx`

**Interfaces:**

- Consumes: `Notifications.getLastNotificationResponse()`, `addNotificationResponseReceivedListener`
- Produces: l'observateur monté au niveau racine

Le lien froid compte autant que le chaud : un tap qui lance l'app depuis l'arrêt total passe par `getLastNotificationResponse()`, pas par le listener.

- [ ] **Step 1: Write the implementation**

Le code suit le motif que la doc Expo Router donne pour ce cas exact :

```tsx
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'

/**
 * Routes a tap on a notification to the screen it names.
 *
 * Two paths, because there are two: with the app running the listener fires,
 * and from a cold start it never does — the response is already sitting in
 * `getLastNotificationResponse()` by the time React mounts.
 */
export function NotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url

      if (typeof url === 'string') {
        router.push(url as never)
      }
    }

    const last = Notifications.getLastNotificationResponse()

    if (last?.notification) {
      redirect(last.notification)
      // Cleared, or every later cold start would replay the same route.
      Notifications.clearLastNotificationResponse()
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification)
    })

    return () => subscription.remove()
  }, [])

  return null
}
```

- [ ] **Step 2: Mount it**

Dans `src/app/_layout.tsx`, sous le `Stack`.

- [ ] **Step 3: Verify by hand**

Build et installe, puis :

```bash
adb shell cmd notification post -S bigtext -t "Test" gradnt "hello"
```

Expected: rien, la notification n'est pas la nôtre — mais l'app ne plante pas. Le vrai test est manuel : programmer un rappel, attendre, taper, vérifier l'écran.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/app/components/NotificationObserver.tsx apps/mobile/src/app/_layout.tsx
git commit -m "✨ feat(app): open the screen a notification names"
```

---

## Task 12 : La section de Réglages

**Files:**

- Create: `apps/mobile/src/design-system/components/primitives/GradntSwitch.tsx`
- Create: `apps/mobile/src/features/app/screens/NotificationSettingsSection.tsx`
- Modify: `apps/mobile/src/design-system/components/primitives/index.ts`
- Modify: `apps/mobile/src/features/app/screens/SettingsScreen.tsx`
- Modify: `apps/mobile/src/features/app/components/AppHeader.tsx`

**Interfaces:**

- Consumes: `usePreferencesStore`, `requestPermissionsAsync`, `getPermissionsAsync`
- Produces: `GradntSwitch`, `NotificationSettingsSection`

**Pourquoi un `GradntSwitch` et pas `GradntChip` :** `GradntChip` porte `accessibilityRole="radio"` — c'est un choix parmi plusieurs. Un booléen n'est pas un radio, et le dire à un lecteur d'écran (« radio, sélectionné ») décrit mal ce qu'on règle. `Switch` est le rôle natif, et il est déjà natif sur les deux plateformes.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'

// The primitive is presentational; what is worth pinning is that the section
// asks for the permission when a switch goes on, and only then.
import { shouldRequestPermission } from './NotificationSettingsSection'

describe('shouldRequestPermission', () => {
  it('asks when a switch is turned on and consent is undecided', () => {
    expect(shouldRequestPermission(false, true, 'undetermined')).toBe(true)
  })

  it('does not ask when switching something off', () => {
    expect(shouldRequestPermission(true, false, 'undetermined')).toBe(false)
  })

  it('does not ask again once granted', () => {
    expect(shouldRequestPermission(false, true, 'granted')).toBe(false)
  })

  it('does not re-prompt after a refusal, which the OS would ignore anyway', () => {
    expect(shouldRequestPermission(false, true, 'denied')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- NotificationSettingsSection`
Expected: FAIL — module absent.

- [ ] **Step 3: Write the primitive**

```tsx
import { Switch } from 'react-native'
import { XStack } from 'tamagui'

import { useThemeColor } from '../../hooks/useThemeColor'
import { GradntText } from './GradntText'

type GradntSwitchProps = {
  label: string
  value: boolean
  onValueChange: (value: boolean) => void
}

/**
 * A boolean, as a switch.
 *
 * Not `GradntChip`: that one carries `role="radio"`, which tells a screen
 * reader it is one of a set. This is not a set, it is on or off.
 */
export function GradntSwitch({ label, value, onValueChange }: GradntSwitchProps) {
  const accent = useThemeColor()('accent')
  const border = useThemeColor()('border')

  return (
    <XStack justifyContent="space-between" alignItems="center" gap="$3">
      <GradntText fontSize={15}>{label}</GradntText>

      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: accent, false: border }}
      />
    </XStack>
  )
}
```

- [ ] **Step 4: Write the section**

```tsx
export type PermissionState = 'undetermined' | 'granted' | 'denied'

export function shouldRequestPermission(
  wasOn: boolean,
  isOn: boolean,
  permission: PermissionState,
): boolean {
  return !wasOn && isOn && permission === 'undetermined'
}
```

```tsx
export function NotificationSettingsSection() {
  const translation = useTranslation()
  const { t } = translation
  const preferences = usePreferencesStore()
  const [permission, setPermission] = useState<PermissionState>('undetermined')

  useEffect(() => {
    void getPermissionsAsync().then((status) => {
      /**
       * `ios.status` and not the root `status`: iOS is finer-grained than
       * Android, and `PROVISIONAL` — quiet delivery, no prompt — counts as
       * authorised even though the root status does not say `granted`.
       */
      const granted = status.granted || status.ios?.status === IosAuthorizationStatus.PROVISIONAL

      setPermission(granted ? 'granted' : status.canAskAgain ? 'undetermined' : 'denied')
    })
  }, [])

  /**
   * Asked when a switch goes on, never on launch.
   *
   * A prompt at first launch is refused, and a refusal is usually permanent.
   * Asked the moment the rider reaches for the feature, the prompt answers
   * something they just did.
   *
   * The channels come first because Android 13 will not show the prompt at all
   * until one exists.
   */
  const enable = async (wasOn: boolean, isOn: boolean, apply: () => void) => {
    if (!shouldRequestPermission(wasOn, isOn, permission)) {
      apply()
      return
    }

    await ensureChannels(translation)
    const status = await requestPermissionsAsync()
    const granted = status.granted || status.ios?.status === IosAuthorizationStatus.PROVISIONAL

    setPermission(granted ? 'granted' : 'denied')

    if (granted) {
      apply()
    }
  }

  return (
    <YStack gap="$4">
      <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
        {t('notifications.section')}
      </GradntText>

      <GradntCard gap="$4" padding="$4">
        <GradntSwitch
          label={t('notifications.settings.sessionReminder')}
          value={preferences.sessionReminder}
          onValueChange={(value) =>
            void enable(preferences.sessionReminder, value, () =>
              preferences.setSessionReminder(value),
            )
          }
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
          onValueChange={(value) =>
            void enable(preferences.weeklySummary, value, () => preferences.setWeeklySummary(value))
          }
        />

        <GradntSwitch
          label={t('notifications.settings.inactivityNudge')}
          value={preferences.inactivityNudge}
          onValueChange={(value) =>
            void enable(preferences.inactivityNudge, value, () =>
              preferences.setInactivityNudge(value),
            )
          }
        />
      </GradntCard>

      {permission === 'denied' ? (
        <XStack gap="$2" alignItems="center">
          <GradntText muted fontSize={13} flex={1}>
            {t('notifications.settings.permissionDenied')}
          </GradntText>

          <GradntButton tone="secondary" minHeight={40} onPress={() => void Linking.openSettings()}>
            {t('notifications.settings.openSystemSettings')}
          </GradntButton>
        </XStack>
      ) : null}
    </YStack>
  )
}
```

`translation` est capturé **au niveau du composant**, jamais appelé depuis le callback : `useTranslation` est un hook, et l'appeler dans une fonction asynchrone viole les règles des hooks.

`GradntHourStepper`, dans le même fichier : deux `GradntIconButton` (`Minus` / `Plus`) autour d'un `GradntText` en `accessibilityRole="adjustable"` avec les actions `increment` / `decrement`, borné à 0–23 h avec un pas de 15 minutes.

Ajouter au store `setSessionReminder`, `setReminderTime`, `setWeeklySummary`, `setInactivityNudge`, sur le modèle exact des `setLanguage`/`setAppearance` existants (même `persist(next)`).

- [ ] **Step 5: Mount, and remove the bell**

Dans `SettingsScreen.tsx` : la section se place **avant** « APPARENCE ET LANGUE », parce qu'elle concerne les notifications avant les préférences d'affichage — non, l'inverse : garder Apparence et langue en premier, c'est ce que le commentaire existant justifie (« ce que quelqu'un cherche quand l'écran est dans une langue qu'il n'a pas choisie »). La section Notifications vient **après**.

Dans `AppHeader.tsx` : retirer le `GradntIconButton` de la cloche et l'import `Bell`.

- [ ] **Step 6: Run everything**

Run: `pnpm --filter @gradnt/mobile exec tsc --noEmit && pnpm --filter @gradnt/mobile exec eslint . --max-warnings=0 && pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/
git commit -m "✨ feat(app): let the rider choose what GRADNT says and when"
```

---

## Task 13 : La configuration native, et le contrôle device

**Files:**

- Modify: `apps/mobile/app.json`

**Interfaces:**

- Produces: `SCHEDULE_EXACT_ALARM` dans le manifest régénéré

- [ ] **Step 1: Add the permission**

```json
"android": {
  "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"]
}
```

- [ ] **Step 2: Regenerate and verify**

```bash
cd apps/mobile && npx expo prebuild --clean --platform android --no-install
grep -c "SCHEDULE_EXACT_ALARM" android/app/src/main/AndroidManifest.xml
```

Expected: `1`.

Sans elle, Android 12+ ne peut pas déclencher à une heure exacte : un rappel de 07:00 dérive. Elle doit vivre ici et pas dans `android/`, qui est gitignoré — c'est le piège déjà rencontré avec les chaînes de localisation.

- [ ] **Step 3: The device-level trigger check**

Le pur ne peut pas attraper une erreur de forme de déclencheur. Ajouter un contrôle manuel, à lancer une fois sur l'émulateur, dans le même esprit que les vérifications au pixel déjà faites :

```ts
// Not a committed test: run it once, by hand, and read the log.
const next = await Notifications.getNextTriggerDateAsync({
  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
  weekday: WEEKLY_WEEKDAY, // 1
  hour: WEEKLY_HOUR, // 18
  minute: WEEKLY_MINUTE, // 0
})

console.log('prochain bilan :', new Date(next), '— attendu un dimanche 18:00')
```

Expected: un dimanche, 18:00 locales. `weekday` va de 1 à 7 avec **1 = dimanche** — un décalage ici ferait sonner le bilan le lundi, et rien dans le code ne le dirait.

- [ ] **Step 4: Build and install**

```bash
npx expo run:android --variant release
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app.json
git commit -m "🔧 chore(app): let Android fire a reminder at an exact hour"
```

---

## Ce que ce plan ne fait pas

- **Pas de boutons d'action.** `categoryIdentifier` est iOS seulement dans `NotificationContentInput` ; une action qui écrit de la donnée doit tourner app fermée, ce qui demande `expo-task-manager`.
- **Pas de badge**, pas d'historique, pas de serveur.
- **Pas de correction du français stocké dans le plan.** Les notifications dérivent de `workout.type`, donc elles sont bilingues ; `PlanScreen` continue d'afficher `workout.title` en français. C'est le chantier « Suites » du spec, et il touche le modèle de données.
