/**
 * Guards against a leaked MapLibre instance.
 *
 * The map effect depends on props (geojson/bounds) whose object identity changes
 * on every render, and React 19 strict mode double-invokes effects in dev. Either
 * could leave a second map — and its WebGL context — alive behind the first.
 * More than one canvas in the DOM means we're leaking.
 *
 * Run the dev server first, then: npx tsx scripts/check-map-instances.ts
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const login = await page.request.post(`${BASE}/api/auth/login`, {
  // No default credentials. These used to hardcode a real account's password,
  // which made that account exactly as private as the source tree.
  data: {
    identifier: process.env.MAP_CHECK_USER,
    password: process.env.MAP_CHECK_PASS,
  },
  })
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`)

  await context.addCookies(
    (await login.headersArray())
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => {
        const [name, ...rest] = h.value.split(';')[0].split('=')
        return { name, value: rest.join('='), domain: 'localhost', path: '/' }
      }),
  )

  await page.goto(`${BASE}/map`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)

  const canvases = await page.locator('canvas.maplibregl-canvas').count()
  const maps = await page.locator('.maplibregl-map').count()
  console.log(`maplibre canvases : ${canvases}`)
  console.log(`maplibre maps     : ${maps}`)

  // Navigate away and back — the effect's cleanup must actually dispose the map.
  await page.goto(`${BASE}/feed`, { waitUntil: 'networkidle' })
  await page.goto(`${BASE}/map`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const after = await page.locator('canvas.maplibregl-canvas').count()
  console.log(`after re-navigation: ${after}`)

  await browser.close()

  const ok = canvases === 1 && maps === 1 && after === 1
  console.log(ok ? '\nPASS — exactly one map instance' : '\nFAIL — leaked map instance')
  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
