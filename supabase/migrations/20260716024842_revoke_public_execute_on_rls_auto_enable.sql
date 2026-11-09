-- `rls_auto_enable()` is the function behind the `ensure_rls` event trigger: it
-- turns RLS on for any new table in `public`. A good safety net, and not ours —
-- it exists on the hosted project only.
--
-- It ships with EXECUTE granted to PUBLIC/anon/authenticated, which the security
-- advisor flags: a SECURITY DEFINER function reachable at
-- /rest/v1/rpc/rls_auto_enable. In practice Postgres refuses to execute an
-- event-trigger function directly, so it's a small hole rather than an open
-- door. But event triggers fire on DDL regardless of EXECUTE grants: the grant
-- buys nothing and only widens the surface. Take it back.
--
-- Guarded because a local `supabase start` stack has no such function, and a
-- migration that only runs on one of the two environments isn't a migration.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
