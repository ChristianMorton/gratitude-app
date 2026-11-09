import { expect, test, type Page } from '@playwright/test'
import { register } from './support'

/**
 * PRODUCT.md puts the user "on a phone, alone, at the end of a day" — so this is
 * the primary context, not a fallback. It was also the least finished surface:
 * every toolbar control used to wrap to two lines, Post landed on the left of a
 * phone and the right of a desktop, and the thumb targets bottomed out at 24px.
 *
 * `hasTouch` is what makes `pointer: coarse` apply. Sizing by viewport instead
 * would give a touchscreen laptop 24px targets and a narrow desktop window fat
 * ones — the input device is the thing that actually matters.
 */

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

const TOUCH_TARGET_MIN = 44

type Control = { name: string; w: number; h: number; x: number; lines: number }

async function controls(page: Page): Promise<Control[]> {
  return page.evaluate(() => {
    const sel = 'header a, header button, form button, form label[for]'
    return [...document.querySelectorAll(sel)]
      .filter((el) => !el.classList.contains('sr-only'))
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 // skip anything hidden at this breakpoint
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        // Count the text's own line boxes. Comparing height against line-height
        // breaks the moment a min-height makes a control taller than its text.
        let lines = 1
        const node = [...el.childNodes].find(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
        )
        if (node) {
          const range = document.createRange()
          range.selectNodeContents(node)
          lines = range.getClientRects().length || 1
        }
        return {
          name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24),
          w: Math.round(r.width),
          h: Math.round(r.height),
          x: Math.round(r.left),
          lines,
        }
      })
  })
}

const overflows = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)

test.describe('on a phone', () => {
  test('nothing overflows the viewport', async ({ page }) => {
    await register(page)
    expect(await overflows(page), 'the viewport is part of the design').toBe(false)

    // The picker open is the widest the toolbar ever gets.
    await page.getByRole('button', { name: '📍 Add location' }).click()
    await expect(page.getByRole('button', { name: 'Where I am now' })).toBeVisible()
    expect(await overflows(page)).toBe(false)
  })

  test('every control is thumb-sized', async ({ page }) => {
    await register(page)
    const tooSmall = (await controls(page)).filter(
      (c) => c.h < TOUCH_TARGET_MIN || c.w < TOUCH_TARGET_MIN,
    )
    expect(
      tooSmall,
      `under ${TOUCH_TARGET_MIN}px: ${tooSmall.map((c) => `${c.name} ${c.w}x${c.h}`).join(', ')}`,
    ).toEqual([])
  })

  test('the location picker keeps its buttons thumb-sized too', async ({ page }) => {
    await register(page)
    await page.getByRole('button', { name: '📍 Add location' }).click()
    await expect(page.getByRole('button', { name: 'Where I am now' })).toBeVisible()

    const tooSmall = (await controls(page)).filter((c) => c.h < TOUCH_TARGET_MIN)
    expect(tooSmall.map((c) => `${c.name} ${c.w}x${c.h}`)).toEqual([])
  })

  test('no control wraps onto a second line', async ({ page }) => {
    await register(page)
    const wrapped = (await controls(page)).filter((c) => c.lines > 1)
    expect(
      wrapped,
      `wrapped: ${wrapped.map((c) => `${c.name} (${c.lines} lines)`).join(', ')}`,
    ).toEqual([])
  })

  test('Post sits in the same corner as on desktop, and stays put', async ({ page }) => {
    await register(page)
    await page.fill('#content', 'Something to post')

    const post = page.getByRole('button', { name: 'Post', exact: true })
    const before = (await post.boundingBox())!
    // Right-aligned: its right edge is near the content edge, not the left margin.
    expect(before.x + before.width).toBeGreaterThan(280)

    // Opening the picker reflows the toolbar; the primary action must not move
    // under the thumb that's reaching for it.
    await page.getByRole('button', { name: '📍 Add location' }).click()
    await expect(page.getByRole('button', { name: 'Where I am now' })).toBeVisible()
    const after = (await post.boundingBox())!
    expect(Math.round(after.x)).toBe(Math.round(before.x))
  })

  test('the nav keeps every destination reachable and named', async ({ page }) => {
    await register(page)
    // Scoped to the header, and exact: `getByRole({ name })` matches by substring,
    // so a bare "Friends" also finds the "Close friends" and "All friends" chips.
    const header = page.locator('header')
    // No hamburger: three destinations hidden behind a menu would be ceremony.
    for (const label of ['Feed', 'Map', 'Friends']) {
      await expect(header.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
    await expect(header.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
    // The wordmark is what stands down, since it only duplicates the Feed link.
    await expect(header.getByRole('link', { name: 'Gratitude', exact: true })).toBeHidden()
  })
})
