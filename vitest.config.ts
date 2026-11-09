import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // Tests share one database, so they must not race each other.
    fileParallelism: false,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
