import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test'

/**
 * Shared journeys. Accounts are created through the real UI, not seeded into the
 * database: registration is part of what's under test, and a seeded row with a
 * fake password hash cannot log in.
 *
 * Every account gets a unique username so specs never collide, which is what lets
 * them run in parallel without truncating a shared table between them.
 */

let seq = 0

/**
 * Usernames are capped at 30 characters and allow letters, numbers and underscores
 * only. The suffix has to stay unique across workers and runs, so the prefix is
 * what gives — it's truncated to whatever is left rather than silently producing a
 * name the app will (correctly) reject.
 */
export function uniqueName(prefix = 'e2e') {
  seq += 1
  const suffix = `_${process.pid.toString(36)}_${Date.now().toString(36)}_${seq}`
  return `${prefix.slice(0, 30 - suffix.length)}${suffix}`
}

export type Account = {
  username: string
  displayName: string
  email: string
  password: string
}

export function makeAccount(prefix = 'e2e'): Account {
  const username = uniqueName(prefix)
  return {
    username,
    displayName: `Person ${seq}`,
    email: `${username}@example.invalid`,
    password: 'e2e-password-not-real',
  }
}

/**
 * A gratitude in the feed, found by its words.
 *
 * Always locate posts through this rather than a bare `getByText`. The composer
 * carries an invisible replica of whatever is being typed (it's what makes the box
 * grow), so the same words can exist twice in the DOM — once in the post, once in
 * the composer. `aria-hidden` keeps that from reaching a person; it does not keep
 * it from reaching a selector.
 */
export function postCard(page: Page, text: string) {
  return page.locator('article').filter({ hasText: text })
}

/** The error band. Scoped to the <p>: Next's route announcer is also role="alert". */
export function errorNote(page: Page) {
  return page.locator('p[role="alert"]')
}

/** Sign out through the button. The API route is POST-only; a GET does nothing. */
export async function logout(page: Page) {
  await page.goto('/feed')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL('**/login')
}

/** Register through the form and land signed in. */
export async function register(page: Page, account: Account = makeAccount()): Promise<Account> {
  await page.goto('/register')
  await page.fill('input[name="username"]', account.username)
  await page.fill('input[name="displayName"]', account.displayName)
  await page.fill('input[name="email"]', account.email)
  await page.fill('input[name="password"]', account.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/feed')
  return account
}

/** Sign in through the form. Asserts the credentials never reach the URL. */
export async function login(page: Page, account: Account) {
  await page.goto('/login')
  await page.fill('input[name="identifier"]', account.username)
  await page.fill('input[name="password"]', account.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/feed')
  expect(page.url(), 'credentials must never appear in the URL').not.toContain('password=')
}

/** A signed-in browser context of its own, so two people can be online at once. */
export async function signedInContext(
  browser: Browser,
  prefix = 'e2e',
): Promise<{ context: BrowserContext; page: Page; account: Account }> {
  const context = await browser.newContext()
  const page = await context.newPage()
  const account = await register(page, makeAccount(prefix))
  return { context, page, account }
}

/** Write a gratitude and wait for it to land in the feed. */
export async function writePost(
  page: Page,
  content: string,
  visibility: 'close' | 'friends' | 'private' = 'friends',
) {
  await page.goto('/feed')
  await page.fill('#content', content)
  await page.getByRole('button', { name: visibilityLabel(visibility), exact: true }).click()
  await page.getByRole('button', { name: 'Post', exact: true }).click()
  await expect(postCard(page, content)).toBeVisible()
  // The composer empties on success, which is also what clears the replica.
  await expect(page.locator('#content')).toHaveValue('')
}

export function visibilityLabel(v: 'close' | 'friends' | 'private') {
  return { close: 'Close friends', friends: 'All friends', private: 'Only me' }[v]
}

/** Send a friend request and have the recipient accept it. */
export async function befriend(senderPage: Page, recipientPage: Page, recipient: Account) {
  await senderPage.goto('/friends')
  await senderPage.getByLabel('Search by username').fill(recipient.username)
  await senderPage.getByRole('button', { name: 'Add', exact: true }).first().click()
  await expect(senderPage.getByText(`Request sent to ${recipient.username}.`)).toBeVisible()

  await recipientPage.goto('/friends')
  await recipientPage.getByRole('button', { name: 'Accept', exact: true }).first().click()
  await expect(recipientPage.getByRole('button', { name: 'Accept', exact: true })).toHaveCount(0)
}

/**
 * Set your own label for a friend. One-sided by design: this is what *you* call
 * them, and it says nothing about what they call you.
 */
export async function setTier(page: Page, friend: Account, tier: 'close' | 'general') {
  await page.goto('/friends')
  const group = page.getByRole('group', { name: `Tier for ${friend.username}` })
  await group.getByRole('button', { name: tier === 'close' ? 'Close' : 'General' }).click()
  await expect(
    group.getByRole('button', { name: tier === 'close' ? 'Close' : 'General' }),
  ).toHaveAttribute('aria-pressed', 'true')
}

/** Remove a friend. Goes through a native confirm(), which must be accepted. */
export async function removeFriend(page: Page, friend: Account) {
  await page.goto('/friends')
  page.once('dialog', (dialog) => dialog.accept())
  const row = page.locator('li').filter({ hasText: `@${friend.username}` })
  await row.getByRole('button', { name: 'Remove' }).click()
}

/** Attach the device's location to the post being written. */
export async function attachCurrentLocation(page: Page) {
  await page.getByRole('button', { name: '📍 Add location' }).click()
  await page.getByRole('button', { name: 'Where I am now' }).click()
  await expect(page.getByText('📍 Current location')).toBeVisible()
}
