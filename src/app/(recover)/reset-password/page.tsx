'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabaseBrowser } from '@/components/supabase-browser'
import { Button, ErrorNote, Field, Input } from '@/components/ui'

/**
 * Choose a new password.
 *
 * You only arrive here through /auth/confirm, which verified the token_hash from
 * the email and left a session behind. That session is the authorisation: there
 * is nothing to check here beyond "does the new password stick".
 *
 * The (auth) layout bounces signed-in people to /feed, and verifying the link
 * signs you in — so this page lives outside that layout's redirect by being the
 * one exception it allows. See src/app/(auth)/layout.tsx.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')

    // Same rule as registration. Supabase enforces its own minimum too, but the
    // app has always said 8, and two components disagreeing about what counts as
    // a valid password is how you get an error message nobody can act on.
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setBusy(false)
      return
    }

    const { error: updateError } = await supabaseBrowser().auth.updateUser({ password })

    if (updateError) {
      // Usually the link expired or was already used: the session it left behind
      // is gone, so there is nobody to update.
      setError(
        updateError.message.includes('session')
          ? 'That link has expired. Ask for a new one.'
          : updateError.message,
      )
      setBusy(false)
      return
    }

    router.replace('/feed')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="font-display text-xl font-semibold">Choose a new password</h1>
      <ErrorNote>{error}</ErrorNote>
      <Field label="New password" hint="At least 8 characters.">
        <Input name="password" type="password" autoComplete="new-password" required autoFocus />
      </Field>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Saving…' : 'Save and sign in'}
      </Button>
    </form>
  )
}
