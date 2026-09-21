import { z } from 'zod'

import { localStorage } from './local-storage'
import { readCloudDocument, writeCloudDocument, type CloudMetadata } from './supabase/documents'

const storageKey = 'gradnt.availability-exceptions.v1'

export const availabilityExceptionSchema = z.object({
  date: z.string().datetime(),
  available: z.literal(false),
  note: z.string().trim().max(300),
  createdAt: z.string().datetime(),
})

const listSchema = z.array(availabilityExceptionSchema)
export type AvailabilityException = z.infer<typeof availabilityExceptionSchema>

export type AvailabilityExceptionState = {
  exceptions: AvailabilityException[]
  cloud?: CloudMetadata
}

export async function loadAvailabilityExceptions(): Promise<AvailabilityExceptionState> {
  const document = await readCloudDocument('availability_exceptions')
  if (document.mode === 'cloud') {
    return {
      exceptions: document.value === null ? [] : listSchema.parse(document.value),
      cloud: document.metadata,
    }
  }
  const stored = await localStorage.getItem(storageKey)
  return { exceptions: stored === null ? [] : listSchema.parse(JSON.parse(stored)) }
}

export async function saveAvailabilityException(
  exception: Omit<AvailabilityException, 'createdAt'>,
): Promise<AvailabilityExceptionState> {
  const current = await loadAvailabilityExceptions()
  const next = listSchema
    .parse([
      ...current.exceptions.filter((item) => item.date !== exception.date),
      { ...exception, createdAt: new Date().toISOString() },
    ])
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  if (current.cloud) {
    const revision = await writeCloudDocument('availability_exceptions', next, current.cloud)
    return { exceptions: next, cloud: revision }
  }
  await localStorage.setItem(storageKey, JSON.stringify(next))
  return { exceptions: next }
}
