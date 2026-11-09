import Link from 'next/link'

/**
 * The frame around the signed-out pages: wordmark, one line of what this is, and
 * a card.
 *
 * It lives here rather than in the (auth) layout because two route groups need
 * the same frame with different rules. (auth) turns a signed-in visitor away;
 * (recover) cannot, because following a reset link signs you in — the session is
 * what authorises the password change, so bouncing you to /feed for having one
 * would make the page unreachable by exactly the people it is for.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="rise space-y-2 text-center">
        <Link href="/" className="font-display text-3xl font-semibold tracking-tight">
          Gratitude
        </Link>
        <p className="text-sm text-muted-foreground">
          Write what you&rsquo;re grateful for. Share it with the people you choose.
        </p>
      </div>
      <div className="rise" style={{ '--i': 1 } as React.CSSProperties}>
        {children}
      </div>
    </main>
  )
}
