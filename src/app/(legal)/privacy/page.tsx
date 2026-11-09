import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy — Gratitude',
  description: 'What Gratitude stores, who can see it, and where it lives.',
}

const UPDATED = '16 July 2026'
const SUPPORT = 'christian@brainlessbrilliance.com'

/**
 * DRAFT — not written by a lawyer, and not reviewed by one.
 *
 * It is accurate about the software: every claim here was checked against the
 * code rather than copied from a template. What it cannot know is the legal
 * shape around it — who the controller is, which jurisdiction applies, how long
 * data is kept. Those are marked in the page and need a human answer before this
 * is shown to the public.
 *
 * The rule for editing this: if a sentence here stops being true of the code,
 * it is a bug in the same way a failing test is. Do not let it drift.
 */
export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Privacy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <p>
        Gratitude is a place to write down what you&rsquo;re grateful for and share it with a few
        people you choose — or with nobody. This page explains what it stores, who can see it, and
        where it lives. It describes what the software actually does, not what would be convenient
        to claim.
      </p>

      <h2 className="font-display text-lg font-semibold">What&rsquo;s stored</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Your account</strong> — an email address, a username and a display name. Your
          password is never stored; only a hash of it, which cannot be turned back into the
          password.
        </li>
        <li>
          <strong>What you write</strong> — the text of each gratitude, when you wrote it, and who
          you chose to share it with.
        </li>
        <li>
          <strong>Photos you attach</strong>, if you attach any.
        </li>
        <li>
          <strong>Locations you attach</strong>, if you attach any. Never automatically — only when
          you ask for it, every time.
        </li>
        <li>
          <strong>Who your friends are</strong>, and the label you give each one (close or general).
          That label is yours: the other person is never told which one you picked.
        </li>
      </ul>
      <p>
        There is no analytics, no tracking, no advertising, and no third-party scripts of any kind.
        Nothing about how you use the app is measured or sent anywhere.
      </p>

      <h2 className="font-display text-lg font-semibold">Locations are yours alone</h2>
      <p>
        A location attached to a gratitude is <strong>never shown to anyone but you</strong> —
        including on posts you share with friends. Sharing a gratitude does not share where you
        were. The map is yours and only yours.
      </p>
      <p>
        Coordinates are deliberately rounded to about 110 metres before they&rsquo;re stored, so the
        pin lands on the right street but the database never holds your doorstep. Photos are
        re-encoded when you upload them, which strips the GPS tags cameras write into image files —
        so a photo you share cannot give away where it was taken, even though the file came from
        your phone.
      </p>

      <h2 className="font-display text-lg font-semibold">Who can see what you write</h2>
      <p>
        Only the people you choose, each time you post: <strong>close friends</strong>,{' '}
        <strong>all friends</strong>, or <strong>only me</strong>. This is enforced by the database
        itself rather than by the app remembering to check, and photos are served through the same
        rule as the gratitude they belong to — a photo is exactly as visible as its post.
      </p>
      <p>
        We do not read your gratitudes, and they are not used to train anything. Nobody at Brainless
        Brilliance can see a private post through the app. Be aware that someone with direct
        administrative access to the database could technically read stored data — that is true of
        essentially every service, and it is stated here rather than glossed over.
      </p>

      <h2 className="font-display text-lg font-semibold">Where it lives</h2>
      <p>
        The app runs on our own server. Your account, your gratitudes, your photos and your
        coordinates are stored using{' '}
        <a
          href="https://supabase.com/privacy"
          className="text-primary underline underline-offset-4"
        >
          Supabase
        </a>
        , which provides the database, sign-in and file storage. That means your data sits on
        Supabase&rsquo;s infrastructure, not on hardware we own. They are a processor acting on our
        instructions; they do not use your data for their own purposes.
      </p>
      <p>
        That infrastructure is hosted <strong>in the European Union</strong>. Your account, your
        gratitudes, your photos and your coordinates are stored on servers in the EU. We do not move
        your data outside it; Supabase&rsquo;s own handling of it is governed by their{' '}
        <a href="https://supabase.com/privacy" className="text-primary underline underline-offset-4">
          privacy policy
        </a>
        .
      </p>
      <p>
        The map is the exception, and deliberately so. Map tiles are served from our own server
        rather than a map provider, because every tile request would otherwise tell that provider
        your IP address and exactly which part of the world you were looking at — and a private map
        opens on your own pins. No third party learns where you look.
      </p>
      <h2 className="font-display text-lg font-semibold">Who&rsquo;s responsible</h2>
      <p>
        Gratitude is run by Brainless Brilliance, which decides what data is collected and why — the
        data controller, in the language of the law. There&rsquo;s no contact form and no support
        desk; you reach a real person directly at{' '}
        <a href={`mailto:${SUPPORT}`} className="text-primary underline underline-offset-4">
          {SUPPORT}
        </a>
        .
      </p>

      <h2 className="font-display text-lg font-semibold">Cookies</h2>
      <p>
        Gratitude uses <strong>two cookies, both only once you sign in</strong>. They keep you signed
        in and nothing else. If you never sign in, no cookies are set at all.
      </p>
      <p>
        There are no analytics, advertising or tracking cookies, so there is no consent banner —
        cookies that are strictly necessary to provide a service you asked for don&rsquo;t require
        one, and we don&rsquo;t set any others. Signing out removes them; so does clearing your
        browser&rsquo;s cookies, which will simply sign you out.
      </p>

      <h2 className="font-display text-lg font-semibold">Your data is yours</h2>
      <p>
        You can ask for a copy of everything stored about you, ask for it to be corrected, or ask for
        your account and everything in it to be deleted. Deleting your account removes your
        gratitudes, your photos, your locations and your friendships. They disappear from the app
        immediately, and are erased from backups <strong>within 30 days</strong>. Email{' '}
        <a href={`mailto:${SUPPORT}`} className="text-primary underline underline-offset-4">
          {SUPPORT}
        </a>{' '}
        and a real person will do it.
      </p>

      <h2 className="font-display text-lg font-semibold">Changes</h2>
      <p>
        If this page changes in a way that affects what happens to your data, you&rsquo;ll be told
        rather than left to notice. The date at the top always reflects the current version.
      </p>

      <h2 className="font-display text-lg font-semibold">Asking</h2>
      <p>
        Any question about any of this goes to{' '}
        <a href={`mailto:${SUPPORT}`} className="text-primary underline underline-offset-4">
          {SUPPORT}
        </a>
        .
      </p>
    </>
  )
}
