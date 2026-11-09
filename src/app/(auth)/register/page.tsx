'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, ErrorNote, Field, Input } from '@/components/ui'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        displayName: form.get('displayName'),
        email: form.get('email'),
        password: form.get('password'),
      }),
    })

    if (!response.ok) {
      const body = await response.json()
      setError(body.issues?.[0] ?? body.error ?? 'Could not create your account')
      setBusy(false)
      return
    }

    router.replace('/feed')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="font-display text-xl font-semibold">Create your account</h1>
      <ErrorNote>{error}</ErrorNote>
      <Field label="Name">
        <Input name="displayName" autoComplete="name" required autoFocus />
      </Field>
      <Field label="Username" hint="Letters, numbers and underscores.">
        <Input name="username" autoComplete="username" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  )
}
