import { NextResponse } from 'next/server'
import { endSession } from '@/server/auth/session'
import { handler } from '@/server/http'

export const runtime = 'nodejs'

export const POST = handler(async () => {
  await endSession()
  return NextResponse.json({ ok: true })
})
