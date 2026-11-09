'use client'

import { useState } from 'react'
import { cn } from '@/components/ui'

export interface PickedLocation {
  latitude: number
  longitude: number
  source: 'photo' | 'device'
}

/**
 * Location is strictly opt-in and never silent.
 *
 * Reading a photo's EXIF automatically would be the seamless option, and it is
 * exactly the wrong one: it geotags a post from metadata the user has probably
 * forgotten is in the image. So EXIF is offered as an explicit, labelled choice
 * alongside "where I am now", and only when the chosen photo actually has
 * coordinates — which, since most phones and browsers strip GPS on upload, it
 * usually won't. That path has to degrade quietly, never error.
 */
export function LocationPicker({
  value,
  onChange,
  photoLocation,
}: {
  value: PickedLocation | null
  onChange: (location: PickedLocation | null) => void
  photoLocation: { latitude: number; longitude: number } | null
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function useDevice() {
    setBusy(true)
    setError('')
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10_000 }),
      )
      onChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: 'device',
      })
      setOpen(false)
    } catch {
      setError('Could not get your location. Check the permission and try again.')
    }
    setBusy(false)
  }

  function usePhoto() {
    if (!photoLocation) return
    onChange({ ...photoLocation, source: 'photo' })
    setOpen(false)
  }

  if (value) {
    return (
      <span className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
        📍 {value.source === 'photo' ? "Photo's location" : 'Current location'}
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove location"
          className={cn(
            'cursor-pointer rounded-sm opacity-70 hover:opacity-100',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 focus-visible:outline-none',
          )}
        >
          ✕
        </button>
      </span>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-1',
          'text-xs font-medium whitespace-nowrap',
          'text-muted-foreground transition-colors hover:bg-muted',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          'pointer-coarse:min-h-11 pointer-coarse:px-3',
        )}
      >
        📍 Add location
      </button>
    )
  }

  return (
    <span className="flex flex-wrap items-center gap-1">
      {photoLocation && (
        <button
          type="button"
          onClick={usePhoto}
          className={cn(
            'inline-flex cursor-pointer items-center justify-center rounded-lg bg-muted px-2.5 py-1',
            'text-xs font-medium whitespace-nowrap hover:opacity-80',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            'pointer-coarse:min-h-11 pointer-coarse:px-3',
          )}
        >
          Where the photo was taken
        </button>
      )}
      <button
        type="button"
        onClick={useDevice}
        disabled={busy}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center rounded-lg bg-muted px-2.5 py-1',
          'text-xs font-medium whitespace-nowrap hover:opacity-80',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          'pointer-coarse:min-h-11 pointer-coarse:px-3',
          'disabled:opacity-50',
        )}
      >
        {busy ? 'Locating…' : 'Where I am now'}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false)
          setError('')
        }}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center rounded-lg px-2 py-1',
          'text-xs whitespace-nowrap text-muted-foreground hover:text-foreground',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          'pointer-coarse:min-h-11 pointer-coarse:px-3',
        )}
      >
        Cancel
      </button>
      {error && <span className="w-full text-xs text-destructive">{error}</span>}
    </span>
  )
}
