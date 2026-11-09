/**
 * Nothing to set up any more.
 *
 * This used to point the suite at a disposable Postgres and truncate between
 * tests, because everything under test talked to a database. It doesn't now: the
 * rules moved into Postgres as RLS policies, and they're covered by tests/e2e,
 * which drives real signed-in browsers against a real stack.
 *
 * What's left in tests/units.test.ts is pure — cursors, coordinate rounding,
 * magic-byte sniffing — and needs no database, no environment, and no teardown.
 * Kept as a file because vitest.config.ts references it, and because an empty
 * setup is a clearer statement than a missing one.
 */

export {}
