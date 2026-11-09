import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cn } from '@/components/ui'
import { requireViewer } from '@/server/auth/session'
import { SignOutButton } from './sign-out-button'

const NAV = [
  { href: '/feed', label: 'Feed' },
  { href: '/map', label: 'Map' },
  { href: '/friends', label: 'Friends' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer().catch(() => null)
  if (!viewer) redirect('/login')

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-3">
          {/*
           * The wordmark stands down on a phone. Four thumb-sized targets and a
           * wordmark do not fit in 390px, and of the two the wordmark is what's
           * expendable: it only links to /feed, which the nav already does. The
           * alternative was a hamburger hiding three destinations, which is
           * ceremony, or targets too small to hit, which is worse.
           */}
          <Link href="/feed" className="hidden font-display text-lg font-semibold sm:inline-flex">
            Gratitude
          </Link>
          <nav className="flex w-full items-center justify-between gap-1 text-sm sm:w-auto sm:justify-end">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center justify-center rounded-lg px-3 py-1.5 whitespace-nowrap',
                  'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  'pointer-coarse:min-h-11',
                )}
              >
                {item.label}
              </Link>
            ))}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">{children}</main>
    </>
  )
}
