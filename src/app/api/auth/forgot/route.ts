import { NextResponse } from 'next/server'
import { z } from 'zod'
import { handler } from '@/server/http'
import { supabaseServer } from '@/server/supabase/server'

export const runtime = 'nodejs'

const forgotSchema = z.object({
  email: z.email('Enter a valid email address').max(255),
})

/**
 * Send a password reset link.
 *
 * Always answers 202, whether or not there is an account behind that address.
 * The sign-in copy is careful never to reveal whether a username exists; a reset
 * form that says "no such account" would hand that back in one request. So the
 * page says "if there's an account, a link is on its way" and means it.
 *
 * The redirect goes to /auth/confirm rather than straight to the reset page:
 * the mail carries a token_hash that has to be verified on the server before
 * there's a session to change a password with.
 */
export const POST = handler(async (request: Request) => {
  const { email } = forgotSchema.parse(await request.json())

  // The app's own origin, not a configured constant: dev is :3000, the e2e suite
  // is :3100, and production is somewhere else again. Reading it from the
  // request means the link always comes back to the site that sent it.
  const origin = new URL(request.url).origin
  const supabase = await supabaseServer()

  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  })

  // Deliberately ignoring the result. Supabase does not distinguish "sent" from
  // "no such user" here either, and rate limits are its business, not something
  // to leak back to whoever is asking.
  return NextResponse.json({ ok: true }, { status: 202 })
})
