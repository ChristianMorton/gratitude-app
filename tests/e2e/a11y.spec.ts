import { expect, test, type Page } from '@playwright/test'
import { register } from './support'

/**
 * DESIGN.md: "Do give every interactive element a focus-visible ring in Burnt Sienna
 * at 2px." PRODUCT.md commits to WCAG AA, and 2.4.7 requires a visible focus
 * indicator.
 *
 * These tab with a real keyboard rather than calling .focus(): programmatic focus
 * doesn't match :focus-visible, so a styling gap would go unnoticed. The worst case
 * this guards is the photo control — a <label> for a visually-hidden <input>, where
 * focus lands on a 1×1 clipped element and the ring has to be drawn by the label
 * instead. Nothing on screen would move, and only a keyboard user would ever know.
 */

/** What the browser actually paints for the focused element, or its label. */
async function focusIndicator(page: Page) {
  return page.evaluate(() => {
    const painted = (node: Element) => {
      const cs = getComputedStyle(node)
      const hasShadow = cs.boxShadow !== 'none' && cs.boxShadow !== ''
      const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0
      return hasShadow || hasOutline
    }
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return null
    // Tabbing past the last control reaches browser and Next dev-tools chrome
    // (`<nextjs-portal>`), which isn't ours and isn't in production. Only judge
    // what's inside the composer.
    if (!el.closest('form')) return null

    // A visually-hidden input delegates both its ring and its name to the label
    // that owns it — the file input has no text of its own, and "INPUT" is not what
    // a person is looking at.
    const owner =
      el.closest('label') ??
      (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null)

    // `||` not `??`: textContent is '' for an empty element, which is not nullish.
    const name = (
      el.getAttribute('aria-label') ||
      el.textContent?.trim() ||
      owner?.textContent?.trim() ||
      el.tagName
    ).slice(0, 32)

    return {
      name,
      tag: el.tagName.toLowerCase(),
      visible: painted(el) || (owner ? painted(owner) : false),
    }
  })
}

/** Tab forward n times, reporting what got focus and whether you could see it. */
async function tabThrough(page: Page, steps: number) {
  const seen: { name: string; tag: string; visible: boolean }[] = []
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('Tab')
    const info = await focusIndicator(page)
    if (info) seen.push(info)
  }
  return seen
}

test.describe('focus is always visible', () => {
  test('every control in the composer shows a ring when tabbed to', async ({ page }) => {
    await register(page)
    await page.locator('#content').focus()

    const seen = await tabThrough(page, 7)
    const invisible = seen.filter((s) => !s.visible)

    expect(
      invisible,
      `these took focus with nothing on screen to show for it: ${invisible
        .map((s) => s.name)
        .join(', ')}`,
    ).toEqual([])

    // And the tab order really did reach the controls we care about.
    const names = seen.map((s) => s.name)
    expect(names).toContain('Close friends')
    expect(names).toContain('All friends')
    expect(names).toContain('Only me')
    expect(names.some((n) => /Add photo/.test(n))).toBe(true)
    expect(names.some((n) => /Add location/.test(n))).toBe(true)
  })

  test('the photo control shows its ring on the label, not the hidden input', async ({ page }) => {
    await register(page)
    await page.locator('#content').focus()

    // Tab past the three audience chips to reach the file input.
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')

    const focused = await page.evaluate(() => (document.activeElement as HTMLElement)?.id)
    expect(focused, 'focus should land on the file input').toBe('photo')

    const labelRing = await page
      .locator('label[for="photo"]')
      .evaluate((el) => getComputedStyle(el).boxShadow)
    expect(labelRing, 'the label must draw the ring its hidden input cannot').not.toBe('none')
  })

  test('every button in the open location picker shows a ring', async ({ page }) => {
    await register(page)
    await page.getByRole('button', { name: '📍 Add location' }).click()
    await expect(page.getByRole('button', { name: 'Where I am now' })).toBeVisible()

    await page.getByRole('button', { name: 'Add photo' }).focus()
    const seen = await tabThrough(page, 3)
    const invisible = seen.filter((s) => !s.visible)

    expect(
      invisible,
      `location picker controls with no visible focus: ${invisible.map((s) => s.name).join(', ')}`,
    ).toEqual([])
    expect(seen.map((s) => s.name)).toContain('Where I am now')
    expect(seen.map((s) => s.name)).toContain('Cancel')
  })

  test('the attached-location chip can be removed by keyboard, visibly', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 51.5072, longitude: -0.1276 })
    await register(page)

    await page.getByRole('button', { name: '📍 Add location' }).click()
    await page.getByRole('button', { name: 'Where I am now' }).click()
    await expect(page.getByText('📍 Current location')).toBeVisible()

    const remove = page.getByRole('button', { name: 'Remove location' })
    await remove.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')

    const indicator = await focusIndicator(page)
    expect(indicator?.name).toBe('Remove location')
    expect(indicator?.visible, 'the ✕ must show focus, not just hover opacity').toBe(true)

    await page.keyboard.press('Enter')
    await expect(page.getByText('📍 Current location')).toHaveCount(0)
  })
})
