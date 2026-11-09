import { NextResponse } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { ApiError, handler } from '@/server/http'
import { locationInputSchema, normalizeLocation } from '@/server/location/normalize'
import { processImage } from '@/server/media/process'
import { storeImage } from '@/server/media/store'
import { createPost, createPostSchema } from '@/server/posts/service'

export const runtime = 'nodejs'

export const POST = handler(async (request: Request) => {
  const viewer = await requireViewer()
  const contentType = request.headers.get('content-type') ?? ''

  // JSON for a plain text gratitude; multipart when there's a photo or location.
  if (contentType.includes('application/json')) {
    const input = createPostSchema.parse(await request.json())
    return NextResponse.json({ post: await createPost(viewer.id, input) }, { status: 201 })
  }

  if (!contentType.includes('multipart/form-data')) {
    throw new ApiError(415, 'Unsupported content type')
  }

  const form = await request.formData()
  const input = createPostSchema.parse({
    content: form.get('content'),
    visibility: form.get('visibility') ?? undefined,
  })

  // ─── Photo ────────────────────────────────────────────────────────────────
  // The stored object's NAME, not a URL. The name never leaves the server: the
  // browser only ever sees /api/media/<post id>, so a photo cannot be addressed
  // independently of the post whose visibility governs it.
  //
  // processImage() first, always. It re-encodes, which is what drops the EXIF
  // GPS — the reason uploads come through here rather than going straight from
  // the browser to Storage.
  let photo: { path: string; width: number; height: number } | undefined
  const file = form.get('photo')
  if (file instanceof File && file.size > 0) {
    const processed = await processImage(Buffer.from(await file.arrayBuffer()))
    const path = await storeImage(processed)
    photo = { path, width: processed.width, height: processed.height }
  }

  // ─── Location ─────────────────────────────────────────────────────────────
  // Always explicit: the client only sends this when the user asked for it.
  let location: ReturnType<typeof normalizeLocation> | undefined
  const latitude = form.get('latitude')
  const longitude = form.get('longitude')
  if (latitude !== null && longitude !== null && latitude !== '' && longitude !== '') {
    location = normalizeLocation(
      locationInputSchema.parse({
        latitude,
        longitude,
        source: form.get('locationSource') ?? 'device',
        label: form.get('locationLabel') || undefined,
      }),
    )
  }

  const post = await createPost(viewer.id, input, photo, location)
  return NextResponse.json({ post }, { status: 201 })
})
