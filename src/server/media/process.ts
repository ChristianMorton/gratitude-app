import sharp from 'sharp'
import { ApiError } from '@/server/http'
import { validateImage } from './validate'

const MAX_DIMENSION = 2048
const QUALITY = 82

export interface ProcessedImage {
  buffer: Buffer
  width: number
  height: number
  extension: 'jpg'
}

/**
 * Re-encode an upload, which drops ALL metadata — crucially including EXIF GPS.
 *
 * This is not incidental; it is the point. v1 wrote the raw client buffer
 * straight to disk and served it at a public URL, so a photo's own GPS tags went
 * out with it. A friend could download a friend's photo and read the coordinates
 * out of the file, walking straight past every database-level privacy rule.
 * Owner-only coordinates in Postgres mean nothing if they also ride along inside
 * the JPEG we hand out.
 *
 * `.rotate()` with no argument applies the EXIF orientation to the pixels first,
 * so dropping the tag doesn't leave the image sideways.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  validateImage(input)

  try {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer({ resolveWithObject: true })

    return { buffer: data, width: info.width, height: info.height, extension: 'jpg' }
  } catch {
    throw new ApiError(400, 'That image could not be processed')
  }
}
