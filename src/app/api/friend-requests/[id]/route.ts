import { NextResponse } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { acceptRequest, cancelRequest, declineRequest } from '@/server/friends/service'
import { ApiError, handler } from '@/server/http'

export const runtime = 'nodejs'

type Context = { params: Promise<{ id: string }> }

/** POST with { action: 'accept' | 'decline' } — recipient only. */
export const POST = handler(async (request: Request, { params }: Context) => {
  const viewer = await requireViewer()
  const { id } = await params
  const { action } = await request.json()

  if (action === 'accept') await acceptRequest(viewer.id, id)
  else if (action === 'decline') await declineRequest(viewer.id, id)
  else throw new ApiError(400, 'Unknown action')

  return NextResponse.json({ ok: true })
})

/** Sender withdraws their own pending request. */
export const DELETE = handler(async (_request: Request, { params }: Context) => {
  const viewer = await requireViewer()
  const { id } = await params
  await cancelRequest(viewer.id, id)
  return NextResponse.json({ ok: true })
})
