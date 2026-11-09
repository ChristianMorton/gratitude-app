'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, ErrorNote, Input, cn } from '@/components/ui'

interface Person {
  id: string
  username: string
  displayName: string
}
interface Friend extends Person {
  tier: 'close' | 'general'
}
interface Request {
  id: string
  createdAt: string
  fromUser?: Person
  toUser?: Person
}

export function FriendsManager({
  friends,
  incoming,
  outgoing,
}: {
  friends: Friend[]
  incoming: Request[]
  outgoing: Request[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Person[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = () => startTransition(() => router.refresh())

  async function search(value: string) {
    setQuery(value)
    setError('')
    setNotice('')
    if (value.trim().length < 2) return setResults([])
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(value.trim())}`)
    if (response.ok) setResults((await response.json()).users)
  }

  async function call(url: string, init: RequestInit, onOk?: (body: unknown) => void) {
    const response = await fetch(url, init)
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(body.error ?? 'Something went wrong')
      return
    }
    setError('')
    onOk?.(body)
    refresh()
  }

  const addFriend = (username: string) =>
    call(
      '/api/friend-requests',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      },
      (body) => {
        const result = body as { status: string }
        setNotice(
          result.status === 'accepted'
            ? `You and ${username} had both asked — you're now friends.`
            : `Request sent to ${username}.`,
        )
        setQuery('')
        setResults([])
      },
    )

  const respond = (id: string, action: 'accept' | 'decline') =>
    call(`/api/friend-requests/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

  const cancel = (id: string) => call(`/api/friend-requests/${id}`, { method: 'DELETE' })

  const setTier = (userId: string, tier: 'close' | 'general') =>
    call(`/api/friends/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    })

  const remove = (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from your friends?`)) return
    return call(`/api/friends/${userId}`, { method: 'DELETE' })
  }

  return (
    <div className="space-y-8">
      {/* ─── Add ─────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Add a friend</h2>
        <Input
          value={query}
          onChange={(event) => search(event.target.value)}
          placeholder="Search by username"
          aria-label="Search by username"
        />
        <ErrorNote>{error}</ErrorNote>
        {notice && <p className="text-sm text-accent">{notice}</p>}
        {results.length > 0 && (
          <ul className="divide-y rounded-xl border bg-card">
            {results.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-3 p-3">
                <span className="text-sm">
                  {person.displayName}{' '}
                  <span className="text-muted-foreground">@{person.username}</span>
                </span>
                <Button variant="ghost" onClick={() => addFriend(person.username)}>
                  Add
                </Button>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No one found.</p>
        )}
      </section>

      {/* ─── Incoming ────────────────────────────────────────────────────── */}
      {incoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Requests for you</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {incoming.map((request) => (
              <li key={request.id} className="flex items-center justify-between gap-3 p-3">
                <span className="text-sm">
                  {request.fromUser?.displayName}{' '}
                  <span className="text-muted-foreground">@{request.fromUser?.username}</span>
                </span>
                <span className="flex gap-2">
                  <Button onClick={() => respond(request.id, 'accept')}>Accept</Button>
                  <Button variant="ghost" onClick={() => respond(request.id, 'decline')}>
                    Decline
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Outgoing ────────────────────────────────────────────────────── */}
      {outgoing.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Sent</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {outgoing.map((request) => (
              <li key={request.id} className="flex items-center justify-between gap-3 p-3">
                <span className="text-sm text-muted-foreground">
                  Waiting on {request.toUser?.displayName}
                </span>
                <Button variant="ghost" onClick={() => cancel(request.id)}>
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Friends ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Your friends</h2>
        <p className="text-sm text-muted-foreground">
          Marking someone <strong>close</strong>{' '}
          lets them see posts you share with close friends. It&rsquo;s your own label — they
          aren&rsquo;t told, and it doesn&rsquo;t change what you see of theirs.
        </p>
        {friends.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No friends yet.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {friends.map((friend) => (
              <li key={friend.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <span className="text-sm">
                  {friend.displayName}{' '}
                  <span className="text-muted-foreground">@{friend.username}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex gap-1" role="group" aria-label={`Tier for ${friend.username}`}>
                    {(['close', 'general'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        aria-pressed={friend.tier === tier}
                        onClick={() => setTier(friend.id, tier)}
                        className={cn(
                          // Same shape and states as the composer's audience chips:
                          // the same kind of choice should look like the same control.
                          'inline-flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-1',
                          'text-xs font-medium whitespace-nowrap transition-colors',
                          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                          'pointer-coarse:min-h-11 pointer-coarse:px-3',
                          friend.tier === tier
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {tier === 'close' ? 'Close' : 'General'}
                      </button>
                    ))}
                  </span>
                  <Button variant="danger" onClick={() => remove(friend.id, friend.displayName)}>
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
