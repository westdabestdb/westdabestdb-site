# westdabestdb v3 — design and build spec

Approved by Görkem on 2026-09-08. **Source of truth is `design/mockup.html`**:
its CSS values and markup structure are the spec. Ignore in that file: the
`.chrome` toolbar, `.stage.phone` frame, the font picker `<select>` and its
JS, the `FONTS` map, and the view-switching JS. Everything else is what the
site must look like.

## Stack

- Next.js 16 (App Router, TypeScript strict), React 19, Tailwind 4.
- Fonts via `next/font/google` in `app/fonts.ts`: **Funnel Sans** (variable,
  wght 300–800 — no `weight` option, so the whole axis ships as one file) for
  everything, **JetBrains Mono** (400, 500) for code blocks only. Everything
  typographic resolves through `--font-ui`, so the family is one variable.
- Content in the repo: MDX posts, Markdown projects, page prose, `cv.json`
  (there is no /cv page — only `/llms.txt` and `/api/site.json` read it),
  `site.ts`. Loaded with `gray-matter`; MDX rendered with `next-mdx-remote`
  (RSC) and `rehype-pretty-code` (shiki) for code blocks.
- `app/feed.xml/route.ts` (RSS), `app/sitemap.ts`, `app/robots.ts`,
  `app/og/[slug]/route.tsx` (next/og) or `opengraph-image.tsx` per post.
- Vercel. No UI component libraries. No CSS-in-JS. No analytics script yet.
- Client JS only for: theme toggle (which also drives the circular theme
  reveal), Copy email, Work page filter, the row hover preview
  (`components/fx/HoverPreview.tsx`), the custom cursor
  (`components/fx/Cursor.tsx`), the avatar toy
  (`components/fx/AvatarToy.tsx`), the click
  impact (`components/fx/Ripple.tsx`) and the tab tricks
  (`components/fx/TabTricks.tsx`), and the corner player — the turntable
  (`components/fx/turntable/`), see "Corner ambience" — nine client
  components (plus Sounds/SoundToggle). `lib/spring.ts` is the one damped spring both the
  cursor and the avatar toy run on; `Sounds.tsx` exports `play('down' | 'up' |
  'pop')` so other components can use the same synth without duplicating it.
  Everything else, motion included, is CSS.

## Tokens ("Cool slate", picked 2026-09-08; the mockup was pure neutral)

| token   | light             | dark                     |
|---------|-------------------|--------------------------|
| bg      | `#fbfcfd`         | `#0a0d13`                |
| elev    | `#f1f4f8`         | `#141a24`                |
| p       | `#0f172a`         | `#e6e9ef`                |
| s       | `#3f4a5c`         | `#b6bdc9`                |
| t       | `#64708a`         | `#8791a3`                |
| q       | `#98a3b6`         | `#5b6474`                |
| ring    | `rgba(15,23,42,.10)` | `rgba(230,233,239,.10)`  |
| code    | `#eff3f7`         | `#11161f`                |
| hover   | `rgba(15,23,42,.06)` | `rgba(230,233,239,.08)`  |
| sel     | `rgba(15,23,42,.14)` | `rgba(230,233,239,.22)`  |

Theme: system preference by default (`prefers-color-scheme`), overridable
with `data-theme="light|dark"` on `<html>` from a toggle in the footer.
Persist in `localStorage`; apply with a tiny inline script in `<head>` before
paint so there is no flash. Expose tokens as CSS variables and map them into
Tailwind 4 `@theme` so utilities like `text-q` work.

## Type and spacing

- Body: Funnel Sans 16px / 1.6, `-webkit-font-smoothing: antialiased`. No
  `font-feature-settings`.
- Home / Work / Writing column: max 672px, padding 128px top (64px under
  640px), 16px sides, 96px bottom. Blocks separated by 64px. Inside a block:
  16px between label and list.
- No top bar. The home page starts straight at the avatar (128px top
  padding). Every sub-page opens its column with a plain, non-sticky
  `← Back` link: 16px / 500 in `t`, hover `p` with a 2px-offset
  underline, no padding and no background. It is the column's first child,
  so it leads the fade-up stagger.
- Avatar: 64px circle, 32px below it.
- h1: 32px / 600 / line-height 1.25 (raised from 24 on 2026-09-08). Bio: 24px / 600 in `s`, `text-wrap: pretty`.
- Section label (h2): 16px / 400 in `q`; when it is a link, hover turns it
  `p` and reveals a "→" after it.
- List rows: 20px / 1.6, 6px between rows (16px under 640px). Title 500 in
  `p`, hover underline with 1px offset. Description in `q`, single line with
  ellipsis on desktop, wraps on mobile. Year at the end in `q`,
  `tabular-nums`. Row is `flex-row` desktop, `flex-col` mobile.
- Numbered writing rows: "010", "009"… in `q`, 2.4em wide, hidden on mobile.
  Number = position in the date-ascending list, zero-padded to 3.
- Footer: one row, 16px in `q`: the "Copy email" button, "CV" (a plain link
  straight to `/resume.pdf`, new tab — there is no /cv page), and the theme
  toggle. Nothing on the right, no rule above it.
- Post page: column max 768px, 32px between blocks, padding 48px top
  (64 at ≥1024, 80 at ≥1280). Date 16px `t`. Title 30px (36 at ≥768, 40 at
  ≥1024) / 700 / line-height 1.2 / letter-spacing −0.64px. Tags as plain text
  in `t` separated by "·". Body 18px / 1.6 with 16px between blocks; h2 22px /
  600; lists disc with 8px gaps; blockquote 2px left rule in `ring`, text `s`;
  `pre` background `code`, radius 8, 14px mono, no border. Prev/next links at
  the bottom, no rule.

## Motion

Five effects, plus the three quirks in the second table — all subtle.
Everything is off or held still under `prefers-reduced-motion: reduce`: the
hover preview and the custom cursor stay but stop moving, and the three quirks
do nothing at all. The CSS is one file, `app/fx.css` (imported at the top of
`globals.css`); each effect is one clearly-marked block there — 1 fade-up,
2 theme reveal, 3 hover preview, 4 custom cursor, 5 click impact, 6 avatar
toy — plus, at most, one small component, so any of them can be deleted on
its own. The tab tricks have no CSS at all.

A sleepy cursor was built alongside the custom cursor's other quirks — 20s
idle and the arrow dozed off at +34° under three floating z's. Görkem did not
want it; the idle timer, the `data-sleep` pose, its spring and its 4b CSS
block are gone. A trailing effect behind the cursor at speed — faint copies
of the drawing sampled a few frames back — went the same way: Görkem did not
want anything shadow-like following the cursor, so the sampling buffer, its
4a CSS block and the drop shadow the cursor's own arrow carried are gone too.

There was a sixth effect, the cursor spotlight — a radial `--spot` glow
trailing the pointer behind the page. Görkem did not like it; it is gone, along
with its token, its component and its fx.css block. Its `main { position:
relative; z-index: 1 }` lift went too, and then came back for a second corner
player's flame canvas, which needed the same trick to read *through* the page
rather than over it. That player is now gone as well — Görkem did not want
it — taking its stylesheet and that lift with it. Everything above the page
stacks the same way it did before either: hover preview 50, click impact 55,
cursor 60, with the turntable at 40.

| effect | what | timing |
|--------|------|--------|
| Staggered fade-up | `.wrap > *` rise from `translateY(8px)` / opacity 0 on load. `:nth-child` sets `--i`, so there is no JS. On a post page only the home link, the header and the body move — never a paragraph. | 480ms `cubic-bezier(.2,.7,.2,1)`, `both` fill, `--i × 45ms` delay clamped at 450ms |
| Theme circular reveal | The toggle wraps the theme change in `document.startViewTransition` and clips `::view-transition-new(root)` from a zero-radius circle at the button's centre to the farthest viewport corner. No API or reduced motion → the same instant switch as before. | 520ms `cubic-bezier(.2,.7,.2,1)` |
| Row hover preview | Hovering a project row floats a 240×150 image of that product to the right of the cursor, vertically centred on it (`components/fx/HoverPreview.tsx`, one `pointer-events: none` element at `z-index: 50`, `pointerover`/`pointerout` delegated on `document` against `a[data-preview]`). 18px to the right of the cursor, flipped to the left when there is no room, clamped inside the viewport, trailing behind a rAF lerp of 0.18. One element for the life of the page: only `src` changes, and the next file is decoded before the swap, so moving between rows never flashes. The first hover warms every preview on the page with `new Image()`. Mounted only for a fine hovering pointer. **The one shadow on the site**: an image lifting off the page is not a content container, so it gets `border-radius: 8px` and `0 12px 40px rgba(0,0,0,.18)` (`.55` dark) via `--preview-shadow`. No border. | in 160ms `cubic-bezier(.2,.7,.2,1)` (opacity 0 → 1, scale .96 → 1), out 120ms fade; under reduced motion it is anchored to the cursor — no lerp, no scale, instant opacity |

| Click sounds | `components/fx/Sounds.tsx`, mounted once in the root layout. Web Audio only, no files: a lowpass noise burst plus a 190→120Hz sine on primary-button `pointerdown` (≈50ms), a lighter highpass tick on `pointerup` (≈30ms), a 560→280Hz pop when `data-theme` changes, and — fine pointers only — a **hover tick** when the pointer arrives on `a, button, select, [role=button], label`: highpass noise at **3.5kHz for 10ms** at gain **.045** plus a **900→700Hz** sine over **14ms** at gain **.03**, clearly lighter and shorter than the release tick. The tick keys off the closest such element, so sliding between the words inside one link is silent, and it fires **at most once per 70ms**; `pointerout` to somewhere outside that element resets it, so coming back ticks again. Master gain 0.5, envelopes exponential. The AudioContext is created on the first sound and stays suspended — silent — until the visitor's first real gesture, so a hover before any click makes no noise. `play('down' | 'up' | 'pop' | 'hover')` is exported so other components (the avatar toy) can use the same synth. Footer toggle `SoundToggle` ("Sound" / "Muted", `aria-pressed`) persists `localStorage.sound`; default on. | fire-and-forget nodes, each stopped after its envelope |
| Custom cursor | A comic arrow (30×38, white fill, 2.4px dark outline; fill and outline swap on dark) pinned exactly to the pointer (`components/fx/Cursor.tsx`, `pointer-events: none`, `z-index: 60`). Leans into its direction of travel (smoothed velocity → up to 22°, damped spring k .16 d .72), stretches up to 12% at speed, squashes 14%/22% on click on a second spring (k .28 d .62) with a small overshoot on release. Pointing hand over `a, button, select, [role=button], label`; rounded I-beam over text elements. `cursor: none` only via `html.has-cursor`, which the component adds while mounted, so no-JS, touch and coarse pointers keep the native cursor. | mode swap 120ms opacity; springs from rAF; under reduced motion it still follows with no tilt, stretch or squash |

Three quirks on top, added after the build was finished. Each is one block in
`app/fx.css` and one removable file or code path; all three are inert under
`prefers-reduced-motion: reduce`, and none of them hides anything from a
no-JS, touch or keyboard visitor.

| quirk | what | timing |
|-------|------|--------|
| Avatar toy | The home avatar is wrapped in `components/fx/AvatarToy.tsx` (block 6); `next/image` still renders the picture. Press and release without moving **4px** and the *image* turns **360°** once, via Web Animations on its own **`rotate`** property, plus `play('pop')`; the *wrapper* owns `transform` for the drag, so a spin and a drag never share a value and a drag starting mid-spin cancels it. Move past the slop and it drags: `setPointerCapture` on the wrapper **and** move/up/cancel on `document`, so outrunning the 64px box or releasing anywhere still works. Displacement is measured from the pointerdown origin (never accumulated) and softened by **`d × 0.55 / (1 + d / 220)`** — ~0.55 of the pull near the middle, easing smoothly to **≈121px**, never a hard clamp — stretching along the drag axis to **`scaleX 1.22` / `scaleY .9`** (rotate to the angle, scale, rotate back). Every transform is written from the rAF loop, never straight out of an event. Release springs it home on the shared `Spring` at **k .18 / d .74**, which overshoots visibly, plus `play('up')`. `touch-action: none`, `user-select: none`, `-webkit-user-drag: none`, `draggable={false}` and a cancelled `dragstart` (without it the native image drag hijacks the gesture); no `preventDefault` on `pointerdown`, so capture, the click impact and the cursor's mode switching are unaffected; no `cursor` of its own. The avatar is not focusable, so keyboard users see no change. | spin **700ms `cubic-bezier(.2,.7,.2,1)`**; drag repaints once per frame; return spring from rAF, home in ~600ms with one overshoot past zero; under reduced motion neither gesture is attached — the picture just sits there |
| Click impact | One throwaway inline `<svg class="impact">` (48×48) per primary-button `pointerdown`, centred on the click (`components/fx/Ripple.tsx`, block 5), removed on the ring's `animationend`, at most **6** live at once. Drawn in the cursor's own ink — `--cur-line`, falling back to `--p` — so the two read as one hand and it swaps on dark. A `<circle>` pops **8px → 34px** on `transform` with a **2.5px** round stroke held at 2.5px by `vector-effect: non-scaling-stroke`, finishing **`scale(1.05, .95)`** so the ring is 5% wider than tall and reads as drawn. Six `<line>` dashes (2.5px, 7 long, round caps) sit in `<g>`s rotated **60°** apart and share one keyframe: `translateY(-20px)` takes the inner end from radius **10 → 30** while `stroke-dashoffset` **0 → 7** eats the dash to zero length. `pointer-events: none`, `z-index: 55`, `overflow: visible` so the dashes clear the box. | ring **360ms `cubic-bezier(.2,.9,.3,1.25)`**, dashes **300ms `cubic-bezier(.2,.7,.2,1)`**, whole thing fading out over 360ms `ease-out`; nothing is created under reduced motion |
| Tab tricks | `components/fx/TabTricks.tsx`, mounted once in the root layout, renders nothing. On `visibilitychange` it remembers `document.title` **at hide time** (Next rewrites it per route) and swaps in `still here.`, restoring it on the way back. Once per page load it prints a `%c`-styled monospace console signature: the name in a box-drawing box, "Hi. You read consoles too. <email>", and "Source: https://github.com/<repo>". Name, email and repo come from `lib/content` `getSite()` as props, since the component is client-only. Dev and production alike; a module flag keeps StrictMode from printing it twice. | instant on both events; no CSS, no motion, nothing to disable under reduced motion |

`cursor: none` is set in exactly one place — `html.has-cursor, html.has-cursor *`
— and `has-cursor` is added to `<html>` by `Cursor.tsx` only while it is
mounted. No JS, a touch device or a coarse pointer therefore never loses the
native cursor, and clicking, text selection and keyboard focus rings are
untouched because both elements are `pointer-events: none`.

No effect introduces a colour or a layout shift, and the page is fully
visible at rest in every case. The hover preview's shadow and the click
impact's strokes are the only two, and both are on transient,
`pointer-events: none` elements rather than on content.

## Corner ambience

One optional player in the bottom-right, at `z-index: 40`, under everything
the cursor draws. It synthesises its sound live — there is no audio file in
this repo — builds its AudioContext inside the click that starts it, renders
nothing server-side (no JS, no control), and is its own button rather than
anything the footer's Sound/Muted toggle governs: that toggle is for the
interface's click sounds, this is a thing you asked for. There used to be a
second player, a small flame beside the record; Görkem did not want it, so it
and its stylesheet are gone, and with them the `main { position: relative;
z-index: 1 }` lift that only existed to let its flame canvas read through
the page.

| control | what |
|---------|------|
| Turntable | A 64px record, `components/fx/turntable/Turntable.tsx` + `engine.ts`, styled by `app/turntable.css`. Click it and a generative lo-fi jazz trio plays, written by a look-ahead scheduler. The disc turns (1.8s a revolution) and the tonearm swings in. No caption beside it — the `title` and `aria-label` carry the words. |

## Rules (non-negotiable)

1. **No bordered containers.** No borders, rings, shadows, pills, chips,
   badges or divider lines on content. Hierarchy comes from spacing, weight
   and the grey scale only. Code blocks get a background, nothing else. There
   are exactly two agreed exceptions, both on transient, `pointer-events: none`
   elements that hold no content: the floating hover preview (8px radius and a
   soft shadow — an image lifting off the page, not a container) and the click
   impact (a 2.5px stroked ring and six dashes that pop out and are gone in
   360ms — see Motion for both).
2. **No global accent colour.** Links are underlined or grey-to-primary on
   hover. The only colour is the optional per-post `accent` in frontmatter,
   used on that post page for link underline, tag text, code keywords and
   text selection.
3. Hover states: underline or colour shift. Transitions ≤ 180ms. Honour
   `prefers-reduced-motion`.
4. Keep every existing URL: `/blog/[slug]`, `/tags/[tag]`, `/feed.xml`,
   `/resume.pdf`. Redirect `/projects` → `/work`, `/archive` → `/writing`,
   `/about` → `/`, `/cv` → `/resume.pdf` (all permanent).
5. No lorem ipsum, no placeholder copy. Every *content* string on the site
   comes from `content/` — prose, names, descriptions, dates, page titles.
   UI chrome labels stay in the components that render them: the /work filter
   buttons ("All", "With teams", "On my own"), "CV", "Copy email" / "Email
   copied", "Dark" / "Light", "Back", "Next" / "Previous", the section labels
   ("Work", "Writing", "Side projects", "Tags"), and the 404 text.
6. Do not add dependencies beyond: next, react, react-dom, tailwindcss,
   @tailwindcss/postcss, typescript, @types/*, gray-matter, next-mdx-remote,
   rehype-pretty-code, shiki, remark-gfm, rehype-slug, reading-time, zod
   (schema validation), image-size (dev only — MDX image dimensions read at
   build time), eslint + eslint-config-next.

## Routes

| route | content |
|-------|---------|
| `/` | Avatar, name, bio (links to Flovi, Charles, 4Human, Lupasafe) → social links (GitHub, LinkedIn, Email) → **Work** (projects with `featured: true`, newest first: ongoing, then by end year, start year, `order`) → **Side projects** (`lab: true`) → **Writing** (latest 5, numbered) → footer |
| `/work` | `← Back` → "Work" h1, intro, "Stack" line, plain-text filter All / With teams / On my own → sections "With teams" (`own: false`) and "On my own" (`own: true`); rows show a second grey meta line: role · stack · proof |
| `/writing` | all posts, numbered, newest first, year at the end |
| `/blog/[slug]` | post page as specified; per-post accent |
| `/tags/[tag]` | posts with that tag, same row style |
| `/llms.txt` | plain-text summary: who, current work, projects, latest posts with URLs |
| `/api/site.json` | JSON of the same data |
| `/feed.xml`, `/sitemap.xml`, `/robots.txt`, `/og/[slug]` | generated |
| `not-found` | name, "Nothing here.", link home |

## Content schema (`content/`)

```
content/
  site.ts          name, title, location, bio (array of text | {text, href}),
                   social [{label, href}], email, github repo, stack[],
                   workIntro (the sentence under the /work heading)
  posts/*.mdx      frontmatter: title, date (YYYY-MM-DD), tags[], summary,
                   draft?: boolean, accent?: "#rrggbb"
  projects/*.md    frontmatter: name, description (≤ 45 chars), year ("2024–"
                   or "2021–2023" or "2019"), role, stack[], proof?, link,
                   preview? ("/static/images/previews/<slug>.webp", the row
                   hover image — 640×400 webp, regenerated by
                   scripts/previews.mjs), own: boolean,
                   status: "live"|"archived"|"store",
                   featured?: boolean, lab?: boolean (home "Side projects"),
                   order?: number
                   body: optional longer paragraph
  cv.json          {name, title, location, email, links:{github, linkedin, site},
                   summary, experience:[{company, role, start "YYYY-MM",
                   end "YYYY-MM"|null, location, stack[], bullets[]}],
                   skills:[{label, items[]}] (ordered, the résumé's own
                   groups), sideProjects:[{name, description,
                   links:[{label, href}]}], education:[{school, degree, years}]
                   read only by /llms.txt and /api/site.json — no /cv page
```

Validate all frontmatter with zod at load time; fail the build on a bad file.

## Process

- This is a git worktree on branch `v3`. **No commits, no pushes** until
  Görkem says so. Leave everything in the working tree.
- Dev server for review: `npm run dev -- -p 3001`. Production check:
  `npm run build && npx next start -p 3002`.
- Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Old site files (`pages/`, `components/`, `layouts/`, `lib/`, `css/`,
  `data/`, `scripts/`, `tailwind.config.js`, `jsconfig.json`,
  `next.config.js`, `.eslintrc.js`, `.eslintignore`, `.husky/`,
  `prettier.config.js`) are deleted only in the final hygiene pass, after
  `content/` has been written from `data/`.

## Turntable

A record in the bottom-right corner (`right: 20px; bottom: 20px`, `z-index: 40`
— under the hover preview at 50 and the cursor at 60). Click it and a lo-fi
jazz trio starts playing. Nothing is streamed and no audio file exists in the
repo: every note is synthesised in the browser.

- `components/fx/turntable/Turntable.tsx` — one `<button>` with `aria-pressed`
  and `aria-label` "Play jazz" / "Pause jazz", mounted once in the root layout
  so the music survives a client-side navigation. Client-only: it renders
  nothing server-side, so a visitor without JavaScript sees no control at all,
  and it is a plain button, so a tap works like a click. `pagehide` pauses.
- `app/turntable.css` — imported by the component, not by `globals.css`. The
  disc is stacked radial gradients (grooves from a `repeating-radial-gradient`
  at 2px, a centre label in `var(--elev)`, a spindle hole in `var(--bg)`, and
  an outer rim stop that lightens on the dark theme so the black record still
  reads on black). The tonearm is an inline SVG in `var(--t)`, pivoted at its
  top-right, `-28°` parked and `0°` playing over 500ms. The disc spins on a
  1.8s linear CSS animation while `data-playing` is set. Greyscale, no borders.
  Under `prefers-reduced-motion: reduce` nothing spins and nothing transitions —
  the music still plays.
- `components/fx/turntable/engine.ts` — the generative engine, pure Web Audio.
  Everything is built lazily inside the first click, which is what the autoplay
  policy requires; nothing is persisted, because a reload could not have
  started the audio anyway.

The engine: a master gain (0.32, 1.5s in, 1.2s out, then the context suspends)
fed by a dry path and a `ConvolverNode` on a 0.22 send whose 2.2s impulse is
generated stereo noise under an exponential decay and a one-pole lowpass. A
look-ahead scheduler (`setInterval` every 100ms, booking every 16th note inside
the next 250ms against `AudioContext.currentTime`) runs 74 BPM with 0.6 swing on
the off-eighths, over an eight-bar progression in F (`Gm9 – C13 – Fmaj9 – Dm9 |
Gm9 – C13 – Fmaj9 – Fmaj9`) that moves up to A flat every sixteen bars. Parts:
a Rhodes (sine plus a triangle an octave up at −14dB, ±4 cents apart, 2.4kHz
lowpass, shared 4.6Hz tremolo) playing rootless voicings either sustained with a
−6dB re-strike or, 30% of bars, as a two-hit stab; an upright-ish bass (triangle
plus sine, 320Hz lowpass) on 1 and 3 with a 40% chance of a passing note; a
brushed kit under a 7kHz lowpass (kick 110→48Hz, swung hats, bandpass brush on 2
and 4); and a sparse melody, every other bar at most and never on the downbeat.
Over the top, vinyl: an 8s noise loop band-limited to 4–9kHz, plus a pop every
0.4–2.5s.
