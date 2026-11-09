import { z } from 'zod'
import { ApiError } from '@/server/http'

/**
 * ~110 m. Deliberately coarse: the pin still lands on the right block, but the
 * database never holds the user's doorstep, so even a breach of it cannot reveal
 * precisely where someone lives. This is a product decision expressed as a
 * storage constraint — and it is enforced HERE, on the server, because rounding
 * in the browser is unenforceable.
 */
const DECIMALS = 3

const round = (value: number) => Number(value.toFixed(DECIMALS))

export const locationInputSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  source: z.enum(['photo', 'device']),
  label: z.string().trim().max(120).optional(),
})

export type LocationInput = z.infer<typeof locationInputSchema>

export interface NormalizedLocation {
  latitude: number
  longitude: number
  source: 'photo' | 'device'
  label?: string
}

export function normalizeLocation(input: LocationInput): NormalizedLocation {
  const latitude = round(input.latitude)
  const longitude = round(input.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError(400, 'That location is not valid')
  }

  // (0,0) is in the Gulf of Guinea. In practice it is always an unset value that
  // got coerced to zero, never a place someone was actually grateful. The
  // database rejects it too (see the location_sane CHECK constraint).
  if (latitude === 0 && longitude === 0) {
    throw new ApiError(400, 'That location is not valid')
  }

  return {
    latitude,
    longitude,
    source: input.source,
    label: input.label || undefined,
  }
}
