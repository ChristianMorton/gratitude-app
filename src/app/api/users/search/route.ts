import { NextResponse, type NextRequest } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { searchUsers } from '@/server/friends/service'
import { handler } from '@/server/http'

export const runtime = 'nodejs'

export const GET = handler(async (request: NextRequest) => {
  const viewer = await requireViewer()
  const query = request.nextUrl.searchParams.get('q') ?? ''
  return NextResponse.json({ users: await searchUsers(viewer.id, query) })
})
