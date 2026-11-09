'use client'

import { useState } from 'react'
import { PostCard } from '@/components/post-card'
import { Button } from '@/components/ui'
import type { FeedPost } from '@/server/posts/select'

export function FeedList({
  initialPosts,
  initialCursor,
  viewerId,
}: {
  initialPosts: FeedPost[]
  initialCursor: string | null
  viewerId: string
}) {
  // Only the pages fetched *on top of* the server's first page live in state.
  // Mirroring `initialPosts` into state instead would pin the feed to whatever
  // was there at mount: `router.refresh()` re-renders the server component and
  // passes a fresh first page, but `useState` ignores it, so a post you just
  // wrote would save and never appear.
  const [extraPages, setExtraPages] = useState<FeedPost[]>([])
  const [cursor, setCursor] = useState(initialCursor)
  const [busy, setBusy] = useState(false)

  // When the server sends a new first page, anything paged on top of the old one
  // is stale — drop it rather than splice two different snapshots together.
  const [renderedFirstPage, setRenderedFirstPage] = useState(initialPosts)
  if (renderedFirstPage !== initialPosts) {
    setRenderedFirstPage(initialPosts)
    setExtraPages([])
    setCursor(initialCursor)
  }

  const posts = extraPages.length > 0 ? [...initialPosts, ...extraPages] : initialPosts

  async function loadMore() {
    if (!cursor || busy) return
    setBusy(true)
    const response = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`)
    if (response.ok) {
      const page = await response.json()
      setExtraPages((current) => [...current, ...page.posts])
      setCursor(page.nextCursor)
    }
    setBusy(false)
  }

  if (posts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nothing here yet. Write your first gratitude above.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div key={post.id} className="rise" style={{ '--i': index % 8 } as React.CSSProperties}>
          <PostCard post={post} isOwn={post.author.id === viewerId} />
        </div>
      ))}

      {cursor && (
        <Button variant="ghost" onClick={loadMore} disabled={busy} className="w-full">
          {busy ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
