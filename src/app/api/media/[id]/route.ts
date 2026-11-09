import { NextResponse } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { handler } from '@/server/http'
import { readImage } from '@/server/media/store'
import { supabaseServer } from '@/server/supabase/server'

export const runtime = 'nodejs'

/**
 * Photos are served through the same visibility rules as the posts they belong
 * to — never from a storage URL.
 *
 * v1 served uploads from a public nginx location, so any photo was readable by
 * anyone with the URL, including photos on `private` posts. Supabase Storage
 * offers the modern version of that mistake: a public bucket, or a signed URL —
 * which is a bearer token that works for whoever ends up holding it. Neither is
 * "as visible as the post it belongs to", so the bucket is private and this is
 * the only door.
 *
 * The id in the path is the POST's id, not the object's name. The object name is
 * never handed out, so it cannot be guessed or forwarded; and the lookup below
 * runs through the posts RLS policy as the *viewer*, so "may I see this photo"
 * is by construction the same question as "may I see this post".
 */
export const GET = handler(
  async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireViewer()
    const { id } = await params

    const supabase = await supabaseServer()
    const { data: post } = await supabase
      .from('posts')
      .select('photo_path')
      .eq('id', id)
      .maybeSingle()

    // RLS already collapses "not allowed" into "no rows", so an invisible post
    // and a missing one are indistinguishable from here — which is the point.
    // 404 rather than 403: a 403 would confirm the photo exists.
    if (!post?.photo_path) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const bytes = await readImage(post.photo_path)
    if (!bytes) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/jpeg',
        // Private: the response depends on who is asking, so shared caches must
        // not hand it to the next person.
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  },
)
