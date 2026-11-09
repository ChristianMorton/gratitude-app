import Link from 'next/link'

/**
 * Privacy and terms. No auth check either way: these must be readable *before*
 * anyone decides to hand over an email address, and still readable afterwards.
 *
 * A 65–75ch measure, per DESIGN.md. This is the only long-form prose in the
 * product, and it's the one place the body font gets to do what it's for.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Link
        href="/"
        className="font-display text-lg font-semibold tracking-tight hover:text-primary"
      >
        Gratitude
      </Link>
      <article className="mt-8 space-y-6 text-pretty">{children}</article>
    </main>
  )
}
