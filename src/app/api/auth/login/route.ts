import { NextResponse } from 'next/server'
import { login, loginSchema } from '@/server/auth/service'
import { handler } from '@/server/http'

export const runtime = 'nodejs'

export const POST = handler(async (request: Request) => {
  const viewer = await login(loginSchema.parse(await request.json()))
  return NextResponse.json({ user: viewer })
})
