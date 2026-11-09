---
name: Gratitude
description: A gratitude journal where sharing is opt-in and the map is yours alone.
colors:
  burnt-sienna: "oklch(0.54 0.19 34)"
  deep-forest: "oklch(0.48 0.13 152)"
  signal-red: "oklch(0.577 0.245 27.325)"
  aged-parchment: "oklch(0.965 0.022 82)"
  warm-white: "oklch(0.99 0.01 78)"
  deep-inkwell: "oklch(0.17 0.045 42)"
  weathered-ink: "oklch(0.52 0.04 60)"
  muted-sand: "oklch(0.93 0.02 82)"
  warm-sand: "oklch(0.875 0.03 75)"
  parchment-white: "oklch(0.99 0.005 80)"
  forest-tint: "oklch(0.97 0.01 155)"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
    fontVariation: "opsz auto, WONK"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  body:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  label:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  caption:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
rounded:
  sm: "0.45rem"
  md: "0.6rem"
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1.25rem"
  xl: "1.5rem"
  2xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.burnt-sienna}"
    textColor: "{colors.parchment-white}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.deep-inkwell}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.signal-red}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  input:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.deep-inkwell}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
  card:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.deep-inkwell}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
  chip-visibility-selected:
    backgroundColor: "{colors.burnt-sienna}"
    textColor: "{colors.parchment-white}"
    typography: "{typography.caption}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
  chip-visibility-idle:
    backgroundColor: "transparent"
    textColor: "{colors.weathered-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.weathered-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0.375rem 0.75rem"
---

# Design System: Gratitude

## 1. Overview

**Creative North Star: "The Letter Home"**

This is correspondence, not a log. Every visual decision answers to one image: warm ink
on good paper, written to a specific person who will read it carefully. That metaphor
is why the display face is a serif with actual voice, why the primary colour is the
colour of the ink rather than a brand swatch bolted on, and why the surface is quiet
enough that the sentence someone wrote is the loudest thing on screen.

The system is deliberately narrow. One accent carries every action. Depth comes from
tone and a hairline rule rather than shadow. There is no ornament anywhere — the warmth
lives in the typeface and the words, which is the whole bet: an interface for something
this personal earns its feeling by getting out of the way, not by decorating the moment.

That sentence was aspirational when this document was first written: the body carried two
fixed radial gradients, inherited from v1's Bloom theme, washing sienna across the
top-left and forest across the top-right. They were the loudest thing on a surface whose
entire argument is that the writing should be, and they quietly broke two other claims
here — that Deep Forest appears in exactly two places, and that the palette is restrained.
They're gone. The ground is one flat colour in both themes.

It rejects four things by name, inherited directly from PRODUCT.md. It is not
**wellness-app saccharine** — no pastel gradients, no lotus iconography, no breathy
inspirational copy. It is not **a social feed** — no likes, no counts, no reactions,
because there is no audience here by design. It is not **a gamified habit tracker** —
no streaks, badges, or progress rings; v1 had them and the rewrite exists to escape
them. It is not **a corporate SaaS dashboard** — no stat tiles, no card grids, none of
the visual grammar of software you're obligated to open.

**Key Characteristics:**

- Warm-neutral surface (aged parchment) with a single ink-toned accent
- Serif display against a humanist sans body — paired on a real contrast axis
- Flat by circumstance: tone and a 1px rule do the work of shadow
- One-column, 42rem measure, centred — the page is a sheet of paper
- Restrained motion: one entrance stagger, colour and opacity transitions, nothing else
- Full dark mode via `prefers-color-scheme`, not a toggle

## 2. Colors

A parchment ground with one ink-warm accent, tinted throughout toward the brand's own
warm hue rather than toward neutral grey.

### Primary

- **Burnt Sienna** (`oklch(0.54 0.19 34)` / `#c43008`): The only action colour in the
  system. It fills the Post button, marks the selected visibility chip, and draws every
  focus ring. It carries roughly 10% of any given screen — that scarcity is what makes
  a primary action unmissable without shouting. In dark mode it lifts to
  `oklch(0.66 0.17 36)` to hold its footing against the cocoa ground.

### Secondary

- **Deep Forest** (`oklch(0.48 0.13 152)` / `#007136`): The confirmation voice, and the
  only colour permitted to disagree with the sienna. It appears in exactly two places —
  the location chip in the composer and the success notice in the friends manager. Green
  for *this worked* and *this is attached* keeps sienna meaning *act* and never
  *succeeded*.

### Tertiary

- **Signal Red** (`oklch(0.577 0.245 27.325)` / `#e7000b`): Error state only — the
  `ErrorNote` band and the character counter once it runs negative. It sits close to
  sienna on the hue wheel, which is a real tension: at a glance a red error and a sienna
  button are the same family. See the Ink-Is-Not-Alarm Rule below.

### Neutral

- **Aged Parchment** (`oklch(0.965 0.022 82)` / `#fbf2e3`): The page. A warm ground, not
  a white one.
- **Warm White** (`oklch(0.99 0.01 78)` / `#fffbf4`): Cards, inputs — one step up from
  the page. This single step is the system's entire elevation vocabulary.
- **Deep Inkwell** (`oklch(0.17 0.045 42)` / `#1f0701`): Body text. A brown-black, never
  a true black; ink on paper is never `#000`. Hits 17.4:1 on the page.
- **Weathered Ink** (`oklch(0.52 0.04 60)` / `#7b6452`): Secondary text — timestamps,
  hints, placeholders, idle nav. Clears AA at 4.99:1 on the page and 5.38:1 on cards.
- **Muted Sand** (`oklch(0.93 0.02 82)` / `#efe7d9`): Hover fills and the ownership chip.
- **Warm Sand** (`oklch(0.875 0.03 75)` / `#e2d4c1`): Every border and input stroke.

### Named Rules

**The One Ink Rule.** Burnt Sienna is the only accent that may indicate action. If a new
element needs to say *press me* or *this is selected*, it uses sienna or it uses nothing.
Introducing a second action colour to distinguish two buttons means the hierarchy is
wrong, not the palette.

**The Ink-Is-Not-Alarm Rule.** Signal Red and Burnt Sienna are 7° apart in hue. Never
place them adjacent, and never let red carry meaning by colour alone — errors are
announced by the `ErrorNote` band, `role="alert"`, and words. If a user must
distinguish red from sienna to understand what happened, the design has failed.

**The Warm-Tint Rule.** Neutrals are tinted toward the brand's own hue (chroma
0.02–0.045 at hue 42–82), never toward generic warmth and never toward grey. A neutral
at chroma 0 would read as a different product.

## 3. Typography

**Display Font:** Fraunces (with Georgia, serif) — variable, with `opsz` and `WONK` axes live
**Body Font:** Bricolage Grotesque (with ui-sans-serif, system-ui) — weights 300–700
**Label/Mono Font:** None distinct. Numerals use `tabular-nums` on the body face.

**Character:** A wonky optical serif against a humanist grotesque — paired on a genuine
contrast axis, not two sans faces pretending to differ. Fraunces supplies the voice and
appears only where the product speaks as itself; Bricolage carries everything the user
does. The split is strict, and it's what keeps the serif from reading as decoration.

### Hierarchy

- **Display** (600, 1.875rem/2.25rem, `-0.025em`): The wordmark on the auth screens.
  The single largest type in the product.
- **Headline** (600, 1.25rem/1.75rem): Page and form headings — "Welcome back".
- **Title** (600, 1.125rem/1.75rem): The header wordmark inside the app shell.
- **Body** (400, 1rem/1.5rem): Post content and prose. Set with `text-pretty` and
  `whitespace-pre-wrap` so the author's own line breaks survive. The 42rem column holds
  the measure near 70ch without a `max-width` on the text itself.
- **Label** (500, 0.875rem/1.25rem): Field labels, buttons, nav, author names.
- **Caption** (400, 0.75rem/1rem): Timestamps, visibility chips, the character counter.

### Named Rules

**The Serif-Speaks-For-Us Rule.** Fraunces is permitted on the wordmark and page
headings only. It is forbidden on buttons, labels, form controls, data, and post
content. A display face on a UI label is the single fastest way to make a product
interface feel costumed rather than designed.

**The Fixed-Scale Rule.** Type is a fixed rem scale, never `clamp()`. This is product
UI viewed at consistent DPI; a heading that shrinks with the viewport looks worse, not
more responsive. Responsive behaviour here is structural, not typographic.

## 4. Elevation

The system is flat, and honestly so: this was where the code landed rather than a
doctrine it committed to. Surfaces separate by tone and a hairline. A card is Warm White
on an Aged Parchment page — a single lightness step of 0.025 — bounded by a 1px Warm
Sand rule. That one step plus that one rule is the whole vocabulary, and it suits the
paper metaphor: paper doesn't float.

There is exactly one shadow in the product, and it is the exception that proves the
pattern: the map's pin-detail panel (`shadow-lg`) floats over a live basemap, where
tonal separation is impossible because the surface underneath is photographic and
unpredictable. Shadow appears precisely where tone cannot work.

The sticky header uses `backdrop-blur` with an 80%-opaque background — not glass as
decoration, but so scrolled content stays legible beneath it.

### Shadow Vocabulary

- **Floating panel** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`):
  Only for surfaces over the map. Not for cards, dialogs, or hover states.

Because the flatness is circumstance rather than doctrine, there is no rule here
forbidding future shadow. If a `dialog` or popover lands later, it will need an
elevation token, and this section should be revisited rather than worked around.

## 5. Components

Character in one line: **refined and restrained**. Controls recede until needed and
never compete with the writing.

**The Thumb Rule.** Interactive controls are sized by *input device*, never by viewport:
`pointer-coarse:min-h-11` takes every target to 44px on touch and leaves mouse density
alone. A breakpoint would get this backwards in both directions — a touchscreen laptop
at 1440px would keep its 24px targets, and a narrow desktop window would get fat ones for
a cursor that doesn't need them. Screen size has never told you what someone is pointing
with.

### Buttons

- **Shape:** Softly rounded (`0.75rem`), consistent across every variant.
- **Primary:** Burnt Sienna fill, Parchment White label, `0.5rem 1rem` padding, label
  typography at weight 500.
- **Hover / Focus:** Hover drops to 90% opacity over 150ms — a whole-element fade, not a
  colour swap. Focus draws a 2px Burnt Sienna ring via `focus-visible` only, so keyboard
  users get it and pointer users don't. Disabled drops to 50% with `cursor-not-allowed`.
- **Every** interactive control carries the ring, including the ones that aren't
  `Button`: the audience chips, the location picker's buttons, and the photo control.
  That last one is the interesting case — its `<input>` is `sr-only`, so focus lands on
  a 1×1 clipped element and the **label** draws the ring on its behalf, via `peer-*`.
  Not `has-[:focus-visible]`: the input is the label's sibling, and `:has()` only
  matches descendants, so that variant compiles happily and renders nothing at all.
- **Ghost:** Transparent with a Warm Sand border and Deep Inkwell label; fills Muted Sand
  on hover. The default for secondary actions.
- **Danger:** Transparent with a 40%-opacity Signal Red border and red label; fills red
  at 10% on hover. Never a solid red fill — destructive actions here are recoverable and
  shouldn't be dressed as catastrophes.

### Chips

- **Style:** The visibility selector is three chips (`Close friends` / `All friends` /
  `Only me`) at caption size in a `role="group"`.
- **State:** Selected is a Burnt Sienna fill with a Parchment White label and
  `aria-pressed="true"`; idle is Weathered Ink on transparent, filling Muted Sand on
  hover. `Only me` is selected when the composer opens and returns there after every
  post: private is the resting state, and widening the audience is the deliberate act.
- **Weight:** This is the most consequential control in the product, so it gets its own
  line under a visible **Who can see this** label, separated from the attachment
  actions. It is small, but it is not a peer of "Add photo" — an earlier draft of this
  document claimed its smallness was deliberate and that its weight came from being the
  only filled thing in the toolbar. That was a rationalisation of what the code happened
  to do. The label is also the group's accessible name via `aria-labelledby`, so a
  sighted reader and a screen reader are told the same thing in the same words.
- **Ownership chip:** A separate read-only caption chip on your own posts (Muted Sand
  fill, `0.6rem` radius) restating the audience. Never shown on other people's posts.

### Cards / Containers

- **Corner Style:** `1.05rem` — one step softer than buttons, so containers read as
  paper and controls read as objects on it.
- **Background:** Warm White on the Aged Parchment page.
- **Shadow Strategy:** None. See Elevation.
- **Border:** 1px Warm Sand.
- **Internal Padding:** `1.25rem`, with `0.75rem` between stacked children.
- Cards are never nested, and the post card is a real `<article>` with a `<header>` and
  a `<time>` — semantics first, box second.

### Inputs / Fields

- **Style:** 1px Warm Sand stroke on Warm White, `0.75rem` radius, `0.5rem 0.75rem`
  padding, label typography. Wrapped in a `<label>` element so the hit target includes
  the text.
- **Focus:** 2px Burnt Sienna ring, outline removed only because the ring replaces it.
- **Error:** Announced by the `ErrorNote` band (Signal Red on a 10% red fill,
  `role="alert"`), not by recolouring the field.
- **The composer textarea is the exception:** transparent, borderless, no focus ring,
  `resize-none`, and it **grows with the letter** — three lines at rest, expanding to
  hold whatever is written, never scrolling internally. It is not styled as a form
  control because it isn't one; it's the page, and the card around it is the field. A
  page you can only see three lines of would not be a page, which is why the growth is
  structural rather than a nicety. Implemented with an invisible text replica sizing a
  `grid-cols-1` cell — not `field-sizing: content`, which reaches Safari only at 26.2
  and would leave a fifth of readers, most of them on phones, with a clipped box.

### Navigation

- **Style:** A sticky header at `z-10`, 80%-opaque background with `backdrop-blur`, 1px
  bottom rule. Wordmark left in Fraunces, links right at label size.
- **States:** Weathered Ink at rest; Muted Sand fill with Deep Inkwell text on hover over
  150ms. There is no active state — a real gap, noted in Do's and Don'ts.
- **Mobile:** The wordmark stands down below `sm`, and the nav spreads across the full
  width. Still no hamburger — three destinations behind a menu would be ceremony — but
  the earlier claim here that "three links and a sign-out fit the width" was simply
  untested, and false: "Sign out" broke to two lines at 390px, and once every target was
  thumb-sized the header overflowed outright. Of the wordmark and the nav, the wordmark
  is what's expendable: it only links to `/feed`, which the nav already does.

### The Private Map

The product's signature surface. A self-hosted MapLibre canvas rendering local
`.pmtiles`, showing only the viewer's own pins — no other user's location is queryable,
by construction. It is the one place in the system where a floating panel and a shadow
are correct. Nothing here may ever render another person's coordinates, in any state,
under any zoom.

## 6. Do's and Don'ts

### Do:

- **Do** keep Burnt Sienna at or under ~10% of any screen. Its rarity is what makes it
  legible as *action*.
- **Do** reach for Deep Forest only for confirmation and attachment states.
- **Do** set body copy in Bricolage and headings in Fraunces, and keep the split strict.
- **Do** use a fixed rem type scale. Structural responsiveness only.
- **Do** give every interactive element a `focus-visible` ring in Burnt Sienna at 2px.
- **Do** separate surfaces with one tonal step plus a 1px Warm Sand rule.
- **Do** state the audience of a post in words (`Close friends` / `All friends` /
  `Only me`), never by colour or icon alone — the privacy signal must survive a
  colourblind reader, a greyscale screenshot, and a screen reader.
- **Do** keep motion at 150–250ms for state, and let the one `rise` entrance stagger be
  the only choreography in the product.
- **Do** honour `prefers-reduced-motion`: `.rise` already disables, and anything new must.

### Don't:

- **Don't** introduce a second action colour. If two buttons need different colours to be
  told apart, fix the hierarchy.
- **Don't** put Fraunces on a button, label, form control, or post content.
- **Don't** add a box-shadow outside the map. The one `shadow-lg` exists because tone
  can't separate a panel from a photographic basemap; a card on parchment has no such
  excuse.
- **Don't** use glassmorphism decoratively. The header's `backdrop-blur` is functional —
  legibility under scrolled content — and is the only instance permitted.
- **Don't** ship **wellness-app saccharine**: no pastel gradients, no lotus icons, no
  inspirational quotes, no breathy copy. The test is that you're never embarrassed to
  have this open near someone.
- **Don't** ship **a social feed**: no likes, no counts, no reactions, no infinite
  scroll. There is no audience here by design.
- **Don't** ship **a gamified habit tracker**: no streaks, badges, progress rings, or
  guilt notifications. v1 had these; removing them was the point.
- **Don't** ship **a corporate SaaS dashboard**: no stat tiles, no identical card grids,
  no hero-metric template.
- **Don't** use `border-left` or `border-right` over 1px as a coloured stripe. Ever.
- **Don't** apply gradient text (`background-clip: text`) anywhere.
- **Don't** nest cards. The post card and composer are already the deepest containers
  the system has.
- **Don't** put a spinner in the middle of content. Buttons state their work in words
  ("Posting…", "Signing in…"); larger surfaces get skeletons.

### Known gaps (as of this scan)

These are the current state, recorded honestly rather than papered over:

- **Signal Red fails WCAG AA**, which PRODUCT.md commits to. It measures 4.30:1 on the
  light page (needs 4.5:1), 4.09:1 on the dark page, and 3.83:1 on dark cards. It is the
  only token that misses. Fix by darkening toward `oklch(0.52 0.245 27)` in light mode
  and lightening in dark, rather than by dropping the AA commitment.
- **Nav has no active state.** Nothing tells you which of Feed / Map / Friends you're on.
- **The Post button leaves the tab order when disabled**, so a keyboard user tabbing an
  empty composer never meets the primary action at all — it simply isn't there until the
  first character is typed.
- **`--secondary` and `--secondary-foreground` are dead tokens** — dusty wisteria,
  defined in `globals.css`, referenced nowhere. Delete them or use them; leaving them
  invites a future agent to "restore" a colour that was never part of the system.
- **The composer has no loading skeleton**, only a button label change.
