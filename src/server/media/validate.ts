import { ApiError } from '@/server/http'

export const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

/** Photos only. No video in v1 — a video with no player is a broken post. */
export type ImageKind = 'jpeg' | 'png' | 'webp'

/**
 * Identify an image by its MAGIC BYTES, never by the client-supplied
 * `file.type` or filename — both are trivially forged. v1 trusted `file.type`
 * and derived the stored extension from the user's filename.
 */
export function sniffImage(buffer: Buffer): ImageKind | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }
  return null
}

/** Throws ApiError unless this really is an image we accept, of a sane size. */
export function validateImage(buffer: Buffer): ImageKind {
  if (buffer.length === 0) throw new ApiError(400, 'That file is empty')
  if (buffer.length > MAX_BYTES) throw new ApiError(413, 'Images must be under 10 MB')

  const kind = sniffImage(buffer)
  if (!kind) throw new ApiError(415, 'Only JPEG, PNG and WebP images are supported')
  return kind
}
