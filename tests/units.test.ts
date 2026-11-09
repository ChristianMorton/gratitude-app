import { describe, expect, it } from 'vitest'
import { normalizeLocation } from '@/server/location/normalize'
import { sniffImage, validateImage } from '@/server/media/validate'
import { decodeCursor, encodeCursor } from '@/server/posts/service'

/**
 * What's left of the unit suite, and why it's this and nothing else.
 *
 * The 41 tests that used to live here covered `visiblePostsWhere`, keyset
 * pagination against Prisma, owner-only locations, and media cleanup on local
 * disk. Every one of those subjects has moved into Postgres — visibility is an
 * RLS policy, pagination is PostgREST, locations are a policy, photos are a
 * private bucket. They couldn't be repaired, because the thing they tested no
 * longer exists in TypeScript.
 *
 * The rules themselves are now covered where they actually live:
 *   - the RLS policies, by the cross-account tests in tests/e2e/privacy.spec.ts,
 *     which drive two real signed-in browsers;
 *   - the feed, composer and friends flows, by the rest of tests/e2e.
 *
 * That's a real trade and worth naming: the e2e suite is slower and needs a
 * browser and a database. What survives here is the code that's still pure —
 * functions with no database in them, where a fast test is still the right tool.
 */

describe('feed cursor', () => {
  // Keyset, encoding BOTH sort keys. v1 cursored on created_at while sorting by
  // something else, which is undefined on ties — that's why the id is in here.
  it('round-trips a post', () => {
    const post = { createdAt: '2026-07-16T03:00:00.000Z', id: 'a1b2c3' }
    const decoded = decodeCursor(encodeCursor(post))
    expect(decoded).toEqual({ createdAt: post.createdAt, id: post.id })
  })

  it('carries the id, not just the timestamp', () => {
    // Two posts at the same instant must produce different cursors, or
    // pagination silently drops one of them.
    const a = encodeCursor({ createdAt: '2026-07-16T03:00:00.000Z', id: 'aaa' })
    const b = encodeCursor({ createdAt: '2026-07-16T03:00:00.000Z', id: 'bbb' })
    expect(a).not.toBe(b)
  })

  it('refuses nonsense instead of throwing', () => {
    // A cursor arrives from a query string, so it is attacker-controlled. The
    // feed should treat a bad one as "start from the top", never as a 500.
    expect(decodeCursor(null)).toBeNull()
    expect(decodeCursor(undefined)).toBeNull()
    expect(decodeCursor('')).toBeNull()
    expect(decodeCursor('not-base64!!')).toBeNull()
    expect(decodeCursor(Buffer.from('no-separator').toString('base64url'))).toBeNull()
    expect(decodeCursor(Buffer.from('not-a-date|abc').toString('base64url'))).toBeNull()
    expect(decodeCursor(Buffer.from('2026-07-16T03:00:00.000Z|').toString('base64url'))).toBeNull()
  })
})

describe('location normalising', () => {
  it('rounds to ~110m, on the server', () => {
    // Coarse on purpose: the pin lands on the right block, but the database
    // never holds someone's doorstep. Rounding in the browser is unenforceable.
    const location = normalizeLocation({
      latitude: 51.50729384,
      longitude: -0.12764991,
      source: 'device',
    })
    expect(location.latitude).toBe(51.507)
    expect(location.longitude).toBe(-0.128)
  })

  it('rejects null island', () => {
    // (0,0) is in the Gulf of Guinea. In practice it is always an unset value
    // coerced to zero, never a place someone was grateful.
    expect(() => normalizeLocation({ latitude: 0, longitude: 0, source: 'device' })).toThrow()
  })

  it('keeps a real coordinate that happens to have a zero', () => {
    expect(normalizeLocation({ latitude: 0, longitude: -0.128, source: 'device' }).longitude).toBe(-0.128)
  })

  it('drops an empty label rather than storing one', () => {
    expect(normalizeLocation({ latitude: 51.5, longitude: -0.1, source: 'photo', label: '' }).label).toBeUndefined()
  })
})

describe('image validation', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(4)])

  it('identifies by magic bytes', () => {
    expect(sniffImage(jpeg)).toBe('jpeg')
    expect(sniffImage(png)).toBe('png')
    expect(sniffImage(webp)).toBe('webp')
  })

  it('refuses a file pretending to be an image', () => {
    // v1 trusted the client's file.type and the user's filename; both are
    // trivially forged, which is the whole reason this function exists.
    expect(() => validateImage(Buffer.from('#!/bin/sh\nrm -rf /'))).toThrow(/Only JPEG, PNG and WebP/)
  })

  it('refuses an empty file', () => {
    expect(() => validateImage(Buffer.alloc(0))).toThrow(/empty/)
  })

  it('refuses anything over 10 MB', () => {
    const huge = Buffer.concat([jpeg, Buffer.alloc(10 * 1024 * 1024)])
    expect(() => validateImage(huge)).toThrow(/under 10 MB/)
  })
})
