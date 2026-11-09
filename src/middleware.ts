import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/generated/database.types'

/**
 * Refreshes the Supabase session on every request.
 *
 * This exists because Server Components cannot write cookies. Without it, an
 * expired access token is never refreshed and people are silently signed out
 * mid-session — the sort of failure that looks like "it logged me out again"
 * rather than a bug anyone can find.
 *
 * `getClaims()` and not `getSession()`: getSession returns whatever the cookie
 * says without verifying the signature, so it is not something to make an
 * access decision on. getClaims verifies the JWT. getUser() would also be
 * sound but costs a network round-trip to the auth server on every request.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          // Onto the request, so Server Components in *this* render see the
          // refreshed token…
          for (const { name, value } of toSet) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          // …and onto the response, so the browser keeps it for the next one.
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options)
        },
      },
    },
  )

  // Touching the session is what triggers the refresh. Do not remove.
  await supabase.auth.getClaims()

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets — and notably not /tiles, which is a 17GB
     * basemap served in thousands of range requests. Refreshing a session on
     * each one would be absurd.
     */
    '/((?!_next/static|_next/image|favicon.ico|tiles|fonts|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|pbf|pmtiles)$).*)',
  ],
}
