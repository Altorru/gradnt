import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod'

const ftpHistoryStorageKey = 'gradnt.ftp.history.v1'

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
export async function loadFtpHistory(): Promise<FtpEntry[]> {
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

/**
 * Appends a figure to the history.
 *
 * A history rather than a single value: an FTP that only ever holds its latest
 * reading cannot show whether the rider is improving, which is the point of
 * tracking it at all.
 */
export async function recordFtp(entry: FtpEntry): Promise<void> {
  const history = await loadFtpHistory()
  const next = [...history, ftpEntrySchema.parse(entry)].sort(
    (left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt),
  )

  await writeStoredValue(JSON.stringify(next))
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
