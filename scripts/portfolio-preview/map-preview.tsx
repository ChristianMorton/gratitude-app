'use client'

// Preview-only copy: external demonstration basemap, fictional locations.
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, MapGeoJSONFeature } from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/components/ui'
import type { MapData } from '@/server/posts/service'
import 'maplibre-gl/dist/maplibre-gl.css'


const SOURCE = 'gratitudes'

// Where the map opens when you have no pins yet. The archive is global now, so
// this is a choice about where *these* people live rather than the edge of what
// we hold — point it somewhere else if that stops being true.
const DEFAULT_VIEW = { center: [-2.5, 54.0] as [number, number], zoom: 4.5 }

interface PinProperties {
  id: string
  content: string
  createdAt: string
  photoUrl: string | null
  label: string | null
}

export function GratitudeMap({ geojson, bounds, withoutLocation }: MapData) {
  const container = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<PinProperties | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!container.current) return
    maplibregl.setWorkerUrl('/maplibre/worker.mjs')

    // Teach MapLibre to read pmtiles:// URLs. Every source below is same-origin:
    // no tile server anywhere learns which coordinates this user looks at.
    const protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)

    const map = new maplibregl.Map({
      container: container.current,
      style: 'https://demotiles.maplibre.org/style.json',
      // Start where the pins are, so no tile is fetched only to be discarded.
      ...(bounds
        ? { bounds: bounds as [number, number, number, number], fitBoundsOptions: { padding: 80, maxZoom: 13 } }
        : DEFAULT_VIEW),
      attributionControl: { compact: true },
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      map.addSource(SOURCE, {
        type: 'geojson',
        data: geojson,
        // On from day one: it's one flag, and retrofitting clustering once the
        // pins pile up is worse than never needing it.
        cluster: true,
        clusterRadius: 45,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#c1440e',
          'circle-opacity': 0.85,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 30],
        },
      })

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Medium'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      })

      map.addLayer({
        id: 'pin',
        type: 'circle',
        source: SOURCE,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#c1440e',
          'circle-radius': 8,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#fdf6e8',
        },
      })

      map.on('click', 'pin', (event) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined
        if (feature) setSelected(feature.properties as unknown as PinProperties)
      })

      map.on('click', 'clusters', async (event) => {
        const feature = event.features?.[0]
        if (!feature) return
        const source = map.getSource(SOURCE) as GeoJSONSource
        const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id)
        map.easeTo({
          center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
          zoom,
        })
      })

      for (const layer of ['pin', 'clusters']) {
        map.on('mouseenter', layer, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = ''
        })
      }
    })

    return () => {
      map.remove()
      maplibregl.removeProtocol('pmtiles')
    }
  }, [geojson, bounds])

  const empty = geojson.features.length === 0

  return (
    <div className="relative h-[calc(100dvh-11rem)] overflow-hidden rounded-xl border">
      <div ref={container} className="h-full w-full" />

      {empty && (
        <div className="pointer-events-none absolute inset-x-0 top-4 mx-auto w-fit rounded-lg bg-background/95 px-4 py-2 text-sm shadow">
          No gratitudes have a location yet. Add one when you post.
        </div>
      )}

      {withoutLocation > 0 && !dismissed && (
        <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-lg bg-background/95 px-3 py-2 text-xs shadow">
          <span>
            {withoutLocation} {withoutLocation === 1 ? 'gratitude has' : 'gratitudes have'} no
            location
          </span>
          <button
            onClick={() => setDismissed(true)}
            className={cn(
              'inline-flex cursor-pointer items-center justify-center rounded-lg px-2 py-1',
              'font-medium whitespace-nowrap text-muted-foreground hover:text-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              'pointer-coarse:min-h-11 pointer-coarse:px-3',
            )}
          >
            Dismiss
          </button>
        </div>
      )}

      {selected && (
        <aside className="absolute inset-x-3 bottom-3 space-y-2 rounded-xl border bg-card p-4 shadow-lg sm:max-w-sm">
          <div className="flex items-start justify-between gap-3">
            <time className="text-xs text-muted-foreground">
              {new Date(selected.createdAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className={cn(
                'inline-flex cursor-pointer items-center justify-center rounded-lg px-2 py-1',
                'text-muted-foreground hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
              )}
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-pretty">{selected.content}</p>
          {selected.label && <p className="text-xs text-muted-foreground">{selected.label}</p>}
          {selected.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- served from our own route
            <img src={selected.photoUrl} alt="" className="w-full rounded-lg border" />
          )}
        </aside>
      )}
    </div>
  )
}


