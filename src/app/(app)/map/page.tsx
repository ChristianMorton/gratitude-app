import dynamic from 'next/dynamic'
import { requireViewer } from '@/server/auth/session'
import { getMapData } from '@/server/posts/service'

// MapLibre reaches for `window` at import time, so it must not render on the server.
const GratitudeMap = dynamic(() => import('@/components/gratitude-map').then((m) => m.GratitudeMap), {
  loading: () => <div className="h-[calc(100dvh-11rem)] animate-pulse rounded-xl border bg-muted" />,
})

export default async function MapPage() {
  const viewer = await requireViewer()
  const data = await getMapData(viewer.id)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Your map</h1>
        <p className="text-sm text-muted-foreground">
          Only you can see this. Locations are never shared with anyone, on any post.
        </p>
      </div>
      <GratitudeMap {...data} />
    </div>
  )
}
