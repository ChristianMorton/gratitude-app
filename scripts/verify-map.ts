/**
 * Drives the real map in a real browser and asserts two things:
 *
 *   1. loading the map produces ZERO requests to any host but our own — the claim
 *      the whole self-hosting decision exists to make;
 *   2. the map actually draws something.
 *
 * The second one is here because this script used to report PASS on a completely
 * grey map. It checked that a <canvas> existed, which it always does, and that no
 * request left our origin, which is trivially true when the tiles are local and
 * broken. A third of the tile archive was holes and this said PASS.
 *
 * A canvas existing is not a map. Pixels are.
 *
 * Run the dev server first, then: npx tsx scripts/verify-map.ts
 */
import { chromium } from 'playwright'
import sharp from 'sharp'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

/**
 * No default credentials. This used to carry a real account's username and
 * password as fallbacks, which made that account exactly as private as the source
 * tree — and broke silently the moment the password changed.
 *
 * Point it at an account on whichever stack you're checking. The map needs pins to
 * be worth looking at, so use one that has some.
 */
const USER = {
  identifier: process.env.MAP_CHECK_USER,
  password: process.env.MAP_CHECK_PASS,
}

if (!USER.identifier || !USER.password) {
  console.error('Set MAP_CHECK_USER and MAP_CHECK_PASS to an account with pins, e.g.\n')
  console.error('  MAP_CHECK_USER=someone MAP_CHECK_PASS=... npx tsx scripts/verify-map.ts\n')
  process.exit(2)
}

/** The origin under test. Everything else is a third party. */
const OUR_HOST = new URL(BASE).hostname

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1100, height: 800 } })
  const page = await context.newPage()

  const requests: string[] = []
  const consoleErrors: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  page.on('console', async (message) => {
    if (message.type() !== 'error') return
    // message.text() is just "Error" for thrown objects — dig out the real thing.
    const parts = await Promise.all(
      message.args().map((arg) => arg.evaluate((v) => (v instanceof Error ? v.message : String(v))).catch(() => '?')),
    )
    consoleErrors.push(parts.join(' ') || message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(String(error)))
  // Chrome logs "Failed to load resource: ... 404" without saying *which* resource,
  // which is useless to act on. Name it.
  page.on('response', (response) => {
    if (response.status() >= 400) {
      consoleErrors.push(`HTTP ${response.status()}  ${decodeURIComponent(response.url())}`)
    }
  })
  page.on('requestfailed', (request) => {
    // Next cancels its own RSC prefetches when a link scrolls out of view or the
    // page unmounts. ERR_ABORTED on a `?_rsc=` URL is the framework working, not
    // a fault — counting it made a healthy map report FAIL.
    const aborted = request.failure()?.errorText === 'net::ERR_ABORTED'
    if (aborted && request.url().includes('_rsc=')) return
    consoleErrors.push(`request failed: ${request.url()} — ${request.failure()?.errorText}`)
  })

  // Sign in.
  const login = await page.request.post(`${BASE}/api/auth/login`, { data: USER })
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`)
  await context.addCookies(
    (await login.headersArray())
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => {
        const value = h.value.split(';')[0]
        const [name, ...rest] = value.split('=')
        // The host we're actually testing, not a hardcoded 'localhost' — this
        // script has to work against the deployed site too.
        return { name, value: rest.join('='), domain: OUR_HOST, path: '/' }
      }),
  )

  await page.goto(`${BASE}/map`, { waitUntil: 'networkidle' })
  // Let MapLibre finish drawing.
  await page.waitForTimeout(4000)

  await page.screenshot({ path: 'map-screenshot.png' })

  // ─── The assertion ────────────────────────────────────────────────────────
  // "Ours" is whatever host we were pointed at. Hardcoding localhost meant that
  // running this against the deployed site reported every request to our own
  // domain as an external leak — 31 of them — which is the opposite of the truth
  // and would train anyone reading it to ignore the number that matters.
  const external = requests.filter((url) => {
    if (url.startsWith('data:') || url.startsWith('blob:')) return false
    try {
      return new URL(url).hostname !== OUR_HOST
    } catch {
      return false
    }
  })

  const tileRequests = requests.filter((url) => url.includes('.pmtiles'))
  const fontRequests = requests.filter((url) => url.includes('/fonts/'))

  console.log(`total requests      : ${requests.length}`)
  console.log(`pmtiles requests    : ${tileRequests.length} (range requests into the local archive)`)
  console.log(`glyph requests      : ${fontRequests.length}`)
  console.log(`EXTERNAL requests   : ${external.length}`)
  if (external.length) {
    console.log('  ' + [...new Set(external.map((u) => new URL(u).hostname))].join('\n  '))
  }
  const canvas = await page.locator('canvas.maplibregl-canvas').count()
  console.log(`map canvas present  : ${canvas === 1 ? 'yes' : 'NO'}`)

  // ─── Does it actually draw? ───────────────────────────────────────────────
  // Count distinct colours in the canvas. A drawn basemap has land, water, roads
  // and labels — dozens of them. A map whose tiles are missing is one flat fill,
  // and that is precisely what this script used to pass.
  const countColours = async () => {
    if (canvas !== 1) return 0
    const shot = await page.locator('canvas.maplibregl-canvas').screenshot()
    const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true })
    const seen = new Set<string>()
    // Stride by a prime so the sample never lands in step with the pixel grid.
    for (let i = 0; i + 2 < data.length; i += info.channels * 101) {
      seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`)
    }
    return seen.size
  }
  const DISTINCT_COLOURS_MIN = 8
  const report = (label: string, n: number) =>
    console.log(
      `${label.padEnd(20)}: ${n >= DISTINCT_COLOURS_MIN ? 'yes' : 'NO — blank canvas'} ` +
        `(${n} distinct colours, need ${DISTINCT_COLOURS_MIN})`,
    )

  const closeColours = await countColours()
  report('renders (pinned)', closeColours)

  // Zoom out to what an account with no pins sees.
  //
  // This matters more than the check above, and is the one that would have caught
  // the real bug. A user *with* pins gets fitBounds and lands deep — z13 or so,
  // where the archive happened to be intact. A user with none gets DEFAULT_VIEW at
  // z4.5, whose tiles were entirely inside the missing third of the download. So
  // the map worked for everyone who had ever attached a location, and was grey for
  // everyone who hadn't — which is to say, for every new account.
  //
  // Driving the real zoom-out control rather than reaching into the map instance:
  // it's what a user has, and it needs no debug hook in the component.
  for (let i = 0; i < 9; i++) {
    await page.locator('.maplibregl-ctrl-zoom-out').click()
    await page.waitForTimeout(400)
  }
  await page.waitForTimeout(3000)
  const farColours = await countColours()
  report('renders (zoomed out)', farColours)

  // Reported last, on purpose: zooming out fetches tiles of its own, and those are
  // exactly the ones that fail on an incomplete archive. Printing this before the
  // zoom-out meant the summary said "no errors" while the run failed for errors.
  if (consoleErrors.length) {
    console.log(`\nconsole errors      : ${consoleErrors.length}`)
    console.log('  ' + [...new Set(consoleErrors)].slice(0, 5).join('\n  '))
  }

  await browser.close()

  const blank = closeColours < DISTINCT_COLOURS_MIN || farColours < DISTINCT_COLOURS_MIN
  const ok = external.length === 0 && canvas === 1 && consoleErrors.length === 0 && !blank
  console.log(ok ? '\nPASS' : '\nFAIL')
  if (blank) {
    console.log(
      'The canvas is blank at one or more zooms. Usually the tile archive is\n' +
        'incomplete — run `npx tsx scripts/fetch-tiles.ts` to check it reads back clean.',
    )
  }
  process.exit(ok ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
