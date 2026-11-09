# Product

## Register

product

## Platform

web

## Users

People who want to record what they're grateful for and share it with a handful of
close friends rather than an audience. They're writing in private moments — often at
the end of a day, on a phone, alone — and the job is to get a real thought down and
choose deliberately who, if anyone, sees it.

The user base today is small and private: a few people who know each other. Public
signup is a plausible future rather than a current goal, which is why the README
treats password reset as the gate that has to close before strangers arrive. Design
for the small circle that exists now, but don't build anything that would have to be
torn out when the circle grows.

## Product Purpose

A gratitude journal where sharing is opt-in and tiered: `close` friends, all `friends`,
or `private`. Every entry can remember where you were, on a map only its author can
ever see.

Success is that people come back without being nagged. This is a deliberate rewrite of
a v1 that had streaks, badges, stories, and quotes; all of them are gone. The habit has
to form because the thing is worth returning to, not because the app manufactured an
obligation. That constraint is the product: any feature that would work by making
someone feel guilty is off the table, and a retention problem is a sign the writing
experience is wrong rather than a prompt to add mechanics.

## Positioning

Gratitude without an audience. Every other app in the category turns the practice into
performance; this one lets you write for yourself first and share only on purpose.

## Brand Personality

Warm and personal — closer to a letter to someone than a journal entry, or an
enterprise tool. Human and affectionate, with real voice in the copy. It should read
like it was written by a person who cares about the reader, because the thing being
written into it is genuinely personal.

The warmth lives in the words and the typography, not in decoration. Affectionate is
not the same as cute; the voice can be soft without being saccharine, and it should
never perform feeling that the user hasn't brought themselves.

## Anti-references

Four things this must never feel like. All four were confirmed explicitly, and the
first three describe v1 — the rewrite exists partly to escape them.

- **Wellness-app saccharine.** Pastel gradients, lotus icons, inspirational quotes,
  breathy copy. The test: you should never be embarrassed to have it open near someone.
- **A social feed.** Likes, counts, reactions, infinite scroll — anything that turns a
  private practice into performance. There is no audience here by design.
- **A gamified habit tracker.** Streaks, badges, progress rings, guilt notifications.
  v1 had these; removing them was the point of the rewrite.
- **A corporate SaaS dashboard.** Card grids, stat tiles, navy-and-white — the
  interface of a tool you're obligated to use rather than one you want to open.

## Design Principles

- **Private by construction, not by promise.** Coordinates live in a separate table
  so a query can't leak them by forgetting a `select`; photos are re-encoded to
  strip EXIF GPS, and served through an endpoint that asks the same question the
  post does. The interface owes the same standard — a privacy state should be
  legible from the screen, never something the user has to trust or remember.

  This principle is now under real tension, and pretending otherwise would make it
  useless. The visibility rule moved from a TypeScript function into an RLS policy,
  so `private` is unreachable *because the policy is right* rather than because no
  branch exists to forget. And auth, posts and coordinates now live in a hosted
  Supabase project rather than on our own hardware — a trade made deliberately for
  managed auth and password reset, but a trade nonetheless. What's left of the
  principle is: users are never asked to trust *us* about who can see what, and the
  map still touches no third party at all. What's gone is the claim that no third
  party is involved anywhere.
- **No manufactured obligation.** If a design idea works by making someone feel behind,
  it's the wrong idea. This rules out counts, streaks, and nudges as a category, not
  case by case.
- **The writing is the product.** Everything else on screen is in service of getting a
  real thought down. When something competes with the text for attention, the text wins.
- **Sharing is a decision, not a default.** Close, friends, private are one-sided labels
  the author sets. The moment of choosing an audience is the most important interaction
  in the app and should feel deliberate rather than incidental.
- **Warmth through voice, not decoration.** Personality belongs in the copy and the
  type. Reach for a better sentence before reaching for an ornament.

## Accessibility & Inclusion

WCAG AA: body text at ≥4.5:1 contrast, large text ≥3:1, keyboard reachable, visible
focus states. The codebase has a head start — `focus-visible:ring-2` is on the shared
`Button` and `Input`, and the `.rise` entrance animation already disables under
`prefers-reduced-motion`. Both should stay true.
