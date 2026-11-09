import { expect, test } from '@playwright/test'
import { befriend, register, signedInContext } from './support'

test.describe('finding people', () => {
  test('search needs at least two characters before it goes looking', async ({ browser }) => {
    const me = await signedInContext(browser, 'searcher')
    const them = await signedInContext(browser, 'findme')

    await me.page.goto('/friends')
    const search = me.page.getByLabel('Search by username')

    await search.fill('a')
    await expect(me.page.getByRole('button', { name: 'Add', exact: true })).toHaveCount(0)

    await search.fill(them.account.username)
    await expect(me.page.getByRole('button', { name: 'Add', exact: true })).toBeVisible()

    await me.context.close()
    await them.context.close()
  })

  test('says so plainly when nobody matches', async ({ page }) => {
    await register(page)
    await page.goto('/friends')
    await page.getByLabel('Search by username').fill('nobody_by_this_name_exists')
    await expect(page.getByText('No one found.')).toBeVisible()
  })
})

test.describe('requests', () => {
  test('sent, then accepted, makes two friends', async ({ browser }) => {
    const sender = await signedInContext(browser, 'sender')
    const recipient = await signedInContext(browser, 'recipient')

    await befriend(sender.page, recipient.page, recipient.account)

    // Both sides see each other: the friendship is a mirrored pair, written together.
    await sender.page.goto('/friends')
    await expect(sender.page.getByText(`@${recipient.account.username}`)).toBeVisible()
    await recipient.page.goto('/friends')
    await expect(recipient.page.getByText(`@${sender.account.username}`)).toBeVisible()

    await sender.context.close()
    await recipient.context.close()
  })

  test('a declined request leaves nobody a friend', async ({ browser }) => {
    const sender = await signedInContext(browser, 'declsender')
    const recipient = await signedInContext(browser, 'declrecip')

    await sender.page.goto('/friends')
    await sender.page.getByLabel('Search by username').fill(recipient.account.username)
    await sender.page.getByRole('button', { name: 'Add', exact: true }).click()
    // Wait for the request to actually exist before the recipient goes looking for
    // it. The friends page doesn't poll, so a page loaded a moment too early shows
    // nothing to decline and waits out the clock.
    await expect(
      sender.page.getByText(`Request sent to ${recipient.account.username}.`),
    ).toBeVisible()

    await recipient.page.goto('/friends')
    await recipient.page.getByRole('button', { name: 'Decline', exact: true }).click()
    await expect(recipient.page.getByText('No friends yet.')).toBeVisible()

    await sender.page.goto('/friends')
    await expect(sender.page.getByText('No friends yet.')).toBeVisible()

    await sender.context.close()
    await recipient.context.close()
  })

  test('the sender can withdraw a request before it is answered', async ({ browser }) => {
    const sender = await signedInContext(browser, 'cancelsender')
    const recipient = await signedInContext(browser, 'cancelrecip')

    await sender.page.goto('/friends')
    await sender.page.getByLabel('Search by username').fill(recipient.account.username)
    await sender.page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(sender.page.getByText(`Waiting on ${recipient.account.displayName}`)).toBeVisible()

    await sender.page.getByRole('button', { name: 'Cancel', exact: true }).click()
    // The heading, not the text: getByText('Sent') also matches the "Request sent
    // to …" notice, which is still on screen and is not evidence of anything.
    await expect(sender.page.getByRole('heading', { name: 'Sent' })).toHaveCount(0)

    // And it is gone from the recipient's side too, not just hidden on the sender's.
    await recipient.page.goto('/friends')
    await expect(recipient.page.getByRole('button', { name: 'Accept', exact: true })).toHaveCount(0)

    await sender.context.close()
    await recipient.context.close()
  })

  test('two people asking each other become friends without a second accept', async ({
    browser,
  }) => {
    const a = await signedInContext(browser, 'mutuala')
    const b = await signedInContext(browser, 'mutualb')

    await a.page.goto('/friends')
    await a.page.getByLabel('Search by username').fill(b.account.username)
    await a.page.getByRole('button', { name: 'Add', exact: true }).click()
    // A's request has to be on record before B asks, or B's is just a first request
    // and there's nothing for the server to match it against.
    await expect(a.page.getByText(`Request sent to ${b.account.username}.`)).toBeVisible()

    await b.page.goto('/friends')
    await b.page.getByLabel('Search by username').fill(a.account.username)
    await b.page.getByRole('button', { name: 'Add', exact: true }).click()

    await expect(b.page.getByText(/you're now friends/i)).toBeVisible()
    await expect(b.page.getByText(`@${a.account.username}`)).toBeVisible()

    await a.context.close()
    await b.context.close()
  })
})

test.describe('tiers', () => {
  test('a new friend starts general, and can be marked close', async ({ browser }) => {
    const me = await signedInContext(browser, 'tierme')
    const them = await signedInContext(browser, 'tierthem')
    await befriend(me.page, them.page, them.account)

    await me.page.goto('/friends')
    const group = me.page.getByRole('group', { name: `Tier for ${them.account.username}` })
    await expect(group.getByRole('button', { name: 'General' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await group.getByRole('button', { name: 'Close' }).click()
    await expect(group.getByRole('button', { name: 'Close' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // It sticks: this is stored, not local UI state.
    await me.page.reload()
    await expect(
      me.page
        .getByRole('group', { name: `Tier for ${them.account.username}` })
        .getByRole('button', { name: 'Close' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await me.context.close()
    await them.context.close()
  })

  test('your label for someone is invisible to them', async ({ browser }) => {
    const me = await signedInContext(browser, 'secretme')
    const them = await signedInContext(browser, 'secretthem')
    await befriend(me.page, them.page, them.account)

    await me.page.goto('/friends')
    await me.page
      .getByRole('group', { name: `Tier for ${them.account.username}` })
      .getByRole('button', { name: 'Close' })
      .click()

    // They aren't told. Their own list still shows their own label for me.
    await them.page.goto('/friends')
    const theirGroup = them.page.getByRole('group', { name: `Tier for ${me.account.username}` })
    await expect(theirGroup.getByRole('button', { name: 'General' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await me.context.close()
    await them.context.close()
  })
})
