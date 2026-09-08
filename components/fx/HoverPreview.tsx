'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** Any row that carries an image. One selector, used for both hover and prefetch. */
const SELECTOR = '[data-preview]'

/** Matches the box `app/fx.css` paints, so the flip/clamp maths is honest. */
const WIDTH = 240
const HEIGHT = 150
/** Gap between the cursor and the image's near edge. */
const OFFSET = 18
/** Never let the image touch the viewport edge. */
const MARGIN = 8
/** Per-frame catch-up. Low enough that the image trails the cursor a little. */
const LERP = 0.18
/** Below this the lerp has arrived; stop burning frames. */
const EPSILON = 0.5

/** On when the pointer is fine and hovering. Reduced motion changes how it moves, not whether. */
function shouldMount(): boolean {
  return window.matchMedia(FINE_POINTER).matches
}

function subscribe(onChange: () => void): () => void {
  const pointer = window.matchMedia(FINE_POINTER)
  pointer.addEventListener('change', onChange)
  return () => pointer.removeEventListener('change', onChange)
}

/** Right of the cursor, vertically centred on it; flips left when there is no room. */
function place(pointerX: number, pointerY: number): { x: number; y: number } {
  const right = pointerX + OFFSET
  const x = right + WIDTH > window.innerWidth - MARGIN ? pointerX - OFFSET - WIDTH : right
  const y = pointerY - HEIGHT / 2

  return {
    x: Math.min(Math.max(x, MARGIN), Math.max(MARGIN, window.innerWidth - WIDTH - MARGIN)),
    y: Math.min(Math.max(y, MARGIN), Math.max(MARGIN, window.innerHeight - HEIGHT - MARGIN)),
  }
}

/**
 * A 240×150 image of the product, floating to the right of the cursor while a
 * project row is hovered. Mounted once in the root layout.
 *
 * Rows opt in with `data-preview="<src>"` (the `preview` prop on `Row`), so the
 * pages stay server components: this listens on `document` and reads the
 * attribute off whatever anchor the pointer entered. One element is kept
 * mounted for the life of the page and only its `src` changes, and the next
 * image is decoded into the cache before the swap, so moving between rows never
 * flashes. The first hover warms every preview on the page.
 *
 * Styling — radius, shadow, timings — is the "Hover preview" block of
 * `app/fx.css`. Nothing here runs on a coarse pointer; under
 * `prefers-reduced-motion: reduce` the image is anchored to the cursor with no
 * trailing and no scale, and the CSS drops the transitions.
 */
export function HoverPreview() {
  const mounted = useSyncExternalStore(subscribe, shouldMount, () => false)
  const boxRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const box = boxRef.current
    const image = imageRef.current
    if (!box || !image) return

    const motion = window.matchMedia(REDUCED_MOTION)

    let frame = 0
    let warmed = false
    /** The src we are currently committed to showing, or null when hidden. */
    let pending: string | null = null
    let pointerX = 0
    let pointerY = 0
    let currentX = 0
    let currentY = 0

    function move(to: { x: number; y: number }) {
      currentX = to.x
      currentY = to.y
      box?.style.setProperty('transform', `translate3d(${to.x}px, ${to.y}px, 0)`)
    }

    function step() {
      frame = 0
      if (!pending) return

      const target = place(pointerX, pointerY)
      const factor = motion.matches ? 1 : LERP
      const next = {
        x: currentX + (target.x - currentX) * factor,
        y: currentY + (target.y - currentY) * factor,
      }
      move(next)

      const settled =
        Math.abs(target.x - next.x) < EPSILON && Math.abs(target.y - next.y) < EPSILON
      if (!settled) frame = requestAnimationFrame(step)
    }

    function onMove(event: PointerEvent) {
      pointerX = event.clientX
      pointerY = event.clientY
      if (!frame && pending) frame = requestAnimationFrame(step)
    }

    /** One `new Image()` per preview on the page, so every later hover is instant. */
    function warm() {
      if (warmed) return
      warmed = true
      const seen = new Set<string>()
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((link) => {
        const src = link.dataset.preview
        if (!src || seen.has(src)) return
        seen.add(src)
        new Image().src = src
      })
    }

    function hide() {
      pending = null
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      document.removeEventListener('pointermove', onMove)
      box?.removeAttribute('data-shown')
    }

    function reveal(src: string) {
      if (!box || !image || pending !== src) return
      if (image.getAttribute('src') !== src) image.setAttribute('src', src)
      // Jump to the cursor before the first paint, then trail from there.
      move(place(pointerX, pointerY))
      box.setAttribute('data-shown', '')
      document.addEventListener('pointermove', onMove, { passive: true })
      if (!frame) frame = requestAnimationFrame(step)
    }

    function show(src: string) {
      if (src === pending) return
      pending = src
      warm()

      // Decode before the swap: the element stays mounted, so an undecoded src
      // would blank the box for a frame.
      const probe = new Image()
      probe.src = src
      if (probe.complete) {
        reveal(src)
        return
      }
      probe.addEventListener('load', () => reveal(src), { once: true })
      probe.addEventListener(
        'error',
        () => {
          if (pending === src) hide()
        },
        { once: true },
      )
    }

    function rowOf(target: EventTarget | null): HTMLElement | null {
      return target instanceof Element ? target.closest<HTMLElement>(SELECTOR) : null
    }

    function onOver(event: PointerEvent) {
      pointerX = event.clientX
      pointerY = event.clientY

      const row = rowOf(event.target)
      const src = row?.dataset.preview
      if (src) show(src)
      else if (pending) hide()
    }

    /** Leaving the row itself — or the window, where no `pointerover` follows. */
    function onOut(event: PointerEvent) {
      const row = rowOf(event.target)
      if (!row || !pending) return

      const next = event.relatedTarget
      if (next instanceof Node && row.contains(next)) return
      hide()
    }

    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('pointermove', onMove)
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <div ref={boxRef} aria-hidden="true" className="hoverprev">
      {/* A plain img on purpose: the files are already exactly 2× the painted
          box, so next/image would only add an optimiser round trip. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imageRef} alt="" width={240} height={150} decoding="async" />
    </div>
  )
}

export default HoverPreview
