import { NextResponse } from 'next/server'
import { requireViewer } from '@/server/auth/session'
import { handler } from '@/server/http'
import { getMapData } from '@/server/posts/service'

export const runtime = 'nodejs'

/**
 * The viewer's OWN pins, as GeoJSON. The map page renders from the server
 * directly; this exists for any client that needs to refetch them.
 *
 * There is deliberately no viewer parameter and no privacy branch: the query
 * underneath is hard-scoped to `authorId: viewer.id`. The map never consults the
 * feed's visibility rules, because there is nothing to decide — coordinates
 * belong to their author and to nobody else.
 */
export const GET = handler(async () => {
  const viewer = await requireViewer()
  return NextResponse.json(await getMapData(viewer.id))
})
