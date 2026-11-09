/**
 * Warm the dev server before any test runs.
 *
 * `next dev` compiles a route the first time it's asked for. Whichever test hits a
 * route first therefore pays the compile bill: the same test takes 5s warm and
 * blows a 30s budget cold. That's the whole cause of the flake — nothing to do
 * with the app, everything to do with whoever went first.
 *
 * Compiling every route here, once, sequentially, means every test measures the
 * app rather than the toolchain.
 */

const PORT = 3100
const BASE = `http://localhost:${PORT}`

// Signed-out requests still compile the route before redirecting, which is all we need.
const ROUTES = ['/api/health', '/login', '/register', '/feed', '/friends', '/map']

async function waitForServer(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/api/health`)
      if (response.ok) return
    } catch {
      // Not up yet. Playwright may start webServer either side of globalSetup, so
      // this waits rather than assuming an order.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`e2e server never became healthy at ${BASE}`)
}

export default async function globalSetup() {
  await waitForServer()
  for (const route of ROUTES) {
    // Sequential on purpose: parallel cold compiles are what we're avoiding.
    await fetch(`${BASE}${route}`, { redirect: 'follow' }).catch(() => {})
  }
}
