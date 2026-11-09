'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, ErrorNote, Field, Input } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: form.get('identifier'),
        password: form.get('password'),
      }),
    })

    if (!response.ok) {
      setError((await response.json()).error ?? 'Could not sign in')
      setBusy(false)
      return
    }

    router.replace('/feed')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="font-display text-xl font-semibold">Welcome back</h1>
      <ErrorNote>{error}</ErrorNote>
      <Field label="Username or email">
        <Input name="identifier" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Forgotten your password?
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="text-primary underline underline-offset-4">
          Create one
        </Link>
      </p>
    </form>
  )
}
