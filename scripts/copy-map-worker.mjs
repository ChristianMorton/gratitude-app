import { copyFileSync, mkdirSync } from 'node:fs'

// MapLibre v6 ships its worker separately. Serve it from this application's
// origin so bundler-relative worker URLs cannot resolve to a missing route.
mkdirSync('public/maplibre', { recursive: true })
copyFileSync('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', 'public/maplibre/worker.mjs')
copyFileSync('node_modules/maplibre-gl/LICENSE.txt', 'public/maplibre/LICENSE.txt')
