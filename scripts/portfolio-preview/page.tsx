import { Composer } from '@/components/composer'
import { FeedList } from '@/components/feed-list'
import type { FeedPost } from '@/server/posts/select'
import { notFound } from 'next/navigation'

/** Temporary component harness; copy to src/app/portfolio-preview/page.tsx.
 * No authentication or database is mocked. No network writes are demonstrated.
 */
export default function PortfolioPreview() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const posts: FeedPost[] = [
    { id: 'fixture-1', content: 'A quiet walk before the city woke up. The air smelled like rain and the bakery was already open.', visibility: 'private', createdAt: '2026-11-09T00:00:00Z', photoUrl: null, photoWidth: null, photoHeight: null, author: { id: 'fixture-viewer', username: 'alex_demo', displayName: 'Alex' } },
    { id: 'fixture-2', content: 'Sam made time for a long phone call today. Sometimes being listened to is the whole thing.', visibility: 'close', createdAt: '2026-11-08T22:00:00Z', photoUrl: null, photoWidth: null, photoHeight: null, author: { id: 'fixture-viewer', username: 'alex_demo', displayName: 'Alex' } },
    { id: 'fixture-3', content: 'The tomatoes finally came in. Four of them. Enough for lunch with a friend.', visibility: 'friends', createdAt: '2026-11-08T20:00:00Z', photoUrl: null, photoWidth: null, photoHeight: null, author: { id: 'fixture-friend', username: 'jamie_demo', displayName: 'Jamie' } },
  ]
  return (
    <>
      <header className="border-b px-6 py-5"><div className="mx-auto max-w-2xl"><p className="font-display text-2xl font-semibold">Gratitude</p><p className="mt-1 text-xs text-muted-foreground">Component preview · fictional fixture data · no database connection</p></div></header>
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-8">
        <Composer />
        <FeedList initialPosts={posts} initialCursor={null} viewerId="fixture-viewer" />
      </main>
    </>
  )
}

