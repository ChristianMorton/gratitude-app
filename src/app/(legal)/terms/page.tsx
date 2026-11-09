import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms — Gratitude',
  description: 'The arrangement: what you can expect, and what is expected of you.',
}

const UPDATED = '16 July 2026'
const SUPPORT = 'christian@brainlessbrilliance.com'

/**
 * DRAFT — not written by a lawyer, and not reviewed by one.
 *
 * Written to describe the actual arrangement rather than to import a template
 * full of clauses this app cannot honour. Anything requiring a legal answer —
 * the entity, the jurisdiction, whether this is a business at all — is marked in
 * the page rather than guessed at.
 */
export default function TermsPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Terms</h1>
      <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <p>
        Gratitude is a small app for writing down what you&rsquo;re grateful for and sharing it with
        people you choose. These terms are the arrangement between you and Brainless Brilliance for
        using it. They&rsquo;re written to be read, not to be impressive.
      </p>

      <h2 className="font-display text-lg font-semibold">Your account</h2>
      <p>
        You need an account, and you must be <strong>at least 13 years old</strong> — older where
        your country sets a higher age for agreeing to something like this yourself. Use a real email
        address you can actually receive mail at: it&rsquo;s the only way to get back in if you
        forget your password. Keep your password to yourself, and tell us if you think someone else
        has it.
      </p>

      <h2 className="font-display text-lg font-semibold">What you write stays yours</h2>
      <p>
        Everything you write, photograph and pin belongs to you. Not to us. We claim no ownership of
        it and no licence to do anything with it beyond storing it and showing it to the people you
        chose — which is the entire job of the app.
      </p>
      <p>
        We won&rsquo;t sell it, publish it, mine it, or use it to train anything. If that ever
        changes, it will be a different app and you&rsquo;ll be asked first, not informed
        afterwards.
      </p>

      <h2 className="font-display text-lg font-semibold">Being decent</h2>
      <p>
        Don&rsquo;t use Gratitude to harass anyone, to post things that aren&rsquo;t yours to post,
        or to break the law. Don&rsquo;t attack the service or try to reach other people&rsquo;s
        posts. This is a place for gratitude; it&rsquo;s a short list because it doesn&rsquo;t need
        to be a long one.
      </p>
      <p>
        Accounts that are used to hurt people can be removed. That&rsquo;s a judgement call made by
        a person, and you can ask about it.
      </p>

      <h2 className="font-display text-lg font-semibold">Leaving</h2>
      <p>
        You can stop whenever you like, and ask for your account and everything in it to be deleted
        — see the{' '}
        <a href="/privacy" className="text-primary underline underline-offset-4">
          privacy page
        </a>
        . No exit interview, no retention offers.
      </p>

      <h2 className="font-display text-lg font-semibold">What we can and can&rsquo;t promise</h2>
      <p>
        Honestly: Gratitude is a small, personally-run app, not an enterprise service with an
        operations team. It&rsquo;s built carefully — the privacy rules are enforced by the database
        and covered by tests — but it comes with no warranty, no uptime guarantee, and no promise
        that it will exist forever.
      </p>
      <p>
        <strong>Keep your own copy of anything you would be upset to lose.</strong> Backups exist
        and mistakes also exist. To the extent the law allows, we&rsquo;re not liable for lost data
        or for what happens if the service is unavailable — and where the law doesn&rsquo;t allow
        that, it doesn&rsquo;t.
      </p>
      <p>
        If the app is ever shut down, you&rsquo;ll be given notice and a way to take your gratitudes
        with you. That&rsquo;s a promise worth more than an uptime figure.
      </p>

      <h2 className="font-display text-lg font-semibold">Changes</h2>
      <p>
        These terms may change as the app does. Material changes will be told to you rather than
        quietly published; the date at the top always reflects the current version.
      </p>

      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <strong>Needs completing before launch:</strong> which country&rsquo;s law governs these
        terms and where any dispute would be handled.
      </p>

      <h2 className="font-display text-lg font-semibold">Asking</h2>
      <p>
        Anything unclear, or anything that seems unfair, goes to{' '}
        <a href={`mailto:${SUPPORT}`} className="text-primary underline underline-offset-4">
          {SUPPORT}
        </a>
        . A person reads it.
      </p>
    </>
  )
}
