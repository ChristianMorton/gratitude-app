import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { getViewer } from '@/server/auth/session'

/**
 * Sign in, register, forgotten password. If you're already signed in, there is
 * nothing here for you.
 *
 * /reset-password deliberately does NOT live in this group: following a reset
 * link signs you in, so this redirect would bounce you to /feed before you could
 * change anything — the page would be unreachable by exactly the people it's
 * for. It lives in (recover), which shares the frame and not the rule.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getViewer()) redirect('/feed')

  return <AuthShell>{children}</AuthShell>
}
