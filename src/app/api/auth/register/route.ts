import { NextResponse } from 'next/server'
import { register, registerSchema } from '@/server/auth/service'
import { handler } from '@/server/http'

export const runtime = 'nodejs'

export const POST = handler(async (request: Request) => {
  const viewer = await register(registerSchema.parse(await request.json()))
  return NextResponse.json({ user: viewer }, { status: 201 })
})
