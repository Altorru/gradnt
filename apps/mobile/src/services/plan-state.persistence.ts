import { z } from 'zod'

import { weeklyAvailabilitySchema } from '@/features/onboarding/domain/availability.schema'
import { cyclistGoalSchema } from '@/features/onboarding/domain/goal.schema'
import { cyclistProfileSchema } from '@/features/onboarding/domain/profile.schema'
import { trainingPlanSchema } from '@/lib/domain'

import { localStorage } from './local-storage'
import { readCloudDocument, writeCloudDocument, type CloudMetadata } from './supabase/documents'

const storageKey = 'gradnt.training-plan.v1'

export const planInputsSchema = z.object({
  profile: cyclistProfileSchema,
  goal: cyclistGoalSchema,
  availability: weeklyAvailabilitySchema,
})

export const storedPlanStateSchema = z.object({
  schemaVersion: z.literal(1),
  plan: trainingPlanSchema,
  inputs: planInputsSchema,
  archivedPlans: z.array(trainingPlanSchema),
})

export type PlanInputs = z.infer<typeof planInputsSchema>
export type StoredPlanState = z.infer<typeof storedPlanStateSchema> & { cloud?: CloudMetadata }

export async function loadPlanState(): Promise<StoredPlanState | null> {
  const document = await readCloudDocument('training_plan')
  if (document.mode === 'cloud') {
    return document.value === null
      ? null
      : {
          ...storedPlanStateSchema.parse(document.value),
          cloud: document.metadata,
        }
  }
  const stored = await localStorage.getItem(storageKey)
  // A damaged or unreadable plan is an error, never permission to overwrite it.
  return stored === null ? null : storedPlanStateSchema.parse(JSON.parse(stored))
}

export async function savePlanState(state: StoredPlanState): Promise<void> {
  const payload = storedPlanStateSchema.parse(state)
  if (state.cloud) {
    await writeCloudDocument('training_plan', payload, state.cloud)
    return
  }
  const document = await readCloudDocument('training_plan')
  if (document.mode === 'cloud') {
    if (document.value !== null) throw new Error('document_conflict')
    await writeCloudDocument('training_plan', payload, document.metadata)
    return
  }
  await localStorage.setItem(storageKey, JSON.stringify(payload))
}
