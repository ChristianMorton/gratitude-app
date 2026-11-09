import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/generated/database.types'

/**
 * Supabase clients for server code.
 *
 * A new client per request, never a module-level singleton: each one closes over
 * that request's cookies, and sharing one would hand a caller someone else's
 * session.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

/**
 * Acts as the signed-in user, so RLS applies to everything it touches. This is
 * the default: reach for it unless you have a specific reason not to.
 */
export async function supabaseServer() {
  const store = await cookies()

  return createServerClient<Database>(URL, PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) store.set(name, value, options)
        } catch {
          // Server Components can't write cookies. That's expected and fine:
          // middleware refreshes the session on every request, so the only
          // writes lost here are ones already made there.
        }
      },
    },
  })
}

/**
 * Bypasses RLS completely. Server-only, and only for the things RLS genuinely
 * cannot do:
 *
 *   - resolving a username to an email at sign-in (you're not signed in yet, so
 *     no policy could let you read it, and the app has always allowed either);
 *   - deleting a half-created account when the profile insert fails after signUp.
 *
 * Anything reachable by a signed-in user should use `supabaseServer()` and let
 * the policies decide. Every call here is a place where the privacy model is
 * whatever this code remembers to check.
 */
export function supabaseAdmin() {
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!secret) throw new Error('SUPABASE_SECRET_KEY is not set')

  return createClient<Database>(URL, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
