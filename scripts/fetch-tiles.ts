/**
 * Downloads the basemap.
 *
 * The map is self-hosted on purpose. Every tile request tells the tile server
 * your IP and your viewport, and a private gratitude map opens centred on your
 * own pins — so the very first request to a third party would amount to "this
 * person lives here", before the user has even touched the map. A .pmtiles
 * archive served from our own origin means no third party is involved at all.
 *
 * `pmtiles extract` reads the remote planet build over HTTP range requests and
 * pulls down only the tiles inside the bbox, so this costs ~1.6GB of transfer
 * rather than the ~100GB the full planet would.
 *
 *   npm run tiles:fetch
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The whole planet, at neighbourhood detail.
 *
 * The trade is zoom for reach. Every zoom level is roughly 4x the tiles, so the
 * globe costs 17GB at z12, 35GB at z13 and 68GB at z14 — while the British Isles
 * alone cost 1.5GB at z14. Measured, not estimated: `pmtiles extract --dry-run`
 * will tell you before you download anything.
 *
 * z12 is a neighbourhood, not a street. MapLibre overzooms past a source's
 * maxzoom, so zooming in still works — the basemap just softens rather than going
 * blank. A gratitude remembers roughly where you were; it doesn't need the kerb.
 *
 * Narrow the bbox and raise maxzoom if your people only live in one place.
 */
const REGION = {
  name: 'the whole globe',
  // Web Mercator gives out near the poles; ±85° is the usual cutoff.
  bbox: '-180,-85,180,85',
  maxzoom: 12,
  output: 'public/tiles/world.pmtiles',
}

// Protomaps publishes a weekly planet build. Bump this when you want fresher map
// data; an old basemap is not a bug, just an out-of-date one.
const PLANET = 'https://build.protomaps.com/20260713.pmtiles'

const CLI_VERSION = '1.31.1'
const CLI_URL = `https://github.com/protomaps/go-pmtiles/releases/download/v${CLI_VERSION}/go-pmtiles_${CLI_VERSION}_Linux_x86_64.tar.gz`

const cliPath = join('node_modules', '.bin', 'pmtiles')

function ensureCli() {
  if (existsSync(cliPath)) return
  console.log(`Fetching pmtiles CLI v${CLI_VERSION}…`)
  execFileSync('bash', [
    '-c',
    `curl -sL "${CLI_URL}" | tar xz -C node_modules/.bin pmtiles && chmod +x ${cliPath}`,
  ])
}

/** The slippy tile covering a lon/lat at a zoom. */
function tileFor(lon: number, lat: number, z: number): [number, number, number] {
  const n = 2 ** z
  const rad = (lat * Math.PI) / 180
  return [
    z,
    Math.floor(((lon + 180) / 360) * n),
    Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n),
  ]
}

/**
 * Is this archive actually usable?
 *
 * `existsSync` is not enough, and the difference is not academic: an interrupted
 * extract leaves a file of exactly the right length whose missing regions are
 * holes that read back as zeros. It looks perfect — right size, valid header,
 * `pmtiles verify` passes in milliseconds because it only checks the header and
 * directories. But a third of the tile data is nothing at all.
 *
 * Downstream, that fails in the least legible way available. MapLibre asks for a
 * tile, gets zeros, gzip refuses them, and the map renders grey — with no error a
 * user could act on. It looked for all the world like a broken map library.
 *
 * So: check the bytes actually landed, then read real tiles back out.
 */
function inspect(path: string): string[] {
  const problems: string[] = []

  const stat = statSync(path)
  // A sparse file reports its full apparent size while occupying far fewer blocks.
  // That gap *is* the missing download.
  const allocated = stat.blocks * 512
  if (allocated < stat.size * 0.99) {
    const missing = (((stat.size - allocated) / stat.size) * 100).toFixed(0)
    problems.push(
      `incomplete download: ${(stat.size / 1e9).toFixed(2)}GB claimed but ` +
        `${(allocated / 1e9).toFixed(2)}GB written — ~${missing}% of the file is holes`,
    )
  }

  // Read tiles back across the zoom range. Low zooms are written first and are the
  // first thing lost, and they are exactly what an empty map (no pins, so no
  // fitBounds) displays — so a hole there is invisible until someone signs up.
  const [lon, lat] = [
    (Number(REGION.bbox.split(',')[0]) + Number(REGION.bbox.split(',')[2])) / 2,
    (Number(REGION.bbox.split(',')[1]) + Number(REGION.bbox.split(',')[3])) / 2,
  ]
  const holes: string[] = []
  for (let z = 2; z <= REGION.maxzoom; z += 2) {
    const [tz, x, y] = tileFor(lon, lat, z)
    let body: Buffer
    try {
      body = execFileSync(cliPath, ['tile', path, String(tz), String(x), String(y)], {
        maxBuffer: 64 * 1024 * 1024,
      })
    } catch {
      continue // genuinely absent tiles are fine; zeroed ones are not
    }
    // The CLI hands back whatever is on disk without judging it, so zeros arrive
    // looking like a successful read of the right length. Gzip magic is the tell.
    if (body.length > 0 && !(body[0] === 0x1f && body[1] === 0x8b)) {
      holes.push(`z${tz}/${x}/${y}`)
    }
  }
  if (holes.length) {
    problems.push(`tiles read back as zeros (the archive has holes): ${holes.join(', ')}`)
  }

  return problems
}

function main() {
  ensureCli() // needed to inspect an existing archive, not just to build one

  if (existsSync(REGION.output)) {
    const problems = inspect(REGION.output)
    if (problems.length === 0) {
      console.log(`${REGION.output} already exists and reads back clean — delete it to re-download.`)
      return
    }
    console.error(`${REGION.output} exists but is NOT usable:\n`)
    for (const problem of problems) console.error(`  ✗ ${problem}`)
    console.error(`\nDelete it and run again:\n  rm ${REGION.output} && npm run tiles:fetch`)
    process.exitCode = 1
    return
  }

  mkdirSync('public/tiles', { recursive: true })

  console.log(`Extracting ${REGION.name} (z0–${REGION.maxzoom}) from the planet build…`)
  execFileSync(
    cliPath,
    [
      'extract',
      PLANET,
      REGION.output,
      `--bbox=${REGION.bbox}`,
      `--maxzoom=${REGION.maxzoom}`,
    ],
    { stdio: 'inherit' },
  )

  // Never announce success on a file we haven't read back. `extract` streams
  // hundreds of range requests across a ~1.6GB pull; it can end without a non-zero
  // exit and still leave gaps, and by the time anyone notices, the failure looks
  // like a map bug rather than a download one.
  console.log('\nChecking the archive reads back…')
  const problems = inspect(REGION.output)
  if (problems.length) {
    console.error(`\nThe extract finished but produced an unusable archive:\n`)
    for (const problem of problems) console.error(`  ✗ ${problem}`)
    console.error(`\nThis is normally a truncated or interrupted download. Delete and retry:`)
    console.error(`  rm ${REGION.output} && npm run tiles:fetch`)
    process.exitCode = 1
    return
  }

  const { size } = statSync(REGION.output)
  console.log(`  ✓ ${(size / 1e9).toFixed(2)}GB, fully written, tiles read back as gzip`)
  console.log(`\nDone: ${REGION.output}`)
}

main()
