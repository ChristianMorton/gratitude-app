import { expect, test } from '@playwright/test'
import { errorNote, login, logout, makeAccount, register } from './support'

test.describe('registration', () => {
  test('creates an account and signs you straight in', async ({ page }) => {
    const account = await register(page)
    await expect(page).toHaveURL(/\/feed$/)
    await expect(page.getByRole('link', { name: 'Gratitude' })).toBeVisible()
    await expect(page.getByText('Nothing here yet. Write your first gratitude above.')).toBeVisible()
    // The account is real, not a fixture: its own name is what it signed up with.
    expect(account.username).toBeTruthy()
  })

  test('refuses a username someone already has, without losing what you typed', async ({ page }) => {
    const taken = await register(page)
    await logout(page)

    const second = makeAccount()
    await page.goto('/register')
    await page.fill('input[name="displayName"]', second.displayName)
    await page.fill('input[name="username"]', taken.username)
    await page.fill('input[name="email"]', second.email)
    await page.fill('input[name="password"]', second.password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(errorNote(page)).toHaveText('That username is taken')
    await expect(page).toHaveURL(/\/register$/)
    // Preserving user input on error is the whole point of failing in place.
    await expect(page.locator('input[name="email"]')).toHaveValue(second.email)
  })

  test('rejects a password under 8 characters', async ({ page }) => {
    const account = makeAccount()
    await page.goto('/register')
    await page.fill('input[name="displayName"]', account.displayName)
    await page.fill('input[name="username"]', account.username)
    await page.fill('input[name="email"]', account.email)
    await page.fill('input[name="password"]', 'short')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(errorNote(page)).toContainText('at least 8 characters')
  })
})

test.describe('signing in', () => {
  test('works with a username', async ({ page, context }) => {
    const account = await register(page)
    await logout(page)
    await login(page, account)
    await expect(page).toHaveURL(/\/feed$/)
    // Supabase names its session cookie sb-<project-ref>-auth-token, so match the
    // shape rather than a literal: the ref differs between the local stack and
    // the hosted project, and this suite has to pass against both.
    const cookies = await context.cookies()
    expect(
      cookies.some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token')),
      `expected a Supabase session cookie, got: ${cookies.map((c) => c.name).join(', ')}`,
    ).toBe(true)
  })

  test('works with an email address', async ({ page }) => {
    const account = await register(page)
    await logout(page)

    await page.goto('/login')
    await page.fill('input[name="identifier"]', account.email)
    await page.fill('input[name="password"]', account.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/feed$/)
  })

  /**
   * Regression: the form is a client component, so before it hydrates the browser
   * falls back to a native GET and puts the password in the query string — and
   * then in history and the server log. It shipped that way, and a 200 on the page
   * did not reveal it. Only pressing the button does.
   */
  test('never puts the password in the URL', async ({ page }) => {
    const account = await register(page)
    await logout(page)

    const loginRequests: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('/api/auth/login')) loginRequests.push(r.method())
    })

    await page.goto('/login')
    await page.fill('input[name="identifier"]', account.username)
    await page.fill('input[name="password"]', account.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('**/feed')

    expect(page.url()).not.toContain('password=')
    expect(page.url()).not.toContain('identifier=')
    expect(loginRequests, 'credentials must go by POST, never a native GET').toEqual(['POST'])
  })

  test('says so plainly when the password is wrong, and keeps you on the page', async ({ page }) => {
    const account = await register(page)
    await logout(page)

    await page.goto('/login')
    await page.fill('input[name="identifier"]', account.username)
    await page.fill('input[name="password"]', 'definitely-not-the-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(errorNote(page)).toHaveText('Incorrect username or password')
    await expect(page).toHaveURL(/\/login$/)
    expect(page.url()).not.toContain('password=')
  })

  test('does not reveal whether an account exists', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="identifier"]', 'no_such_person_at_all')
    await page.fill('input[name="password"]', 'whatever-this-is')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Same wording as a wrong password: an attacker learns nothing from the copy.
    await expect(errorNote(page)).toHaveText('Incorrect username or password')
  })
})

test.describe('the closed door', () => {
  for (const path of ['/feed', '/map', '/friends']) {
    test(`${path} sends a signed-out visitor to the login page`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login$/)
    })
  }

  test('signing out ends the session for real', async ({ page }) => {
    await register(page)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login$/)

    // Not just a redirect: the session is gone, so the door is shut behind you.
    await page.goto('/feed')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('a signed-in person is bounced off the auth pages', async ({ page }) => {
    await register(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/feed$/)
    await page.goto('/register')
    await expect(page).toHaveURL(/\/feed$/)
  })
})
