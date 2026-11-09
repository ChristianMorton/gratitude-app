import { FriendsManager } from '@/components/friends-manager'
import { requireViewer } from '@/server/auth/session'
import { listFriends, listRequests } from '@/server/friends/service'

export default async function FriendsPage() {
  const viewer = await requireViewer()
  const [friends, requests] = await Promise.all([listFriends(viewer.id), listRequests(viewer.id)])

  return (
    <div className="rise space-y-6">
      <h1 className="font-display text-2xl font-semibold">Friends</h1>
      {/*
        createdAt already arrives as an ISO string: PostgREST returns timestamps
        as JSON strings, where Prisma hydrated them into Date objects. No
        conversion needed — the wire format is already what the client wants.
      */}
      <FriendsManager friends={friends} incoming={requests.incoming} outgoing={requests.outgoing} />
    </div>
  )
}
