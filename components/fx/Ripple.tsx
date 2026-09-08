'use client'

import { useEffect } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** Never more than this many impacts on screen at once. */
const MAX_LIVE = 6

/** Six dashes at 60°, each 7 long starting 10 from the centre of a 48×48 box. */
const SPOKES = [0, 60, 120, 180, 240, 300]

/**
 * One impact, as markup. Parsed once into a template and cloned per click, so
 * a burst of clicks builds nothing but clones. `overflow: visible` (in the CSS)
 * lets the dashes fly past the 48px box out to radius 30.
 */
const MARKUP =
  '<svg class="impact" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">' +
  '<circle class="imp-ring" cx="24" cy="24" r="17"></circle>' +
  SPOKES.map(
    (angle) =>
      `<g transform="rotate(${angle} 24 24)">` +
      '<line class="imp-dash" x1="24" y1="14" x2="24" y2="7"></line>' +
      '</g>',
  ).join('') +
  '</svg>'

/**
 * A comic impact at every click, drawn in the custom cursor's own ink so it
 * reads as the same hand: a ring that pops out with a little overshoot and six
 * short radial dashes that fly away and shrink to nothing. Mounted once in the
 * root layout; it renders nothing itself and appends one throwaway inline
 * `<svg class="impact">` to `<body>` per primary-button `pointerdown`,
 * removing it again on the ring's `animationend`.
 *
 * The ring is a stroke on a transient, `pointer-events: none` element that
 * holds no content and is gone in 360ms — the agreed second exception to the
 * "no borders, no rings" rule, next to the hover preview's shadow. Colours are
 * `--cur-line` (with `--p` as the fallback, so the block survives the cursor
 * block being deleted), which swaps on the dark theme like the cursor does.
 *
 * Nothing is created under `prefers-reduced-motion: reduce`. Geometry and
 * timing are the "Click impact" block of `app/fx.css`.
 */
export function Ripple() {
  useEffect(() => {
    const motion = window.matchMedia(REDUCED_MOTION)
    const live: SVGSVGElement[] = []

    // The HTML parser puts `<svg>` into foreign content, so these come out as
    // real SVG elements. Built here, not at module scope, because this module
    // is also evaluated on the server.
    const stencil = document.createElement('div')
    stencil.innerHTML = MARKUP
    const template = stencil.firstElementChild
    if (!(template instanceof SVGSVGElement)) return

    function drop(node: SVGSVGElement) {
      const at = live.indexOf(node)
      if (at !== -1) live.splice(at, 1)
      node.remove()
    }

    function onDown(event: PointerEvent) {
      if (event.button !== 0 || motion.matches) return

      // Cap the live count: the oldest impact goes early rather than piling up.
      while (live.length >= MAX_LIVE) {
        const oldest = live[0]
        if (!oldest) break
        drop(oldest)
      }

      const node = template!.cloneNode(true) as SVGSVGElement
      node.style.left = `${event.clientX}px`
      node.style.top = `${event.clientY}px`
      // The ring is the longest of the two animations, so it says when we are done.
      node.querySelector('.imp-ring')?.addEventListener('animationend', () => drop(node), {
        once: true,
      })

      document.body.appendChild(node)
      live.push(node)
    }

    document.addEventListener('pointerdown', onDown, { passive: true })

    return () => {
      document.removeEventListener('pointerdown', onDown)
      for (const node of live.splice(0)) node.remove()
    }
  }, [])

  return null
}

export default Ripple
