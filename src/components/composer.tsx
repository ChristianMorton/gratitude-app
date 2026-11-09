'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LocationPicker, type PickedLocation } from '@/components/location-picker'
import { Button, ErrorNote, cn } from '@/components/ui'

const LIMIT = 500

/**
 * Read GPS out of a chosen photo, if it has any. Loaded lazily so exifr isn't in
 * the main bundle. Never throws: a photo with no GPS — the common case, since
 * most phones and browsers strip it — is normal, not an error.
 */
async function readPhotoLocation(file: File) {
  try {
    const exifr = (await import('exifr')).default
    const data = await exifr.gps(file)
    if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      return null
    }
    return { latitude: data.latitude, longitude: data.longitude }
  } catch {
    return null
  }
}

const VISIBILITIES = [
  { value: 'close', label: 'Close friends' },
  { value: 'friends', label: 'All friends' },
  { value: 'private', label: 'Only me' },
] as const

export function Composer() {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  // Private until you decide otherwise. Widening the audience is the deliberate
  // act, never the thing that happens while you weren't looking.
  const [visibility, setVisibility] = useState<'close' | 'friends' | 'private'>('private')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [photoLocation, setPhotoLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [location, setLocation] = useState<PickedLocation | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const remaining = LIMIT - content.length
  const canSubmit = content.trim().length > 0 && remaining >= 0 && !busy

  async function choosePhoto(file: File | null) {
    setPhoto(file)
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return file ? URL.createObjectURL(file) : null
    })

    // Only ever an *offer* — picking a photo never attaches its location.
    setPhotoLocation(file ? await readPhotoLocation(file) : null)
    if (!file && location?.source === 'photo') setLocation(null)
  }

  function reset() {
    setContent('')
    void choosePhoto(null)
    setLocation(null)
    // Visibility resets with everything else. Letting it persist would mean one
    // choice to share quietly widened every post after it — a decision the author
    // made once, applied to letters they hadn't written yet.
    setVisibility('private')
    if (fileInput.current) fileInput.current.value = ''
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError('')

    const body = new FormData()
    body.set('content', content.trim())
    body.set('visibility', visibility)
    if (photo) body.set('photo', photo)
    if (location) {
      body.set('latitude', String(location.latitude))
      body.set('longitude', String(location.longitude))
      body.set('locationSource', location.source)
    }

    const response = await fetch('/api/posts', { method: 'POST', body })

    if (!response.ok) {
      const payload = await response.json()
      setError(payload.issues?.[0] ?? payload.error ?? 'Could not post')
      setBusy(false)
      return
    }

    reset()
    setBusy(false)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-5">
      <label htmlFor="content" className="sr-only">
        What are you grateful for?
      </label>
      {/*
       * The box grows with the letter: an invisible replica of the text sizes the
       * grid cell, and the textarea stretches to fill it. `field-sizing: content`
       * would do this in one line, but it only reaches Safari in 26.2 (~81% of
       * browsers) and this gets written on phones. `rows` stays as the floor — the
       * grid row is max(three lines, the replica).
       */}
      {/*
       * grid-cols-1 rather than a bare `grid`: an auto column sizes to max-content,
       * so a single long unbroken word would stretch the column past the card
       * instead of wrapping. minmax(0, 1fr) pins it to the card's width.
       */}
      <div className="grid grid-cols-1">
        <div
          aria-hidden
          className="invisible col-start-1 row-start-1 w-full text-base break-words whitespace-pre-wrap"
        >
          {content + ' '}
        </div>
        <textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What are you grateful for today?"
          rows={3}
          className="col-start-1 row-start-1 w-full resize-none overflow-hidden bg-transparent text-base placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {preview && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
          <img src={preview} alt="" className="max-h-56 rounded-lg border" />
          <button
            type="button"
            onClick={() => {
              void choosePhoto(null)
              if (fileInput.current) fileInput.current.value = ''
            }}
            className={cn(
              'absolute top-2 right-2 cursor-pointer rounded-md bg-background/90 px-2 py-1 text-xs font-medium',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            )}
          >
            Remove
          </button>
        </div>
      )}

      <ErrorNote>{error}</ErrorNote>

      <div className="space-y-3 border-t pt-3">
        {/*
         * Choosing an audience is the most consequential thing that happens in this
         * product, so it gets its own line and its own visible label rather than
         * sitting in a row of equals beside "Add photo". The label is the group's
         * accessible name too — one sentence, read by everyone.
         */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span id="audience" className="text-xs font-medium text-muted-foreground">
            Who can see this
          </span>
          <div className="flex gap-1" role="group" aria-labelledby="audience">
            {VISIBILITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={visibility === option.value}
                onClick={() => setVisibility(option.value)}
                className={cn(
                  'inline-flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-1',
                  'text-xs font-medium whitespace-nowrap transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  'pointer-coarse:min-h-11 pointer-coarse:px-3',
                  visibility === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="peer sr-only"
              id="photo"
              onChange={(event) => void choosePhoto(event.target.files?.[0] ?? null)}
            />
            {/*
             * The input is visually hidden, so focus lands on a 1×1 clipped element
             * and the ring has to be drawn by the label instead — otherwise a
             * keyboard user tabs into a control that shows nothing at all.
             *
             * `peer-*` and not `has-[…]`: the input is the label's *sibling*, and
             * :has() only matches descendants, so has-[:focus-visible] silently
             * never fires. It looks right and renders nothing.
             */}
            <label
              htmlFor="photo"
              className={cn(
                'inline-flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-1',
                'text-xs font-medium whitespace-nowrap',
                'text-muted-foreground transition-colors hover:bg-muted',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                'pointer-coarse:min-h-11 pointer-coarse:px-3',
              )}
            >
              {photo ? 'Change photo' : 'Add photo'}
            </label>

            <LocationPicker value={location} onChange={setLocation} photoLocation={photoLocation} />
          </div>

          {/*
           * `ml-auto` and not `justify-between` alone: when the attachments and this
           * group don't fit on one line, this wraps onto its own — and a lone item on
           * a justify-between line sits at the *start*, which put Post on the left of
           * a phone and the right of a desktop. Post belongs in the same corner
           * everywhere.
           */}
          <div className="ml-auto flex items-center gap-3">
            <span
              className={cn(
                'text-xs tabular-nums',
                remaining < 0 ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {remaining}
            </span>
            <Button type="submit" disabled={!canSubmit}>
              {busy ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
