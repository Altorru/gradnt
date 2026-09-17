export type StringStorage = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

/** SecureStore values stay below 2 KB, even with multibyte user metadata. */
export function createChunkedStorage(storage: StringStorage): StringStorage {
  let pending: Promise<unknown> = Promise.resolve()
  let sequence = 0
  function serial<T>(task: () => Promise<T>): Promise<T> {
    const result = pending.then(task)
    pending = result.catch(() => undefined)
    return result
  }
  async function manifest(key: string): Promise<{ generation: string; count: number } | null> {
    const value = await storage.getItem(`${key}.manifest`)
    if (value === null) return null
    const parsed: unknown = JSON.parse(value)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('generation' in parsed) ||
      typeof parsed.generation !== 'string' ||
      !/^[0-9-]+$/.test(parsed.generation) ||
      !('count' in parsed) ||
      typeof parsed.count !== 'number' ||
      !Number.isInteger(parsed.count) ||
      parsed.count < 0 ||
      parsed.count > 1000
    ) {
      throw new Error('invalid_auth_storage')
    }
    return { generation: parsed.generation, count: parsed.count }
  }
  function chunkKey(key: string, generation: string, index: number) {
    return `${key}.${generation}.${index}`
  }
  async function cleanup(key: string, old: { generation: string; count: number } | null) {
    if (!old) return
    await Promise.allSettled(
      Array.from({ length: old.count }, (_, index) =>
        storage.removeItem(chunkKey(key, old.generation, index)),
      ),
    )
  }
  return {
    getItem: (key) =>
      serial(async () => {
        const current = await manifest(key)
        if (!current) return null
        const chunks = await Promise.all(
          Array.from({ length: current.count }, (_, index) =>
            storage.getItem(chunkKey(key, current.generation, index)),
          ),
        )
        if (chunks.some((chunk) => chunk === null)) throw new Error('incomplete_auth_storage')
        return chunks.join('')
      }),
    setItem: (key, value) =>
      serial(async () => {
        const old = await manifest(key)
        const generation = `${Date.now()}-${++sequence}`
        const chunks = value.match(/[\s\S]{1,450}/gu) ?? []
        try {
          for (const [index, chunk] of chunks.entries()) {
            await storage.setItem(chunkKey(key, generation, index), chunk)
          }
          // Switch generations only once every chunk is durable.
          await storage.setItem(
            `${key}.manifest`,
            JSON.stringify({ generation, count: chunks.length }),
          )
        } catch (error) {
          await cleanup(key, { generation, count: chunks.length })
          throw error
        }
        await cleanup(key, old)
      }),
    removeItem: (key) =>
      serial(async () => {
        const old = await manifest(key)
        await storage.removeItem(`${key}.manifest`)
        await cleanup(key, old)
      }),
  }
}
