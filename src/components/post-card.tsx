import type { FeedPost } from '@/server/posts/select'

const VISIBILITY_LABEL: Record<FeedPost['visibility'], string> = {
  close: 'Close friends',
  friends: 'All friends',
  private: 'Only me',
}

function timeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function PostCard({ post, isOwn }: { post: FeedPost; isOwn: boolean }) {
  return (
    <article className="space-y-3 rounded-xl border bg-card p-5">
      <header className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{isOwn ? 'You' : post.author.displayName}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {isOwn && (
            <span className="rounded-md bg-muted px-2 py-0.5">
              {VISIBILITY_LABEL[post.visibility]}
            </span>
          )}
          <time dateTime={new Date(post.createdAt).toISOString()}>
            {timeAgo(new Date(post.createdAt))}
          </time>
        </span>
      </header>

      <p className="text-pretty whitespace-pre-wrap">{post.content}</p>

      {post.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- served from our own route, not optimised
        <img
          src={post.photoUrl}
          alt=""
          width={post.photoWidth ?? undefined}
          height={post.photoHeight ?? undefined}
          className="w-full rounded-lg border"
          loading="lazy"
        />
      )}
    </article>
  )
}
