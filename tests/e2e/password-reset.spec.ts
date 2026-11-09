import { expect, test, type Page } from '@playwright/test'
import { errorNote, login, logout, register } from './support'

/**
 * Password reset, driven the way a person does it: ask for a link, open the mail,
 * follow it, choose a new password, sign in with it.
 *
 * README calls this the thing that has to ship before public signup — until now
 * a forgotten password meant a psql one-liner. It arrived free with Supabase
 * Auth, but "free" is a claim about effort, not correctness, so it gets the same
 * treatment as everything else.
 *
 * The mail is read from Mailpit, the local stack's inbox on :54324. Nothing
 * leaves the machine.
 */

const MAILPIT = 'http://127.0.0.1:54324'

/** The most recent message sent to an address, or null. */
async function latestMail(page: Page, to: string) {
  const list = await page.request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)
  if (!list.ok()) return null
  const { messages } = await list.json()
  if (!messages?.length) return null

  const full = await page.request.get(`${MAILPIT}/api/v1/message/${messages[0].ID}`)
  return full.ok() ? await full.json() : null
}

/** The reset link out of the email body — what the person actually clicks. */
function resetLinkFrom(html: string): string | null {
  const match = html.match(/href="([^"]*\/auth\/confirm[^"]*)"/)
  if (!match) return null
  // Mailpit stores the body HTML-escaped.
  return match[1].replace(/&amp;/g, '&')
}

test.describe('forgetting your password', () => {
  test('the whole way round: ask, open the mail, choose a new one, sign in', async ({ page }) => {
    const account = await register(page)
    await logout(page)

    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgotten your password?' }).click()
    await expect(page).toHaveURL(/\/forgot-password$/)

    await page.fill('input[name="email"]', account.email)
    await page.getByRole('button', { name: 'Send me a link' }).click()
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

    const mail = await latestMail(page, account.email)
    expect(mail, 'a reset email should have arrived').toBeTruthy()
    expect(mail.Subject).toBe('Reset your Gratitude password')

    const link = resetLinkFrom(mail.HTML)
    expect(link, `no /auth/confirm link in the mail: ${mail.HTML?.slice(0, 200)}`).toBeTruthy()
    // PKCE, not the implicit flow: the mail carries a hash for the server to
    // verify, never tokens in a fragment for the browser to read.
    expect(link).toContain('token_hash=')
    expect(link).toContain('type=recovery')

    await page.goto(link!)
    // The link signs you in — which is why this page cannot live under the
    // (auth) layout, whose redirect would send you to /feed instead.
    await expect(page).toHaveURL(/\/reset-password$/)

    const newPassword = 'a-different-password-9'
    await page.fill('input[name="password"]', newPassword)
    await page.getByRole('button', { name: 'Save and sign in' }).click()
    await expect(page).toHaveURL(/\/feed$/)

    // The real proof: the new password works and the old one doesn't.
    await logout(page)
    await login(page, { ...account, password: newPassword })
    await expect(page).toHaveURL(/\/feed$/)

    await logout(page)
    await page.goto('/login')
    await page.fill('input[name="identifier"]', account.username)
    await page.fill('input[name="password"]', account.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(errorNote(page)).toHaveText('Incorrect username or password')
  })

  test('says the same thing for an address with no account', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.fill('input[name="email"]', 'nobody-at-all@example.invalid')
    await page.getByRole('button', { name: 'Send me a link' }).click()

    // Identical to the success case. The sign-in copy never confirms an account
    // exists; this form would hand that back in one request if it were kinder.
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  })

  test('the new password must still be 8 characters', async ({ page }) => {
    const account = await register(page)
    await logout(page)

    await page.goto('/forgot-password')
    await page.fill('input[name="email"]', account.email)
    await page.getByRole('button', { name: 'Send me a link' }).click()
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

    const mail = await latestMail(page, account.email)
    await page.goto(resetLinkFrom(mail.HTML)!)

    await page.fill('input[name="password"]', 'short')
    await page.getByRole('button', { name: 'Save and sign in' }).click()
    await expect(errorNote(page)).toHaveText('Password must be at least 8 characters')
  })

  test('a tampered link is refused', async ({ page }) => {
    await page.goto('/auth/confirm?token_hash=not-a-real-hash&type=recovery&next=/reset-password')
    await expect(page).toHaveURL(/\/forgot-password/)
  })

  test('the link cannot be used to bounce you off-site', async ({ page }) => {
    const account = await register(page)
    await logout(page)

    await page.goto('/forgot-password')
    await page.fill('input[name="email"]', account.email)
    await page.getByRole('button', { name: 'Send me a link' }).click()
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

    const mail = await latestMail(page, account.email)
    const link = resetLinkFrom(mail.HTML)!
    // `next` arrives from a URL. A redirect that forwards wherever it's told is
    // an open redirect: a link that looks like ours, landing on someone else's
    // login page, asking for a password.
    const hijacked = link.replace('next=%2Freset-password', 'next=https%3A%2F%2Fevil.example.com')
    await page.goto(hijacked)
    expect(new URL(page.url()).host).not.toContain('evil.example.com')
  })
})
