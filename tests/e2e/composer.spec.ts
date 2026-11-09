import { expect, test, type Page } from '@playwright/test'
import { postCard, register, writePost } from './support'

const box = (page: Page) => page.locator('#content')

async function heightOf(page: Page) {
  const b = await box(page).boundingBox()
  return Math.round(b!.height)
}

async function isClipped(page: Page) {
  return box(page).evaluate((el) => el.scrollHeight > el.clientHeight + 1)
}

async function pageOverflows(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}

test.describe('writing a gratitude', () => {
  /**
   * Regression, P0: FeedList used to mirror `initialPosts` into useState, which
   * ignores props after mount. The post saved, `router.refresh()` fetched a fresh
   * first page, and the list threw it away — so posting looked exactly like data
   * loss. Every unit test passed throughout.
   */
  test('a new post appears immediately, with no reload', async ({ page }) => {
    await register(page)
    await expect(page.locator('article')).toHaveCount(0)

    await writePost(page, 'The tomatoes finally came in. Four of them.')

    await expect(page.locator('article')).toHaveCount(1)
    await expect(postCard(page, 'The tomatoes finally came in. Four of them.')).toBeVisible()
    // The composer empties itself, ready for the next one.
    await expect(box(page)).toHaveValue('')
  })

  test('posts stack newest-first as you write more', async ({ page }) => {
    await register(page)
    await writePost(page, 'First thing')
    await writePost(page, 'Second thing')

    await expect(page.locator('article')).toHaveCount(2)
    await expect(page.locator('article').first()).toContainText('Second thing')
  })

  test('and it is still there after a reload', async ({ page }) => {
    await register(page)
    await writePost(page, 'Cold morning, hot coffee')
    await page.reload()
    await expect(postCard(page, 'Cold morning, hot coffee')).toBeVisible()
  })
})

test.describe('the box grows with the letter', () => {
  /**
   * Regression, P0: rows={3} + resize-none + no autogrow showed 72px of a 192px
   * letter — 38% of the author's own words, in a product whose first principle is
   * that the writing is the product.
   */
  test('a long entry is fully visible, never scrolled inside', async ({ page }) => {
    await register(page)
    const empty = await heightOf(page)

    await box(page).fill('the tomatoes finally came in. '.repeat(18)) // ~540 chars of prose
    const grown = await heightOf(page)

    expect(grown, 'the box must grow past its three-line floor').toBeGreaterThan(empty)
    expect(await isClipped(page), 'no words may be hidden behind a scroll').toBe(false)
  })

  /**
   * Regression, mine: a bare `grid` gives an auto column that sizes to max-content,
   * so one long unbroken word stretched the column past the card instead of
   * wrapping. Newlines grew the box fine, which is exactly why a casual check
   * passed it.
   */
  test('one enormous unbroken word wraps instead of blowing out the page', async ({ page }) => {
    await register(page)
    await box(page).fill('x'.repeat(519))

    expect(await isClipped(page)).toBe(false)
    expect(await pageOverflows(page), 'the viewport is part of the design').toBe(false)
  })

  test('newlines grow it too', async ({ page }) => {
    await register(page)
    const empty = await heightOf(page)
    await box(page).fill('one\ntwo\nthree\nfour\nfive\nsix')
    expect(await heightOf(page)).toBeGreaterThan(empty)
    expect(await isClipped(page)).toBe(false)
  })

  test('emoji and CJK are measured properly, not clipped', async ({ page }) => {
    await register(page)
    await box(page).fill('🌱'.repeat(40) + '感謝しています'.repeat(20))
    expect(await isClipped(page)).toBe(false)
    expect(await pageOverflows(page)).toBe(false)
  })

  test('it settles back to three lines when emptied', async ({ page }) => {
    await register(page)
    const empty = await heightOf(page)
    await box(page).fill('a'.repeat(600))
    expect(await heightOf(page)).toBeGreaterThan(empty)
    await box(page).fill('')
    expect(await heightOf(page)).toBe(empty)
  })

  test('holds up on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await register(page)
    await box(page).fill('the tomatoes finally came in. '.repeat(18))
    expect(await isClipped(page)).toBe(false)
    expect(await pageOverflows(page)).toBe(false)
  })
})

test.describe('the 500 character limit', () => {
  test('counts down, then goes negative and blocks the post', async ({ page }) => {
    await register(page)
    const counter = page.locator('span.tabular-nums')

    await expect(counter).toHaveText('500')
    await box(page).fill('a'.repeat(480))
    await expect(counter).toHaveText('20')

    await box(page).fill('a'.repeat(560))
    await expect(counter).toHaveText('-60')
    await expect(page.getByRole('button', { name: 'Post', exact: true })).toBeDisabled()
  })

  test('exactly 500 is allowed', async ({ page }) => {
    await register(page)
    await box(page).fill('b'.repeat(500))
    await expect(page.locator('span.tabular-nums')).toHaveText('0')
    await page.getByRole('button', { name: 'Post', exact: true }).click()
    await expect(page.locator('article')).toHaveCount(1)
  })

  test('whitespace alone is not a gratitude', async ({ page }) => {
    await register(page)
    await box(page).fill('        ')
    await expect(page.getByRole('button', { name: 'Post', exact: true })).toBeDisabled()
  })
})

test.describe('sharing is a decision, not a default', () => {
  test('a new gratitude starts private', async ({ page }) => {
    await register(page)
    await expect(page.getByRole('button', { name: 'Only me', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    for (const shared of ['Close friends', 'All friends']) {
      await expect(page.getByRole('button', { name: shared, exact: true })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    }
  })

  test('and nothing is shared unless you widen it yourself', async ({ page }) => {
    await register(page)
    await page.fill('#content', 'Typed and posted without touching the audience')
    await page.getByRole('button', { name: 'Post', exact: true }).click()
    await expect(postCard(page, 'Typed and posted without touching the audience')).toContainText(
      'Only me',
    )
  })

  /**
   * The decision is per-letter. If visibility persisted, one choice to share would
   * quietly widen every post after it — the principle would hold once and then
   * silently stop holding.
   */
  test('the audience returns to private after each post', async ({ page }) => {
    await register(page)
    await writePost(page, 'Shared with everyone, deliberately', 'friends')
    await expect(page.getByRole('button', { name: 'Only me', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await page.fill('#content', 'The very next thing I wrote')
    await page.getByRole('button', { name: 'Post', exact: true }).click()
    await expect(postCard(page, 'The very next thing I wrote')).toContainText('Only me')
  })

  test('the audience is labelled on screen, not just to a screen reader', async ({ page }) => {
    await register(page)
    // A sighted user must be able to tell these are an audience, not filters or tags.
    await expect(page.getByText('Who can see this')).toBeVisible()
    // And the same words name the group for assistive tech: one label, everyone.
    await expect(page.getByRole('group', { name: 'Who can see this' })).toBeVisible()
  })
})

test.describe('choosing who sees it', () => {
  test('defaults are visible on your own post, and say who it went to', async ({ page }) => {
    await register(page)
    await writePost(page, 'A close one', 'close')
    await expect(page.locator('article').first()).toContainText('Close friends')
    await expect(page.locator('article').first()).toContainText('You')
  })

  test('each tier is selectable and marks itself pressed', async ({ page }) => {
    await register(page)
    for (const label of ['Close friends', 'All friends', 'Only me']) {
      await page.getByRole('button', { name: label, exact: true }).click()
      await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    }
  })

  test('the audience is named in words, not colour alone', async ({ page }) => {
    await register(page)
    await writePost(page, 'Only for me', 'private')
    // Survives greyscale, colourblindness, and a screen reader.
    await expect(page.locator('article').first()).toContainText('Only me')
  })
})
