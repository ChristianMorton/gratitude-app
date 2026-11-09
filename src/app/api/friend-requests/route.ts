import { NextResponse } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { listRequests, requestSchema, sendRequest } from '@/server/friends/service'
import { handler } from '@/server/http'

export const runtime = 'nodejs'

export const GET = handler(async () => {
  const viewer = await requireViewer()
  return NextResponse.json(await listRequests(viewer.id))
})

export const POST = handler(async (request: Request) => {
  const viewer = await requireViewer()
  const { username } = requestSchema.parse(await request.json())
  const result = await sendRequest(viewer.id, username)
  return NextResponse.json(result, { status: 201 })
})
