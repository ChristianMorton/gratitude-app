import { AuthShell } from '@/components/auth-shell'

/**
 * The same frame as (auth), without the "already signed in? go away" redirect.
 *
 * That distinction is the whole reason this group exists. /auth/confirm verifies
 * the token from the reset mail, which leaves a session — and that session is
 * precisely what authorises changing the password. Under (auth)'s rule, the page
 * would redirect to /feed for everyone who followed a valid link, which is to
 * say everyone who needs it.
 */
export default function RecoverLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>
}
