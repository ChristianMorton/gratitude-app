-- Photos live in a private bucket and are never served from it.
--
-- `public = false` is the whole point. A public bucket hands out a permanent URL
-- to anyone who learns it, which is what v1 did with nginx and how a `private`
-- post's photo became readable by strangers. Signed URLs are no better here: a
-- signed URL is a bearer token, so forwarding one grants access to whoever holds
-- it until it expires — which is not "as visible as the post it belongs to".
--
-- So there are deliberately no storage policies for anon/authenticated at all:
-- nobody reaches this bucket directly. /api/media/[id] asks whether the *post* is
-- visible to the caller (the posts RLS policy answers that), then streams the
-- bytes with the secret key. One door, and it is the same door the post uses.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', false, 10485760, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
