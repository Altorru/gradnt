import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Tests run from the repository root, but `@/` is the mobile app's source alias
 * — the convention every module under `apps/mobile/src` already imports
 * through. Without this, a test silently cannot load any module that uses it,
 * which is why the suites here had been written with relative paths instead.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/mobile/src', import.meta.url)),
    },
  },
})
