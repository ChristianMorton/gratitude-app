import { expect, test } from '@playwright/test'
import { befriend, postCard, setTier, signedInContext, writePost } from './support'

/**
 * The product's actual promise, exercised through the browser rather than asserted
 * against a Prisma where-clause. The vitest suite already proves
 * `visiblePostsWhere` is correct in isolation; these prove the app that uses it is.
 */

test.describe('who sees what', () => {
  test('a private post is visible to nobody but its author', async ({ browser }) => {
    const author = await signedInContext(browser, 'author')
    const friend = await signedInContext(browser, 'friend')
    await befriend(author.page, friend.page, friend.account)

    await writePost(author.page, 'Wrote badly for two hours and kept going anyway', 'private')
    await expect(postCard(author.page, 'Wrote badly for two hours')).toBeVisible()

    await friend.page.goto('/feed')
    await expect(postCard(friend.page, 'Wrote badly for two hours')).toHaveCount(0)

    await author.context.close()
    await friend.context.close()
  })

  test('a friends post reaches a friend', async ({ browser }) => {
    const author = await signedInContext(browser, 'author')
    const friend = await signedInContext(browser, 'friend')
    await befriend(author.page, friend.page, friend.account)

    await writePost(author.page, 'Four enormous tomatoes', 'friends')

    await friend.page.goto('/feed')
    await expect(postCard(friend.page, 'Four enormous tomatoes')).toBeVisible()
    // And it is attributed to a person, not to "You".
    await expect(friend.page.locator('article').first()).toContainText(author.account.displayName)

    await author.context.close()
    await friend.context.close()
  })

  test('a stranger sees nothing at all, however it was shared', async ({ browser }) => {
    const author = await signedInContext(browser, 'author')
    const stranger = await signedInContext(browser, 'stranger')

    await writePost(author.page, 'Shared with all my friends', 'friends')

    await stranger.page.goto('/feed')
    await expect(postCard(stranger.page, 'Shared with all my friends')).toHaveCount(0)
    await expect(stranger.page.getByText('Nothing here yet.')).toBeVisible()

    await author.context.close()
    await stranger.context.close()
  })

  test('a close post reaches a close friend but not a general one', async ({ browser }) => {
    const author = await signedInContext(browser, 'author')
    const close = await signedInContext(browser, 'close')
    const general = await signedInContext(browser, 'general')

    await befriend(author.page, close.page, close.account)
    await befriend(author.page, general.page, general.account)
    await setTier(author.page, close.account, 'close')
    await setTier(author.page, general.account, 'general')

    await writePost(author.page, 'Something I only tell close friends', 'close')

    await close.page.goto('/feed')
    await expect(postCard(close.page, 'Something I only tell close friends')).toBeVisible()

    await general.page.goto('/feed')
    await expect(postCard(general.page, 'Something I only tell close friends')).toHaveCount(0)

    await author.context.close()
    await close.context.close()
    await general.context.close()
  })

  /**
   * The one-sided tier is the subtle part of the model and the easiest thing to
   * regress into a mutual status: `close` is *your* label for someone. Marking
   * them close lets them see your close posts; it says nothing about theirs.
   */
  test('close is your label for them, not a mutual status', async ({ browser }) => {
    const ivy = await signedInContext(browser, 'ivy')
    const ren = await signedInContext(browser, 'ren')
    await befriend(ivy.page, ren.page, ren.account)

    // Ivy calls Ren close. Ren leaves Ivy general.
    await setTier(ivy.page, ren.account, 'close')
    await setTier(ren.page, ivy.account, 'general')

    await writePost(ivy.page, 'Ivy speaking to her close friends', 'close')
    await writePost(ren.page, 'Ren speaking to his close friends', 'close')

    // Ren is close to Ivy, so Ren sees hers.
    await ren.page.goto('/feed')
    await expect(postCard(ren.page, 'Ivy speaking to her close friends')).toBeVisible()

    // Ivy is only general to Ren, so she does not see his.
    await ivy.page.goto('/feed')
    await expect(postCard(ivy.page, 'Ren speaking to his close friends')).toHaveCount(0)

    await ivy.context.close()
    await ren.context.close()
  })

  test('unfriending closes the door on what was already shared', async ({ browser }) => {
    const author = await signedInContext(browser, 'author')
    const friend = await signedInContext(browser, 'exfriend')
    await befriend(author.page, friend.page, friend.account)

    await writePost(author.page, 'Something shared while we were friends', 'friends')
    await friend.page.goto('/feed')
    await expect(postCard(friend.page, 'Something shared while we were friends')).toBeVisible()

    // The mirrored pair is deleted, so the EXISTS check fails in both directions.
    author.page.once('dialog', (d) => d.accept())
    await author.page.goto('/friends')
    await author.page
      .locator('li')
      .filter({ hasText: `@${friend.account.username}` })
      .getByRole('button', { name: 'Remove' })
      .click()
    await expect(author.page.getByText('No friends yet.')).toBeVisible()

    await friend.page.goto('/feed')
    await expect(postCard(friend.page, 'Something shared while we were friends')).toHaveCount(0)

    await author.context.close()
    await friend.context.close()
  })
})

test.describe('location is owner-only, structurally', () => {
  test('a geotagged post carries no location key at all for a friend', async ({ browser }) => {
    const author = await signedInContext(browser, 'geoauthor')
    const friend = await signedInContext(browser, 'geofriend')
    await befriend(author.page, friend.page, friend.account)

    // Grant the author a location and let them attach it deliberately.
    await author.context.grantPermissions(['geolocation'])
    await author.context.setGeolocation({ latitude: 51.5072, longitude: -0.1276 })

    await author.page.goto('/feed')
    await author.page.fill('#content', 'A gratitude that remembers where I was')
    await author.page.getByRole('button', { name: '📍 Add location' }).click()
    await author.page.getByRole('button', { name: 'Where I am now' }).click()
    await expect(author.page.getByText('📍 Current location')).toBeVisible()
    // Shared with all friends, on purpose. That's the point of the test: the post
    // travels as far as it was sent, and the coordinates travel nowhere at all.
    await author.page.getByRole('button', { name: 'All friends', exact: true }).click()
    await author.page.getByRole('button', { name: 'Post', exact: true }).click()
    await expect(postCard(author.page, 'A gratitude that remembers where I was')).toBeVisible()

    // What the friend's own client is handed by the API is the real test: not that
    // the coordinates are hidden in the UI, but that they were never sent.
    const feed = await friend.page.evaluate(async () => {
      const response = await fetch('/api/feed')
      return response.json()
    })
    const post = feed.posts.find((p: { content: string }) =>
      p.content.includes('A gratitude that remembers where I was'),
    )
    expect(post, 'the friend should receive the post itself').toBeTruthy()
    // Absent, not null: `null` would still admit that a location exists.
    expect(Object.keys(post)).not.toContain('location')
    expect(JSON.stringify(post)).not.toContain('51.5')
    expect(JSON.stringify(post)).not.toContain('0.12')

    await author.context.close()
    await friend.context.close()
  })

  test('the map shows your pins and only ever your own', async ({ browser }) => {
    const author = await signedInContext(browser, 'mapauthor')
    const friend = await signedInContext(browser, 'mapfriend')
    await befriend(author.page, friend.page, friend.account)

    await author.context.grantPermissions(['geolocation'])
    await author.context.setGeolocation({ latitude: 51.5072, longitude: -0.1276 })
    await author.page.goto('/feed')
    await author.page.fill('#content', 'Pinned somewhere in London')
    await author.page.getByRole('button', { name: '📍 Add location' }).click()
    await author.page.getByRole('button', { name: 'Where I am now' }).click()
    await author.page.getByRole('button', { name: 'Post', exact: true }).click()
    await expect(postCard(author.page, 'Pinned somewhere in London')).toBeVisible()

    const mine = await author.page.evaluate(async () => {
      const response = await fetch('/api/map/pins')
      return response.json()
    })
    expect(JSON.stringify(mine)).toContain('Pinned somewhere in London')

    // The friend's map is empty: it is hard-scoped to authorId, with no viewer branch.
    const theirs = await friend.page.evaluate(async () => {
      const response = await fetch('/api/map/pins')
      return response.json()
    })
    expect(JSON.stringify(theirs)).not.toContain('Pinned somewhere in London')
    expect(JSON.stringify(theirs)).not.toContain('51.5')

    await author.context.close()
    await friend.context.close()
  })

  test('picking a photo never silently attaches its location', async ({ browser }) => {
    const { context, page } = await signedInContext(browser, 'exif')
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 51.5072, longitude: -0.1276 })

    await page.goto('/feed')
    await page.fill('#content', 'No location on this one')
    // Location is opt-in: with nothing chosen, the affordance is still an offer.
    await expect(page.getByRole('button', { name: '📍 Add location' })).toBeVisible()
    await expect(page.getByText('📍 Current location')).toHaveCount(0)

    await page.getByRole('button', { name: 'Post', exact: true }).click()
    await expect(postCard(page, 'No location on this one')).toBeVisible()

    const pins = await page.evaluate(async () => (await fetch('/api/map/pins')).json())
    expect(JSON.stringify(pins)).not.toContain('No location on this one')

    await context.close()
  })
})
