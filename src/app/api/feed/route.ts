import { NextResponse, type NextRequest } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { handler } from '@/server/http'
import { getFeed } from '@/server/posts/service'

export const runtime = 'nodejs'

export const GET = handler(async (request: NextRequest) => {
  const viewer = await requireViewer()
  const page = await getFeed(viewer.id, request.nextUrl.searchParams.get('cursor'))
  return NextResponse.json(page)
})
