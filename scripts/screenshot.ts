/** Screenshots the app for a quick visual check. npx tsx scripts/screenshot.ts */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1000, height: 1000 } })
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

  for (const [route, file] of [
    ['/feed', 'shot-feed.png'],
    ['/friends', 'shot-friends.png'],
  ] as const) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    await page.screenshot({ path: file })
    console.log(`wrote ${file}`)
  }

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
