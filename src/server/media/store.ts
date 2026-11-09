import { randomBytes } from 'node:crypto'
import { supabaseAdmin } from '@/server/supabase/server'
import type { ProcessedImage } from './process'

export const BUCKET = 'post-photos'

/** The only object-name shape we ever generate. Anything else is not ours. */
const OBJECT_NAME = /^[a-f0-9]{32}\.jpg$/

/**
 * Photos in Supabase Storage, in a bucket that is private and stays private.
 *
 * Uploads still go through this server rather than straight from the browser to
 * Storage — the idiomatic Supabase shape, and the wrong one for this app. A
 * direct upload puts the user's original JPEG in the bucket with its EXIF GPS
 * intact: exactly the v1 bug this rewrite exists to undo, where a friend could
 * download a photo and read the coordinates out of the file, walking past every
 * database privacy rule. `processImage()` re-encodes those tags away, and it can
 * only do that here.
 *
 * The secret key is used because nobody but this server may touch the bucket.
 * There are deliberately no storage policies for `authenticated`: the only way
 * in or out is /api/media/[id], which checks the post's visibility first.
 */
export async function storeImage(image: ProcessedImage): Promise<string> {
  // 16 random bytes, and an extension from what we actually encoded — never from
  // the user's filename, which v1 trusted and which is attacker-controlled.
  const name = `${randomBytes(16).toString('hex')}.${image.extension}`

  const { error } = await supabaseAdmin()
    .storage.from(BUCKET)
    .upload(name, image.buffer, { contentType: 'image/jpeg', upsert: false })

  if (error) throw new Error(`Could not store the photo: ${error.message}`)
  return name
}

/**
 * Read a stored image back. Rejects any name that isn't exactly what we generate,
 * so a crafted id cannot address arbitrary objects in the bucket.
 */
export async function readImage(name: string): Promise<Buffer | null> {
  if (!OBJECT_NAME.test(name)) return null

  const { data, error } = await supabaseAdmin().storage.from(BUCKET).download(name)
  if (error || !data) return null

  return Buffer.from(await data.arrayBuffer())
}

/**
 * Remove a stored image. Safe to call for something already gone.
 *
 * Never throws: the database row is the source of truth, so deleting a post must
 * not fail because its object had already vanished. A leftover object is a
 * wasted block; a post that won't delete is a bug the user can see.
 */
export async function deleteImage(name: string | null | undefined): Promise<void> {
  if (!name || !OBJECT_NAME.test(name)) return

  try {
    await supabaseAdmin().storage.from(BUCKET).remove([name])
  } catch {
    // Already gone, or never written. Either way there's nothing to do.
  }
}
