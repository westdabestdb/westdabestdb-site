/**
 * Regenerate the hover-preview images in `public/static/images/previews/`.
 *
 *   node scripts/previews.mjs                 # re-shoot the live sites, then encode
 *   node scripts/previews.mjs --offline       # skip the browser, use fallbacks only
 *   node scripts/previews.mjs flovi charles   # only these slugs
 *
 * Every file comes out 640×400 (the 240×150 the page shows, at 2×) as webp at
 * quality 80. A slug's source is one of three things, in this order:
 *
 *   url       a live page, captured 1280×800 with the gstack headless browser
 *   git       a retired image, read back out of the repo history with `git show`
 *   file      a file that is still in the working tree
 *
 * `dead` marks a URL that no longer resolves (dead domain, delisted App Store
 * app, moved case study). The URL stays here for the record and the fallback is
 * used without a network round trip; drop the `dead` line to try it again.
 *
 * Screenshots are cover-cropped. App icons (`fit: 'pad'`) are centred on a
 * #f5f5f5 canvas instead, because stretching a square icon to 16:10 mangles it.
 */

import { execFile, execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import sharp from 'sharp'

const run = promisify(execFile)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public/static/images/previews')
// The headless browser only writes inside the repo or /tmp, so the scratch
// directory lives here (gitignored) rather than in the system temp dir.
const CAPTURE_DIR = path.join(ROOT, '.previews-tmp')
const BROWSE = path.join(process.env.HOME ?? '', '.claude/skills/gstack/browse/dist/browse')

/** 2× the 240×150 box the page paints. */
const WIDTH = 640
const HEIGHT = 400
const QUALITY = 80
const VIEWPORT = '1280x800'
/** The commit the old project images were deleted in. */
const OLD_IMAGES = '6d37054:public/static/images/projects'
/** Icon box inside the padded canvas, so every icon reads at one size. */
const ICON = 300
const PAD_BACKGROUND = '#f5f5f5'

const SOURCES = [
  { slug: 'flovi', url: 'https://flovi.io/es' },
  { slug: '4human', url: 'https://4human.no/en/4human-hrm-mobilapplikasjon/' },
  { slug: 'lupasafe', url: 'https://lupasafe.com/' },
  { slug: 'blocklords', url: 'https://blocklords.com/' },
  {
    slug: 'lighthouse',
    url: 'https://seascape.house/',
    dead: 'domain expired, now a for-sale parking page',
    git: `${OLD_IMAGES}/lighthouse.png`,
  },
  {
    slug: 'scape-store',
    url: 'https://scape.store/',
    dead: 'DNS no longer resolves',
    git: `${OLD_IMAGES}/scape-store.png`,
  },
  {
    slug: 'mios',
    url: 'https://www.gardedesign.com/work/mios',
    dead: 'case study 404s',
    git: `${OLD_IMAGES}/mios.avif`,
    position: 'centre',
  },
  {
    slug: 'kustevent',
    url: 'https://apps.apple.com/au/app/kust-event-restaurang/id1561922455/',
    dead: 'app delisted from the App Store',
    git: `${OLD_IMAGES}/kustevent.webp`,
    fit: 'pad',
  },
  { slug: 'painsquad-plus', url: 'https://tacticahealth.com/our-work/painsquad-pain-management-app/' },
  { slug: 'tesla-inventory-bot', file: 'public/static/images/blog/tesla-inventory-bot.jpg' },
  {
    slug: 'netgoals',
    url: 'https://www.netgoals.io/',
    dead: 'DNS no longer resolves',
    git: `${OLD_IMAGES}/netgoals.png`,
  },
  { slug: 'bottom-navigation-bar', url: 'https://github.com/westdabestdb/bubble_bottom_bar' },
  {
    slug: 'bottom-navigation-badge',
    // github.com/westdabestdb/bubble_bottom_badge 404s — the repo is gone.
    git: `${OLD_IMAGES}/bottom-navigation-badge.png`,
    position: 'left',
  },
  { slug: 'ccenv', url: 'https://ccenv.dev' },
  // The hero is position: fixed, so `cleanup --all` sweeps the headline away.
  { slug: 'charles', url: 'https://getcharles.pro', cleanup: '--cookies' },
  {
    slug: 'flutter-background-location-tracker',
    url: 'https://github.com/westdabestdb/flutter-background-location-tracker-fixed',
  },
]

/** One `browse` subcommand. Never throws: a dead site must not stop the run. */
async function browse(args, timeout = 45_000) {
  try {
    const { stdout } = await run(BROWSE, args, { timeout })
    return stdout
  } catch (error) {
    return `browse failed: ${error.message}`
  }
}

/**
 * Shoot one page at 1280×800 and return the PNG path, or null if the page did
 * not answer 200. `--load` only; `--networkidle` times out on heavy sites.
 */
async function capture(entry) {
  const file = path.join(CAPTURE_DIR, `${entry.slug}.png`)
  const status = await browse(['goto', entry.url])
  if (!status.includes('(200)')) return null

  await browse(['wait', '--load'], 25_000)
  // Then wait for the network to go quiet (fonts, hero images, animations) and
  // give client-side intros a few seconds; a timeout here is not fatal.
  await browse(['wait', '--networkidle'], 20_000).catch(() => {})
  await new Promise((resolve) => setTimeout(resolve, 5_000))
  await browse(['cleanup', entry.cleanup ?? '--all'], 20_000)
  await browse(['screenshot', '--viewport', file], 30_000)

  try {
    return statSync(file).size > 0 ? file : null
  } catch {
    return null
  }
}

/** A file that was deleted on purpose — read the bytes straight out of history. */
function fromGit(spec) {
  const file = path.join(CAPTURE_DIR, spec.split('/').pop())
  writeFileSync(file, execFileSync('git', ['show', spec], { cwd: ROOT, maxBuffer: 64 << 20 }))
  return file
}

/** Cover-crop a screenshot, or centre an icon on a flat canvas. */
async function encode(source, entry) {
  const out = path.join(OUT_DIR, `${entry.slug}.webp`)

  if (entry.fit === 'pad') {
    const icon = await sharp(source)
      .flatten({ background: PAD_BACKGROUND })
      .resize(ICON, ICON, { fit: 'inside' })
      .toBuffer()

    await sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 3, background: PAD_BACKGROUND },
    })
      .composite([{ input: icon, gravity: 'centre' }])
      .webp({ quality: QUALITY })
      .toFile(out)
  } else {
    await sharp(source)
      .flatten({ background: '#ffffff' })
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: entry.position ?? 'top' })
      .webp({ quality: QUALITY })
      .toFile(out)
  }

  return statSync(out).size
}

async function main() {
  const offline = process.argv.includes('--offline')
  const only = process.argv.slice(2).filter((argument) => !argument.startsWith('--'))
  const entries = only.length ? SOURCES.filter((e) => only.includes(e.slug)) : SOURCES

  mkdirSync(OUT_DIR, { recursive: true })
  rmSync(CAPTURE_DIR, { recursive: true, force: true })
  mkdirSync(CAPTURE_DIR, { recursive: true })

  if (!offline && entries.some((entry) => entry.url && !entry.dead)) {
    await browse(['viewport', VIEWPORT])
  }

  let total = 0

  for (const entry of entries) {
    let source = null
    let origin = ''

    if (entry.url && !entry.dead && !offline) {
      source = await capture(entry)
      origin = source ? `live ${entry.url}` : `capture failed: ${entry.url}`
    }

    if (!source && entry.git) {
      source = fromGit(entry.git)
      origin = `${origin ? `${origin} → ` : ''}git ${entry.git}`
    }

    if (!source && entry.file) {
      source = path.join(ROOT, entry.file)
      origin = entry.file
    }

    if (!source) {
      console.error(`${entry.slug.padEnd(36)} NO SOURCE  ${origin || entry.dead || ''}`)
      process.exitCode = 1
      continue
    }

    const bytes = await encode(source, entry)
    total += bytes
    console.log(`${entry.slug.padEnd(36)} ${String(Math.round(bytes / 1024)).padStart(4)} KB  ${origin}`)
  }

  rmSync(CAPTURE_DIR, { recursive: true, force: true })
  console.log(`\n${entries.length} files, ${Math.round(total / 1024)} KB total`)
}

// A mistyped slug would otherwise write nothing and exit 0.
const unknown = process.argv
  .slice(2)
  .filter((argument) => !argument.startsWith('--'))
  .filter((slug) => !SOURCES.some((entry) => entry.slug === slug))

if (unknown.length) {
  console.error(`unknown slug: ${unknown.join(', ')}`)
  console.error(`known: ${SOURCES.map((entry) => entry.slug).join(', ')}`)
  process.exit(1)
}

await main()
