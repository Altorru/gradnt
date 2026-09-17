/** Browser storage. Native builds resolve local-storage.native.ts instead. */
export const localStorage = {
  async getItem(key: string): Promise<string | null> {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') throw new Error('storage_unavailable')
    window.localStorage.setItem(key, value)
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') throw new Error('storage_unavailable')
    window.localStorage.removeItem(key)
  },
}
