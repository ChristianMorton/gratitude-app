import { NextResponse } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { handler } from '@/server/http'
import { deletePost, getPost } from '@/server/posts/service'

export const runtime = 'nodejs'

type Context = { params: Promise<{ id: string }> }

export const GET = handler(async (_request: Request, { params }: Context) => {
  const viewer = await requireViewer()
  const { id } = await params
  return NextResponse.json({ post: await getPost(viewer.id, id) })
})

export const DELETE = handler(async (_request: Request, { params }: Context) => {
  const viewer = await requireViewer()
  const { id } = await params
  await deletePost(viewer.id, id)
  return NextResponse.json({ ok: true })
})
