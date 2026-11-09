'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/components/ui'

export function SignOutButton() {
  const router = useRouter()

  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.replace('/login')
        router.refresh()
      }}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-1.5',
        // Without this it breaks to "Sign / out" on a phone — a two-line target in
        // the least reachable corner of the screen, given to the one destructive act.
        'whitespace-nowrap',
        'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        'pointer-coarse:min-h-11',
      )}
    >
      Sign out
    </button>
  )
}
