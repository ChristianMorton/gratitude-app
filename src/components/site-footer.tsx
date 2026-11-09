import Link from 'next/link'

const SUPPORT_EMAIL = 'christian@brainlessbrilliance.com'

/**
 * The footer, kept deliberately quiet.
 *
 * It sits in the root layout so it's reachable everywhere — including the signed
 * out pages, which matters: someone has to be able to read the privacy policy
 * *before* deciding to hand over an email address, not only after.
 *
 * Caption-sized muted text and nothing else. This is the least important thing on
 * any screen it appears on, and the layout should say so.
 */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-2xl px-6 pt-8 pb-10">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t pt-6 text-xs text-muted-foreground">
        <Link
          href="/privacy"
          className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Terms
        </Link>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Support
        </a>
        <a
          href="https://brainlessbrilliance.com"
          className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Brainless Brilliance
        </a>
      </div>
    </footer>
  )
}
