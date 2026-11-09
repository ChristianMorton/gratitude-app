'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/generated/database.types'

/**
 * The browser's Supabase client. Only ever gets the publishable key — anything
 * with NEXT_PUBLIC_ is shipped to the browser, so the secret key must never be
 * read here.
 *
 * `createBrowserClient` already memoises, so calling this per component is fine.
 */
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
