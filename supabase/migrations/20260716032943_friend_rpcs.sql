-- Befriending needs functions, not policies.
--
-- A friendship is a mirrored PAIR of rows, written together. RLS can only ever
-- say "you may insert rows you own", so the reverse row — the one belonging to
-- the other person — is unwritable through the Data API by design. These are the
-- narrow exceptions.
--
-- Each is SECURITY DEFINER and therefore bypasses RLS, so each one:
--   * lives in `public` because it must be callable at /rest/v1/rpc,
--   * has EXECUTE revoked from PUBLIC/anon and granted only to `authenticated`
--     (Postgres grants EXECUTE to PUBLIC by default, which would otherwise make
--     every one of these a public endpoint),
--   * checks auth.uid() itself and takes no "acting as" argument, so a caller
--     can only ever act as themselves.
--
-- That last point is load-bearing, not ceremony: without the check in
-- accept_friend_request, anyone who learned a request id could befriend two
-- strangers to each other, and the function would have done it gladly.

-- ─── send ────────────────────────────────────────────────────────────────────
-- Returns 'pending', 'accepted' (they had already asked us — no second click
-- needed) or 'already'.
create or replace function public.send_friend_request(target_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target uuid;
  incoming uuid;
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;

  select id into target from public.profiles where lower(username) = lower(btrim(target_username));
  if target is null then raise exception 'No one found' using errcode = 'P0002'; end if;
  if target = me then raise exception 'You cannot add yourself' using errcode = '22023'; end if;

  if exists (select 1 from public.friends where owner_id = me and friend_id = target) then
    return 'already';
  end if;

  -- They asked first: two people asking each other is consent twice over, so
  -- don't make the second one wait on a button.
  select id into incoming from public.friend_requests
   where from_user_id = target and to_user_id = me and status = 'pending';

  if incoming is not null then
    insert into public.friends (owner_id, friend_id)
      values (me, target), (target, me)
      on conflict do nothing;
    delete from public.friend_requests where id = incoming;
    return 'accepted';
  end if;

  insert into public.friend_requests (from_user_id, to_user_id)
    values (me, target)
    on conflict (from_user_id, to_user_id) do update set status = 'pending';
  return 'pending';
end $$;

-- ─── accept ──────────────────────────────────────────────────────────────────
create or replace function public.accept_friend_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  req record;
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;

  select * into req from public.friend_requests where id = request_id;
  if not found then raise exception 'No such request' using errcode = 'P0002'; end if;

  -- Only the recipient may accept. Without this the function would let anyone
  -- who learns a request id befriend two strangers to each other.
  if req.to_user_id <> me then raise exception 'Not your request' using errcode = '42501'; end if;

  insert into public.friends (owner_id, friend_id)
    values (req.from_user_id, req.to_user_id), (req.to_user_id, req.from_user_id)
    on conflict do nothing;

  -- Accepted requests are deleted; the pair is the record.
  delete from public.friend_requests where id = request_id;
end $$;

-- ─── remove ──────────────────────────────────────────────────────────────────
-- Deletes BOTH rows. Unfriending is not one-sided, even though the tier is:
-- leaving the reverse row would keep showing them your `friends` posts.
create or replace function public.remove_friend(other_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;

  delete from public.friends
   where (owner_id = me and friend_id = other_id)
      or (owner_id = other_id and friend_id = me);
end $$;

-- Postgres hands EXECUTE to PUBLIC by default; anon inherits it. Take it back
-- before granting, or these are open endpoints.
revoke all on function public.send_friend_request(text) from public, anon;
revoke all on function public.accept_friend_request(uuid) from public, anon;
revoke all on function public.remove_friend(uuid) from public, anon;

grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
