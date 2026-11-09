import { z } from 'zod'
import { ApiError, notFound } from '@/server/http'
import { deleteImage } from '@/server/media/store'
import { supabaseServer } from '@/server/supabase/server'
import { FEED_POST_COLUMNS, MAP_PIN_COLUMNS, toFeedPost, type FeedPost } from './select'

export const PAGE_SIZE = 20

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Write something you are grateful for')
    .max(500, 'Keep it under 500 characters'),
  // Private until you say otherwise. Widening the audience is the deliberate act.
  visibility: z.enum(['close', 'friends', 'private']).default('private'),
})

// ─── Cursor ───────────────────────────────────────────────────────────────────
// Keyset, encoding BOTH sort keys. v1 cursored on one column while sorting by
// another, which is undefined on ties; that is why this carries created_at *and*
// id, and why the comparison below is a lexicographic tuple rather than a
// timestamp test.

interface Cursor {
  createdAt: string
  id: string
}

export function encodeCursor(post: { createdAt: string; id: string }): string {
  return Buffer.from(`${post.createdAt}|${post.id}`).toString('base64url')
}

export function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null
  try {
    const [iso, id] = Buffer.from(raw, 'base64url').toString().split('|')
    if (!id || !iso || Number.isNaN(new Date(iso).getTime())) return null
    return { createdAt: iso, id }
  } catch {
    return null
  }
}

export interface FeedPage {
  posts: FeedPost[]
  nextCursor: string | null
}

/**
 * The feed: every post the viewer is allowed to see, newest first.
 *
 * There is no visibility clause here any more. The `posts are visible per the
 * visibility rules` policy applies it in Postgres, before the limit — which is
 * the property that mattered about visiblePostsWhere() and is why v1's feed
 * dropped posts from pages. `take + 1` and `hasMore` still measure the same set,
 * because there is no filtering step between them.
 */
export async function getFeed(_viewerId: string, rawCursor?: string | null): Promise<FeedPage> {
  const supabase = await supabaseServer()
  const cursor = decodeCursor(rawCursor)

  let query = supabase
    .from('posts')
    .select(FEED_POST_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  // Strictly "after" the cursor in [created_at desc, id desc]: an older row, or
  // the same instant with a smaller id. `and(...)` inside `or(...)` is how
  // PostgREST spells the second half of that tuple comparison.
  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error) throw new ApiError(500, `Could not load the feed: ${error.message}`)

  const rows = (data ?? []).map(toFeedPost)
  const hasMore = rows.length > PAGE_SIZE
  const posts = rows.slice(0, PAGE_SIZE)
  const last = posts.at(-1)

  return { posts, nextCursor: hasMore && last ? encodeCursor(last) : null }
}

/** 404 rather than 403 for a post you may not see — a 403 confirms it exists. */
export async function getPost(_viewerId: string, postId: string): Promise<FeedPost> {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('posts')
    .select(FEED_POST_COLUMNS)
    .eq('id', postId)
    .maybeSingle()

  // RLS already turns "not allowed" into "no rows", so an invisible post and a
  // missing one are indistinguishable from here. That is the intended answer.
  if (error) throw new ApiError(500, error.message)
  if (!data) throw notFound()
  return toFeedPost(data)
}

export async function createPost(
  authorId: string,
  input: z.infer<typeof createPostSchema>,
  photo?: { path: string; width: number; height: number },
  location?: { latitude: number; longitude: number; source: 'photo' | 'device'; label?: string },
): Promise<FeedPost> {
  const supabase = await supabaseServer()

  const { data: created, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      content: input.content,
      visibility: input.visibility,
      photo_path: photo?.path ?? null,
      photo_width: photo?.width ?? null,
      photo_height: photo?.height ?? null,
    })
    .select(FEED_POST_COLUMNS)
    .single()

  if (error || !created) throw new ApiError(400, error?.message ?? 'Could not post')

  if (location) {
    const { error: locationError } = await supabase.from('post_locations').insert({
      post_id: created.id,
      latitude: location.latitude,
      longitude: location.longitude,
      source: location.source,
      label: location.label ?? null,
    })
    // Two statements, no transaction: PostgREST has no way to span them. A post
    // that lost its pin is a small loss; a pin that outlives its post cannot
    // happen, because the row cascades. So write the post first and let the
    // location fail loudly rather than silently keeping half of each.
    if (locationError) throw new ApiError(400, `Post saved, but the location failed: ${locationError.message}`)
  }

  return toFeedPost(created)
}

export async function deletePost(viewerId: string, postId: string): Promise<void> {
  const supabase = await supabaseServer()

  // Scoped to the author: deleting is not a visibility question. The RLS delete
  // policy says the same thing; this makes it true in the query as well.
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, photo_path')
    .eq('id', postId)
    .eq('author_id', viewerId)
    .maybeSingle()
  if (error) throw new ApiError(500, error.message)
  if (!post) throw notFound()

  const { error: deleteError } = await supabase.from('posts').delete().eq('id', post.id)
  if (deleteError) throw new ApiError(400, deleteError.message)

  // Row first, then the file. The database is the source of truth: if this fails
  // we leak an object; the other order would leave a post rendering a broken
  // image instead.
  if (post.photo_path) await deleteImage(post.photo_path)
}

export interface MapData {
  geojson: GeoJSON.FeatureCollection
  bounds: [number, number, number, number] | null
  withoutLocation: number
}

interface MapPinRow {
  id: string
  content: string
  created_at: string
  photo_path: string | null
  location: { latitude: number; longitude: number; label: string | null; source: string } | null
}

/**
 * The viewer's pins as GeoJSON, plus the bounding box of those pins.
 *
 * Hard-scoped to author_id, with no viewer branch to get wrong — the same shape
 * as before. The RLS policy on post_locations says the same thing independently,
 * so a mistake here still cannot return someone else's coordinates.
 *
 * The bounds matter for more than convenience: without them the map opens on the
 * whole country, fetches those tiles, then immediately fits to the pins —
 * throwing the tiles away and cancelling the requests in flight.
 */
export async function getMapData(viewerId: string): Promise<MapData> {
  const supabase = await supabaseServer()

  const { data, error } = await supabase
    .from('posts')
    .select(MAP_PIN_COLUMNS)
    .eq('author_id', viewerId)
    .order('created_at', { ascending: false })
  if (error) throw new ApiError(500, error.message)

  const rows = (data ?? []) as unknown as MapPinRow[]
  const located = rows.filter((row) => row.location)
  const withoutLocation = rows.length - located.length

  const features = located.map((row) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [row.location!.longitude, row.location!.latitude],
    },
    properties: {
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      photoUrl: row.photo_path ? `/api/media/${row.id}` : null,
      label: row.location!.label,
    },
  }))

  let bounds: MapData['bounds'] = null
  if (located.length > 0) {
    const lngs = located.map((row) => row.location!.longitude)
    const lats = located.map((row) => row.location!.latitude)
    bounds = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
  }

  // Posts without coordinates are simply absent — never defaulted to 0,0.
  return { geojson: { type: 'FeatureCollection', features }, bounds, withoutLocation }
}

export { ApiError }
