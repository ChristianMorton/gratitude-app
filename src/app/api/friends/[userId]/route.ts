import { NextResponse } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { removeFriend, setTier, tierSchema } from '@/server/friends/service'
import { handler } from '@/server/http'

export const runtime = 'nodejs'

type Context = { params: Promise<{ userId: string }> }

export const PATCH = handler(async (request: Request, { params }: Context) => {
  const viewer = await requireViewer()
  const { userId } = await params
  const { tier } = await request.json()
  await setTier(viewer.id, userId, tierSchema.parse(tier))
  return NextResponse.json({ ok: true })
})

export const DELETE = handler(async (_request: Request, { params }: Context) => {
  const viewer = await requireViewer()
  const { userId } = await params
  await removeFriend(viewer.id, userId)
  return NextResponse.json({ ok: true })
})
