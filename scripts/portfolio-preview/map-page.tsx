import { GratitudeMap } from './map-preview'
import { notFound } from 'next/navigation'

export default function MapPreview() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-6 py-6">
      <h1 className="font-display text-3xl font-semibold">A map of small good things</h1>
      <p className="text-sm text-muted-foreground">Component preview · fictional locations · external MapLibre demo basemap</p>
      <GratitudeMap bounds={[-3.5, 49.2, 3.5, 54.0]} withoutLocation={1} geojson={{ type: 'FeatureCollection', features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [-0.12, 51.5] }, properties: { id: 'fictional-london', content: 'An afternoon with a good book in the park.', createdAt: '2026-11-09T12:00:00Z', photoUrl: null, label: 'Fictional example · London' } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [2.35, 48.86] }, properties: { id: 'fictional-paris', content: 'A long walk and a conversation that stayed with me.', createdAt: '2026-11-08T12:00:00Z', photoUrl: null, label: 'Fictional example · Paris' } },
      ] }} />
      <p className="text-xs text-muted-foreground">Preview uses MapLibre demo tiles. Production uses a self-hosted basemap and does not send map viewports to this service. Database access and privacy rules are not exercised here.</p>
    </main>
  )
}
