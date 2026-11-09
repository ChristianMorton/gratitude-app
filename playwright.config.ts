import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests: a real browser against a real server against a real database.
 *
 * The vitest suite covers `src/server/**` in isolation and is fast; it cannot see
 * anything that only exists in a browser. Every bug found in this app so far —
 * an un-hydrated login form GETting a password into the URL, posts saving but
 * never appearing, a grid column blowing out on one long word — passed typecheck,
 * lint, and all 35 unit tests. Those failures live here.
 *
 * Its own port (3100) and its own build dir, so it can run alongside the dev
 * server. It talks to the LOCAL Supabase stack — never the hosted project, which
 * would collect a real user account on every single run.
 */

const PORT = 3100
export const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  // vitest owns tests/**/*.test.ts; this owns tests/e2e/**/*.spec.ts. No overlap.
  testMatch: '**/*.spec.ts',
  // Compiles every route once before tests, so no test pays the cold-compile bill.
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // A dev hub sharing a box with ~25 containers, and a Next dev server that
  // compiles routes on first hit. Two workers, not one per core.
  workers: 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run dev',
    url: `${BASE_URL}/api/health`,
    // Never reuse the :3000 dev server — it points at the development database.
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      PORT: String(PORT),
      // Its own build dir, so this can run while the :3000 dev server is up.
      NEXT_DIST_DIR: '.next-e2e',
      // Everything else — Supabase URL and keys — comes from .env, which Next
      // loads itself. The suite points at the LOCAL stack; see .env.example for
      // why it must never point at the hosted project.
    },
  },
})
