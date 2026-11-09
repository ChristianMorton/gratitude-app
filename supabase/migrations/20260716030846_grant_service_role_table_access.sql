-- Since 2026-04-28, tables in `public` are not auto-exposed, and the init
-- migration granted access to `authenticated` only. `service_role` was left with
-- nothing but the defaults it inherits (TRUNCATE/REFERENCES/TRIGGER) — no SELECT.
--
-- The failure was quiet, which is the interesting part. supabase-js does not
-- throw on a permission error; it returns `{ data: null, error }`. So the
-- username → email lookup at sign-in simply found nobody and reported
-- "Incorrect username or password", and the duplicate-username pre-check found
-- no clash and sailed on — landing on the unique constraint instead and
-- producing the right message for the wrong reason.
--
-- service_role bypasses RLS, so these grants decide nothing about *rows*; they
-- only make the tables reachable for the two jobs RLS genuinely cannot do:
-- resolving a username before you are signed in, and undoing a half-made account.
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.posts to service_role;
grant select, insert, delete on public.post_locations to service_role;
grant select, insert, update, delete on public.friends to service_role;
grant select, insert, delete on public.friend_requests to service_role;
