import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getViewer } from '@/server/auth/session'

export default async function LandingPage() {
  if (await getViewer()) redirect('/feed')

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="rise space-y-4">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-balance">
          What are you grateful for?
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">
          A quiet place to note the good things — kept to yourself, or shared with close friends.
          Every gratitude can remember where you were, on a map only you can see.
        </p>
      </div>
      <div className="rise flex gap-3" style={{ '--i': 1 } as React.CSSProperties}>
        <Link
          href="/register"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
