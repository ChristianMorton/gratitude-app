import { NextResponse } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { listFriends } from '@/server/friends/service'
import { handler } from '@/server/http'

export const runtime = 'nodejs'

export const GET = handler(async () => {
  const viewer = await requireViewer()
  return NextResponse.json({ friends: await listFriends(viewer.id) })
})
