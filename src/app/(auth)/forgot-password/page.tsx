'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button, ErrorNote, Field, Input } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email') }),
    })

    if (!response.ok) {
      setError((await response.json()).error ?? 'Could not send the link')
      setBusy(false)
      return
    }

    setSent(true)
    setBusy(false)
  }

  // Says the same thing whether or not the account exists. The sign-in copy is
  // careful never to confirm that a username is real, and this form would hand
  // that back in one request if it were more helpful.
  if (sent) {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <h1 className="font-display text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If there&rsquo;s an account with that address, a link to choose a new password is on its
          way. It works once, and expires in an hour.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="font-display text-xl font-semibold">Forgotten your password?</h1>
      <p className="text-sm text-muted-foreground">
        Tell us the address you signed up with and we&rsquo;ll send you a link to choose a new one.
      </p>
      <ErrorNote>{error}</ErrorNote>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Sending…' : 'Send me a link'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  )
}
