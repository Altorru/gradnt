import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod'
import {
  readCloudDocument,
  writeCloudDocument,
  type CloudMetadata,
} from '@/services/supabase/documents'

const ftpHistoryStorageKey = 'gradnt.ftp.history.v1'
const ftpDocumentSchema = z.object({
  entries: z.array(
    z.object({
      value: z.number().positive(),
      source: z.enum(['strava', 'declared']),
      recordedAt: z.string().datetime(),
    }),
  ),
})

/**
 * Where an FTP figure came from.
 *
 * `strava` is a deduction, not a reading: Strava does not expose FTP, so the
 * value is inverted from the power-zone boundary it computed. It is marked
 * distinctly so the UI can say so rather than presenting an inference as a
 * measurement the rider made.
 */
export const ftpSourceSchema = z.enum(['strava', 'declared'])

export const ftpEntrySchema = z.object({
  value: z.number().positive(),
  source: ftpSourceSchema,
  recordedAt: z.string().datetime(),
})

export const ftpHistorySchema = z.array(ftpEntrySchema)

export type FtpEntry = z.infer<typeof ftpEntrySchema>
export type FtpSource = z.infer<typeof ftpSourceSchema>

async function readStoredValue(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(ftpHistoryStorageKey)
  }

  return SecureStore.getItemAsync(ftpHistoryStorageKey)
}

async function writeStoredValue(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ftpHistoryStorageKey, value)
    }

    return
  }

  await SecureStore.setItemAsync(ftpHistoryStorageKey, value)
}

/** The history, oldest first. Empty when nothing has been recorded or it is unreadable. */
async function loadLocalFtpHistory(): Promise<FtpEntry[]> {
  try {
    const storedValue = await readStoredValue()

    if (!storedValue) {
      return []
    }

    const result = ftpHistorySchema.safeParse(JSON.parse(storedValue))
    return result.success ? result.data : []
  } catch {
    return []
  }
}

async function currentHistory(): Promise<{ entries: FtpEntry[]; cloud?: CloudMetadata }> {
  const document = await readCloudDocument('ftp_history')
  if (document.mode === 'local') return { entries: await loadLocalFtpHistory() }
  return {
    entries: document.value === null ? [] : ftpDocumentSchema.parse(document.value).entries,
    cloud: document.metadata,
  }
}

export async function loadFtpHistory(): Promise<FtpEntry[]> {
  return (await currentHistory()).entries
}

let migration: Promise<void> | null = null

/** Transfer an old device-only FTP history once after the GRADNT account exists. */
export function migrateLegacyFtpHistoryToCloud(): Promise<void> {
  if (migration) return migration
  const task = (async () => {
    const document = await readCloudDocument('ftp_history')
    if (document.mode !== 'cloud' || document.value !== null) return
    const entries = await loadLocalFtpHistory()
    if (entries.length === 0) return
    await writeCloudDocument('ftp_history', { entries }, document.metadata)
    await clearFtpHistory()
  })().finally(() => {
    migration = null
  })
  migration = task
  return task
}

let writes: Promise<unknown> = Promise.resolve()

function updateHistory(change: (entries: FtpEntry[]) => FtpEntry[]): Promise<void> {
  const task = writes.then(async () => {
    const state = await currentHistory()
    const entries = ftpHistorySchema.parse(change(state.entries))
    if (state.cloud) await writeCloudDocument('ftp_history', { entries }, state.cloud)
    else await writeStoredValue(JSON.stringify(entries))
  })
  writes = task.catch(() => undefined)
  return task
}

/**
 * Appends a figure to the history.
 *
 * A history rather than a single value: an FTP that only ever holds its latest
 * reading cannot show whether the rider is improving, which is the point of
 * tracking it at all.
 */
export async function recordFtp(entry: FtpEntry): Promise<void> {
  await updateHistory((history) =>
    [...history, ftpEntrySchema.parse(entry)].sort(
      (left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt),
    ),
  )
}

/**
 * Removes the reading recorded at that instant.
 *
 * Identified by its timestamp rather than its position: the history is sorted
 * by time, and an index would point at a different reading once anything else
 * is added or removed.
 */
export async function deleteFtpEntry(recordedAt: string): Promise<void> {
  await updateHistory((history) => history.filter((entry) => entry.recordedAt !== recordedAt))
}

/** Replaces the reading recorded at that instant, keeping it in date order. */
export async function updateFtpEntry(entry: FtpEntry): Promise<void> {
  await updateHistory((history) =>
    history
      .map((current) =>
        current.recordedAt === entry.recordedAt ? ftpEntrySchema.parse(entry) : current,
      )
      .sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt)),
  )
}

/** The most recent figure in the history, or null when there is none. */
export async function loadCurrentFtp(): Promise<number | null> {
  const history = await loadFtpHistory()
  const latest = history.at(-1)

  return latest?.value ?? null
}

export async function clearFtpHistory(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ftpHistoryStorageKey)
    }

    return
  }

  await SecureStore.deleteItemAsync(ftpHistoryStorageKey)
}
