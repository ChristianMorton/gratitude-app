import { NextResponse } from 'next/server'
import { getViewer } from '@/server/auth/session'
import { handler } from '@/server/http'

export const runtime = 'nodejs'

export const GET = handler(async () => {
  return NextResponse.json({ user: await getViewer() })
})
