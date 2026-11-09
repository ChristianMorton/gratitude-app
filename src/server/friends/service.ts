import { z } from 'zod'
import { ApiError, notFound } from '@/server/http'
import { supabaseServer } from '@/server/supabase/server'

export type FriendTier = 'close' | 'general'

export const tierSchema = z.enum(['close', 'general'])
export const requestSchema = z.object({ username: z.string().trim().min(1) })

interface Person {
  id: string
  username: string
  displayName: string
}

const asPerson = (row: { id: string; username: string; display_name: string }): Person => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name,
})

// ─── Reads ────────────────────────────────────────────────────────────────────
// RLS scopes these: `you may read only your own friend rows` means no viewerId
// filter is needed for correctness. They're passed anyway where it reads
// clearly — a query that says what it means is easier to trust than one relying
// on a policy elsewhere being right.

/** My friends, with the tier *I* assigned to each of them. */
export async function listFriends(_viewerId: string) {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('friends')
    .select('tier, friend:profiles!friends_friend_id_fkey (id, username, display_name)')
  if (error) throw new ApiError(500, error.message)

  return (data ?? [])
    .filter((row) => row.friend)
    .map((row) => ({ ...asPerson(row.friend!), tier: row.tier }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export async function listRequests(viewerId: string) {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('friend_requests')
    // One literal, not a concatenation: supabase-js parses this string at the
    // type level, and a built-up string is just `string` to it. Both embeds name
    // their foreign key explicitly, because both point at `profiles` and
    // PostgREST cannot guess which one you mean.
    .select(
      'id, created_at, from_user_id, to_user_id, fromUser:profiles!friend_requests_from_user_id_fkey(id, username, display_name), toUser:profiles!friend_requests_to_user_id_fkey(id, username, display_name)',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw new ApiError(500, error.message)

  const rows = data ?? []
  return {
    incoming: rows
      .filter((row) => row.to_user_id === viewerId && row.fromUser)
      .map((row) => ({ id: row.id, createdAt: row.created_at, fromUser: asPerson(row.fromUser!) })),
    outgoing: rows
      .filter((row) => row.from_user_id === viewerId && row.toUser)
      .map((row) => ({ id: row.id, createdAt: row.created_at, toUser: asPerson(row.toUser!) })),
  }
}

/** Username search, excluding me and anyone I'm already friends with. */
export async function searchUsers(viewerId: string, query: string) {
  const q = query.trim()
  if (q.length < 2) return []

  const supabase = await supabaseServer()

  // Profiles are readable by any signed-in user — that's how you find someone to
  // add. Who I'm *already* friends with is my own business, so that exclusion is
  // done here rather than in SQL: my friend rows are the only ones I can read.
  const { data: mine } = await supabase.from('friends').select('friend_id')
  const already = new Set((mine ?? []).map((row) => row.friend_id))

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .ilike('username', `${q}%`)
    .neq('id', viewerId)
    .order('username')
    .limit(20)
  if (error) throw new ApiError(500, error.message)

  return (data ?? [])
    .filter((row) => !already.has(row.id))
    .slice(0, 10)
    .map(asPerson)
}

// ─── Mutations ────────────────────────────────────────────────────────────────
// Every write to `friends` goes through an RPC, because a friendship is a
// mirrored pair and RLS can only ever authorise the row you own. The functions
// live in the migration; see 20260716032140_friend_rpcs.sql. Nothing else in the
// codebase touches the friends table.

export async function sendRequest(viewerId: string, username: string) {
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('send_friend_request', { target_username: username })

  if (error) {
    if (error.code === 'P0002') throw notFound()
    if (error.code === '22023') throw new ApiError(400, 'You cannot add yourself')
    throw new ApiError(400, error.message)
  }

  // The RPC returns a verdict, not the person — look them up for the message.
  const { data: target } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .ilike('username', username.trim())
    .maybeSingle()
  if (!target) throw notFound()

  const person = asPerson(target)
  if (data === 'already') {
    throw new ApiError(409, `You are already friends with ${person.displayName}`)
  }
  return { status: data as 'pending' | 'accepted', user: person }
}

export async function acceptRequest(_viewerId: string, requestId: string) {
  const supabase = await supabaseServer()
  const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId })
  if (error) {
    // The function refuses anyone but the recipient; both cases are "not yours
    // to answer", and neither should confirm the request exists.
    if (error.code === 'P0002' || error.code === '42501') throw notFound()
    throw new ApiError(400, error.message)
  }
}

export async function declineRequest(viewerId: string, requestId: string) {
  const supabase = await supabaseServer()
  // Kept as a soft "don't ask again" marker rather than deleted. Only the
  // recipient may decline; RLS allows the update, this makes it explicit.
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'declined' })
    .eq('id', requestId)
    .eq('to_user_id', viewerId)
    .eq('status', 'pending')
    .select('id')
  if (error) throw new ApiError(400, error.message)
  if (!data?.length) throw notFound()
}

export async function cancelRequest(viewerId: string, requestId: string) {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)
    .eq('from_user_id', viewerId)
    .eq('status', 'pending')
    .select('id')
  if (error) throw new ApiError(400, error.message)
  if (!data?.length) throw notFound()
}

/** My label for them. Deliberately one-sided — they are never told. */
export async function setTier(viewerId: string, friendId: string, tier: FriendTier) {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('friends')
    .update({ tier })
    .eq('owner_id', viewerId)
    .eq('friend_id', friendId)
    .select('friend_id')
  if (error) throw new ApiError(400, error.message)
  if (!data?.length) throw notFound()
}

/** Removing a friend removes BOTH rows — a one-sided friendship is corrupt state. */
export async function removeFriend(_viewerId: string, friendId: string) {
  const supabase = await supabaseServer()
  const { error } = await supabase.rpc('remove_friend', { other_id: friendId })
  if (error) throw new ApiError(400, error.message)
}
