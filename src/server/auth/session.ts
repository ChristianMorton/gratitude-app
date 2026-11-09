import { supabaseServer } from '@/server/supabase/server'

export interface Viewer {
  id: string
  username: string
  displayName: string
  email: string
}

/**
 * The signed-in user, or null.
 *
 * Same shape as the hand-rolled version it replaces, deliberately: every route
 * and layout already asks for a Viewer, and none of them should have to care
 * that the session is now Supabase's. What changed underneath:
 *
 *  - Identity comes from a verified JWT (`getClaims`), not our own `jose` token.
 *  - `tokenVersion` is gone. It let us revoke every token a user held by
 *    bumping one integer. Supabase's equivalent is `auth.sessions`, revoked via
 *    signOut scope or the admin API — note that deleting a user does NOT
 *    invalidate tokens already issued to them.
 *  - The display fields live in `public.profiles`; the email lives in
 *    `auth.users` and arrives inside the JWT.
 *
 * `getClaims()` verifies the signature locally. `getSession()` would not, and is
 * never safe to authorise with; `getUser()` would, but at the cost of a network
 * round-trip to the auth server on every call.
 */
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await supabaseServer()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return null

  const id = data.claims.sub
  const email = typeof data.claims.email === 'string' ? data.claims.email : ''
  if (!id) return null

  // RLS lets any signed-in user read profiles, so this needs no elevation.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', id)
    .maybeSingle()

  // A verified token with no profile row means registration failed halfway.
  // Treat it as signed out rather than inventing a half-user.
  if (!profile) return null

  return { id, username: profile.username, displayName: profile.display_name, email }
}

/** As getViewer, but throws UnauthorizedError. Route handlers map that to a 401. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer()
  if (!viewer) throw new UnauthorizedError()
  return viewer
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Not signed in')
    this.name = 'UnauthorizedError'
  }
}

export async function endSession() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
}
