import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { supabaseServer } from '@/server/supabase/server'

export const runtime = 'nodejs'

/**
 * The server half of a link sent by email.
 *
 * Supabase's default templates use the implicit flow: the tokens ride in a URL
 * fragment for the browser to read. This app verifies on the server, so the mail
 * carries a `token_hash` instead and this route trades it for a session — see
 * supabase/templates/recovery.html.
 *
 * `next` is deliberately restricted to a path on this site. It arrives from a
 * URL, and a redirect that forwards to whatever a query param says is an open
 * redirect: a link that looks like ours, lands on someone else's login page, and
 * asks for a password.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/feed'

  // Our own paths only: no scheme, no host, no protocol-relative "//evil.com".
  const destination = next.startsWith('/') && !next.startsWith('//') ? next : '/feed'

  if (!token_hash || !type) {
    redirect('/login?error=invalid_link')
  }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  // Expired, already used, or tampered with. All the same to the person holding
  // it: ask for a new one rather than explain which.
  if (error) {
    redirect('/forgot-password?error=expired')
  }

  // Verified — the session cookie is set, so the reset page can call updateUser.
  redirect(destination)
}
