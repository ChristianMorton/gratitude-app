/**
 * Post visibility is no longer decided here. It is decided in Postgres, by the
 * `posts are visible per the visibility rules` RLS policy and the
 * `private.can_see_post()` function behind it — see
 * `supabase/migrations/20260716024735_init_gratitude_schema.sql`.
 *
 * This file is kept as a signpost, because the rule it used to hold is the most
 * important rule in the product and the next person will look here first.
 *
 * What carried over from the Prisma predicate:
 *
 *  - Postgres still applies it BEFORE the limit, so `take + 1` and `hasMore`
 *    measure the same set. That is what stopped v1 dropping posts from pages.
 *  - It still restricts the author set as a side effect, so the feed IS the
 *    predicate — there is no separate "whose posts?" query to keep in sync.
 *  - `private` still has no branch that could match it for a non-author.
 *
 * What changed, and is worth being honest about: `private` used to be
 * unreachable *by construction* — there was no code path to forget. It is now
 * unreachable *because the policy is correct*. That is a weaker kind of
 * guarantee, and the reason the cross-account privacy tests in
 * `tests/e2e/privacy.spec.ts` matter more than they did.
 */

export {}
