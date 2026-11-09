import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Liveness + readiness. Reaches the database, not just the process — a container
 * that answers 200 while its database is unreachable is worse than one that
 * fails honestly, because CI's smoke gate would wave a broken deploy through.
 *
 * A real query against a real table rather than `select 1`: the database now
 * lives somewhere else entirely, so "can I open a socket" is a much weaker claim
 * than it used to be. This proves PostgREST is answering and the schema is
 * actually there.
 *
 * `head: true` fetches no rows — it counts — so a health check cannot return
 * anyone's data, however this file gets edited later.
 */
export async function GET() {
  try {
    const { error } = await supabaseAdmin()
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, db: 'up' })
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 })
  }
}
