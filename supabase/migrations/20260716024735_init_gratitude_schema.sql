-- Gratitude — schema, ported from the Prisma models.
--
-- Two things carry over from the original design and must not be lost:
--
--  1. `friends` rows are DIRECTIONAL and always written as a mirrored pair.
--     `tier` is owner-scoped: how `owner` classifies `friend`. It is NOT
--     reciprocal, and the friend is never told which tier they're in.
--  2. `post_locations` is a separate table so no query returns coordinates
--     without deliberately joining to it. Coordinates are owner-only, always.

create type public.post_visibility as enum ('close', 'friends', 'private');
create type public.friend_tier as enum ('close', 'general');
create type public.friend_request_status as enum ('pending', 'declined');
create type public.geo_source as enum ('photo', 'device');

-- ─── profiles ────────────────────────────────────────────────────────────────
-- auth.users owns email + credentials. This owns everything the app shows.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  constraint display_name_length check (char_length(display_name) between 1 and 60)
);
-- Usernames are matched case-insensitively on search and sign-in.
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- ─── posts ───────────────────────────────────────────────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  visibility public.post_visibility not null default 'private',
  photo_path text,
  photo_width int,
  photo_height int,
  created_at timestamptz not null default now(),
  constraint content_length check (char_length(content) between 1 and 500)
);
create index posts_author_created_idx on public.posts (author_id, created_at desc, id desc);

-- ─── post_locations ──────────────────────────────────────────────────────────
-- One row per post, at most. Separate table on purpose: a query that does not
-- join here cannot leak coordinates, which fails safe instead of failing open.
create table public.post_locations (
  post_id uuid primary key references public.posts (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  source public.geo_source not null,
  label text,
  constraint latitude_range check (latitude between -90 and 90),
  constraint longitude_range check (longitude between -180 and 180)
);

-- ─── friends ─────────────────────────────────────────────────────────────────
-- ALWAYS written and deleted as a mirrored pair, in one transaction.
create table public.friends (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  tier public.friend_tier not null default 'general',
  created_at timestamptz not null default now(),
  primary key (owner_id, friend_id),
  constraint no_self_friend check (owner_id <> friend_id)
);
create index friends_friend_idx on public.friends (friend_id);

-- ─── friend_requests ─────────────────────────────────────────────────────────
-- Accepted requests are deleted; the mirrored friends pair is the record.
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  status public.friend_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  constraint no_self_request check (from_user_id <> to_user_id)
);
create index friend_requests_to_idx on public.friend_requests (to_user_id, status);

-- ─── visibility ──────────────────────────────────────────────────────────────
-- The ONLY place post visibility is decided — the port of visiblePostsWhere().
--
-- SECURITY DEFINER is load-bearing here, and is the one case that warrants it.
-- An RLS policy's subquery has the referenced table's RLS applied to it, so an
-- inline `exists (select 1 from friends ...)` inside the posts policy could only
-- ever see the *viewer's* own friend rows — never the author's — and every
-- friend's post would silently disappear. The alternative, letting people read
-- friend rows where they are the target, would expose the author's `tier` for
-- them, and the tier is deliberately private ("it's your own label — they aren't
-- told").
--
-- The function is therefore the narrowest possible bypass: it lives outside the
-- exposed schema, takes no viewer argument (it reads auth.uid() itself, so a
-- caller cannot ask what *someone else* can see), and returns only a boolean.
create schema if not exists private;

create or replace function private.can_see_post(
  post_author uuid,
  post_visibility public.post_visibility
) returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select case
    -- My own posts — every visibility, including private.
    when post_author = (select auth.uid()) then true
    -- Author shared with all their friends, and I am one of them.
    when post_visibility = 'friends' then exists (
      select 1 from public.friends f
      where f.owner_id = post_author and f.friend_id = (select auth.uid())
    )
    -- Author shared with close friends only, and THEY have marked ME close.
    -- The tier lives on the author's own row; my label for them is irrelevant.
    when post_visibility = 'close' then exists (
      select 1 from public.friends f
      where f.owner_id = post_author
        and f.friend_id = (select auth.uid())
        and f.tier = 'close'
    )
    -- `private` is unreachable for anyone but the author: there is no branch
    -- that could match one. You cannot forget to deny it.
    else false
  end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default, which would make this a public
-- endpoint for anon too. Take it back and hand it only to signed-in callers.
revoke all on function private.can_see_post(uuid, public.post_visibility) from public;
grant execute on function private.can_see_post(uuid, public.post_visibility) to authenticated;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_locations enable row level security;
alter table public.friends enable row level security;
alter table public.friend_requests enable row level security;

-- profiles: usernames are searchable by design (that's how you add a friend).
create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);
create policy "you may create only your own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "you may edit only your own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- posts
create policy "posts are visible per the visibility rules"
  on public.posts for select to authenticated
  using (private.can_see_post(author_id, visibility));
create policy "you may write only your own posts"
  on public.posts for insert to authenticated
  with check ((select auth.uid()) = author_id);
create policy "you may edit only your own posts"
  on public.posts for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);
create policy "you may delete only your own posts"
  on public.posts for delete to authenticated
  using ((select auth.uid()) = author_id);

-- post_locations: owner-only, in every direction. No `friends` branch exists.
create policy "locations are readable only by the post's author"
  on public.post_locations for select to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and p.author_id = (select auth.uid())
  ));
create policy "you may attach a location only to your own post"
  on public.post_locations for insert to authenticated
  with check (exists (
    select 1 from public.posts p
    where p.id = post_id and p.author_id = (select auth.uid())
  ));
create policy "you may remove a location only from your own post"
  on public.post_locations for delete to authenticated
  using (exists (
    select 1 from public.posts p
    where p.id = post_id and p.author_id = (select auth.uid())
  ));

-- friends: you can read only the rows you own, so your tier for someone stays
-- yours. Writes go through RPC, because a mirrored pair means writing a row you
-- do not own.
create policy "you may read only your own friend rows"
  on public.friends for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "you may set the tier only on your own friend rows"
  on public.friends for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- friend_requests: visible to either party.
create policy "requests are visible to sender and recipient"
  on public.friend_requests for select to authenticated
  using ((select auth.uid()) in (from_user_id, to_user_id));
create policy "you may send a request only as yourself"
  on public.friend_requests for insert to authenticated
  with check ((select auth.uid()) = from_user_id);
create policy "sender may withdraw, recipient may respond"
  on public.friend_requests for delete to authenticated
  using ((select auth.uid()) in (from_user_id, to_user_id));

-- ─── Data API exposure ───────────────────────────────────────────────────────
-- Since 2026-04-28 tables in `public` are no longer auto-exposed to the Data
-- API, so access is granted explicitly. RLS above decides which *rows*; this
-- decides whether the table is reachable at all.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.post_locations to authenticated;
grant select, update on public.friends to authenticated;
grant select, insert, delete on public.friend_requests to authenticated;
