# Public source release

This repository is a source-code demonstration. Publishing the code does not
open registration on the hosted service or grant access to its database.

## Local walkthrough

Use Node 24 and Docker Desktop (Linux containers). Run `npm ci`, then
`npm run db:start`. Copy `.env.example` to `.env` and replace its two key
placeholders with the local values from `npx supabase status -o env`.
Run `npm run dev` and open http://localhost:3000.

You can explore registration, posting, friendships and photo sharing without
downloading map tiles. The map's basemap will be unavailable until you provision
`public/tiles/world.pmtiles`; this is an explicit limitation of the lightweight
walkthrough, not a fallback to an external tile service.

Create two fictional accounts in separate browser profiles. Post one private,
one friends-only and one close-friends gratitude. Accept a friend request, change
the friend tier and compare the two feeds. Use generated images and fictional
locations; do not import production records. Local email is captured in Mailpit
at http://localhost:54324. End-to-end tests also create fictional accounts.

Map provisioning currently requires Linux or WSL and approximately 17GB of disk
and download capacity. The application itself can be explored on Windows.

## Checks

`npm run lint`, `npm run typecheck`, `npm test` and `npm run build` are the basic
checks. With the local Supabase stack running, install Chromium using
`npx playwright install chromium`, then run `npm run test:e2e`.
The GitHub workflow runs the basic checks; browser/database checks are separate.

Never point the test suite at a hosted Supabase project. Its account creation is
real and does not automatically remove every record afterwards.

## Before making any repository public

- Inspect all branches and tags, including history, for credentials and private
  records. A clean current tree alone does not remove past exposure.
- Keep `.env`, uploads, database exports, maps and local agent configuration out
  of Git. Rotate any credential found in history before publishing.
- Review the historical deployment configuration and hostname references.
  Forks must supply their own infrastructure and CI secrets.
- Confirm ownership of application code and the licence for redistributed
  fonts, map assets and development tooling. No application licence is selected
  by this preparation; public visibility alone does not grant reuse rights.
- Review hosted-service contact details and legal pages before operating a fork.
- Keep source publication separate from a production launch; configure email
  delivery and verify access rules before inviting real users.

The README explains intended privacy properties. Those properties depend on the
database policies, server code and deployment configuration together; they are
not a guarantee supplied by publishing the repository.

## Preparation audit (9 November 2026)

All 11 commits reachable from the cloned refs were checked for common private-key,
provider-token and Supabase secret-key signatures and suspicious credential
filenames. No matching credentials were found. This is a targeted pattern scan,
not a guarantee that history contains no confidential material. Local developer
settings and bundled agent tooling have been removed from the prepared tree;
they remain in the private repository's history. The recommended public edition
is a new source snapshot without that history.

The Noto font licence already ships at `public/fonts/OFL.txt` and is retained.
Hosted-service branding and public support contacts are retained intentionally.

Validation on the preparation machine:

- Lint, TypeScript checking and production build passed.
- All 11 unit tests passed. The sandboxed test run initially failed on a
  temporary-file permission; the normal-permission run passed.
- Upgraded Next.js and its ESLint config to 16.4.5, MapLibre to 6.17.0, and
  compatible lockfile dependencies. Updated the map import for MapLibre's named
  exports. `npm audit --omit=dev` reports zero advisories.
- The complete dependency audit still reports eight moderate findings in the
  ESLint/typescript-eslint/minimatch development-only chain. Its automatic
  recommendation downgrades the Next ESLint config; that downgrade was not
  applied. Review a compatible upstream fix before removing this note.
- Database/browser integration tests and live map rendering were not run:
  Docker's Linux engine was unavailable and no basemap was downloaded. In
  particular, visually verify the map after the MapLibre major-version update.
- The build reports the existing Next middleware-to-proxy deprecation. It
  does not prevent compilation but remains a maintenance task.

## Interface captures

`docs/media` contains genuine browser captures of the composer/feed at desktop
and mobile widths, the sign-in page, an audience-selection GIF and a map/pin
preview. Fictional component fixtures are visibly labelled. The map preview
uses an external MapLibre demo basemap, not the 17GB production archive. See
`scripts/portfolio-preview/README.md` for reproduction and scope limits.

The capture caught and fixed a MapLibre v6 worker-loading regression. Installation
now copies the worker and its licence to an ignored same-origin asset directory;
Docker builds also copy that generated asset into the runtime image. Rendering
and pin selection were checked in the preview. This does not verify production
PMTiles rendering, real authentication, database policies or sharing enforcement.
