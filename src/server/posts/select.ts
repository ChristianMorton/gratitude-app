/**
 * The shape of a post as anyone is allowed to read it.
 *
 * `post_locations` is deliberately ABSENT. PostgREST returns exactly the columns
 * asked for and embeds only the relations named, so omitting the join is what
 * keeps coordinates in the database — the same argument the separate table was
 * built on. RLS is now the guarantee underneath (`locations are readable only by
 * the post's author`), but never lean on that: ask for the columns you mean, so
 * a policy mistake has nothing to leak through.
 */
export const FEED_POST_COLUMNS =
  'id, content, visibility, created_at, photo_path, photo_width, photo_height, author:profiles!posts_author_id_fkey (id, username, display_name)'

/** Owner-only. Used exclusively by queries hard-scoped to `author_id = viewer.id`. */
export const MAP_PIN_COLUMNS =
  'id, content, created_at, photo_path, location:post_locations (latitude, longitude, label, source)'

/** A post's author, as everyone else sees them. */
export interface PostAuthor {
  id: string
  username: string
  displayName: string
}

/**
 * Kept in the app's own casing rather than the database's snake_case. The wire
 * format is an implementation detail of where the data happens to live; the
 * components have always spoken camelCase, and shouldn't have to change because
 * the storage did.
 */
export interface FeedPost {
  id: string
  content: string
  visibility: 'close' | 'friends' | 'private'
  createdAt: string
  photoUrl: string | null
  photoWidth: number | null
  photoHeight: number | null
  author: PostAuthor
}

export interface MapPin {
  id: string
  content: string
  createdAt: string
  photoUrl: string | null
  location: {
    latitude: number
    longitude: number
    label: string | null
    source: 'photo' | 'device'
  } | null
}

/** The row shape PostgREST hands back for FEED_POST_COLUMNS. */
interface FeedPostRow {
  id: string
  content: string
  visibility: 'close' | 'friends' | 'private'
  created_at: string
  photo_path: string | null
  photo_width: number | null
  photo_height: number | null
  author: { id: string; username: string; display_name: string } | null
}

/**
 * Photos are served through our own route, never from a storage URL: the bucket
 * is private, and a signed URL is a bearer token that works for whoever holds it.
 * `/api/media/[id]` stays the only door, so a photo is exactly as visible as the
 * post it belongs to.
 */
export function photoUrlFor(postId: string, photoPath: string | null): string | null {
  return photoPath ? `/api/media/${postId}` : null
}

export function toFeedPost(row: FeedPostRow): FeedPost {
  return {
    id: row.id,
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
    photoUrl: photoUrlFor(row.id, row.photo_path),
    photoWidth: row.photo_width,
    photoHeight: row.photo_height,
    author: row.author
      ? { id: row.author.id, username: row.author.username, displayName: row.author.display_name }
      : { id: '', username: 'unknown', displayName: 'Unknown' },
  }
}
