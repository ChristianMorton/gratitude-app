import { Composer } from '@/components/composer'
import { FeedList } from '@/components/feed-list'
import { requireViewer } from '@/server/auth/session'
import { getFeed } from '@/server/posts/service'

export default async function FeedPage() {
  const viewer = await requireViewer()
  const { posts, nextCursor } = await getFeed(viewer.id)

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Your feed</h1>
      <div className="rise">
        <Composer />
      </div>
      <FeedList initialPosts={posts} initialCursor={nextCursor} viewerId={viewer.id} />
    </div>
  )
}
