'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'

import { Spring } from '@/lib/spring'

const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** Anything you can click. Checked first, so a `span` inside a link is a link. */
const LINK = 'a, button, select, [role="button"], label'
/** Anything you can read. Only reached when the target is not inside a link. */
const TEXT = 'p, h1, h2, h3, li, blockquote, pre, code, td, th, time, span'

type Mode = 'default' | 'link' | 'text'

/**
 * Where the pointer sits inside each drawing, in CSS pixels of the rendered
 * SVG: the arrow's tip, the hand's fingertip, the I-beam's centre. The wrapper
 * is translated so this point lands exactly on the pointer, and the drawing
 * rotates and squashes around it.
 */
const HOTSPOT: Record<Mode, { x: number; y: number }> = {
  default: { x: 6, y: 4 },
  link: { x: 13, y: 1 },
  text: { x: 7, y: 15 },
}

/** Degrees of lean at full speed. */
const MAX_TILT = 22
/** Velocity → tilt. Velocity is in px per pointer event, smoothed. */
const TILT_GAIN = 1.6
/** Per-frame velocity decay at 60fps, so the lean eases back once you stop. */
const DECAY = 0.82
/** Horizontal stretch while moving fast. */
const MAX_STRETCH = 0.12
const STRETCH_GAIN = 0.006
/** How far the drawing squashes while a button is held. */
const SQUASH_X = 0.14
const SQUASH_Y = 0.22

/* -------------------------------------------------------------- the drawings */

const ARROW_D = 'M5 3.5 L5 24.5 L10.4 19.6 L14 27.8 L17.8 26.1 L14.3 18 L21.3 17.6 Z'
const HAND_D =
  'M10.5 4.5a3 3 0 0 1 6 0V17h1.4v-3a2.5 2.5 0 0 1 5 0v3.4h1.4v-1.8a2.5 2.5 0 0 1 5 0v2.4h1.4v-.6a2.5 2.5 0 0 1 5 0V25a10.5 10.5 0 0 1-10.5 10.5h-5.4c-3.3 0-5.9-1.3-7.8-3.5L2.7 25.5a2.7 2.7 0 0 1 4-3.6l3.8 4.1Z'
const HAND_LINES_D = 'M16.5 17v-2.2M22.9 17.4v-1.6M29.3 18v-1.2'
const BEAM_D = 'M3 3h8M7 3v24M3 27h8'

/** The arrow. */
function ArrowDrawing({ svgRef }: { svgRef?: RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={svgRef} className="cur-arrow" width="30" height="38" viewBox="0 0 24 30">
      <path className="body" d={ARROW_D} strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  )
}

/** The pointing hand. */
function HandDrawing({ svgRef }: { svgRef?: RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={svgRef} className="cur-hand" width="38" height="38" viewBox="0 0 38 38">
      <path className="body" d={HAND_D} strokeWidth="2.4" strokeLinejoin="round" />
      <path className="line" d={HAND_LINES_D} fill="none" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** On for a fine, hovering pointer. Reduced motion changes how it moves, not whether. */
function shouldMount(): boolean {
  return window.matchMedia(FINE_POINTER).matches
}

function subscribe(onChange: () => void): () => void {
  const pointer = window.matchMedia(FINE_POINTER)
  pointer.addEventListener('change', onChange)
  return () => pointer.removeEventListener('change', onChange)
}

function modeOf(target: EventTarget | null): Mode {
  if (!(target instanceof Element)) return 'default'
  if (target.closest(LINK)) return 'link'
  if (target.closest(TEXT)) return 'text'
  return 'default'
}

/**
 * The site's own cursor: a comic arrow with a thick outline. It sits exactly
 * on the pointer (a lagging cursor feels broken) but leans into the
 * direction it is moving, stretches a little at speed, and squashes on
 * click — all on damped springs, so nothing snaps. Over a link it becomes a
 * pointing hand, over text a rounded I-beam.
 *
 * Mounted once in the root layout, next to `HoverPreview`, and
 * only for a fine hovering pointer: touch and no-JS keep the native cursor,
 * because `cursor: none` hangs off the `has-cursor` class this component puts
 * on `<html>` while it is alive. Under `prefers-reduced-motion: reduce` the
 * drawing still follows, with no tilt, stretch or squash.
 *
 * Colours and sizes live in the "Custom cursor" block of `app/fx.css`; this
 * file only writes `data-mode` and the transforms.
 */
export function Cursor() {
  const mounted = useSyncExternalStore(subscribe, shouldMount, () => false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<SVGSVGElement>(null)
  const handRef = useRef<SVGSVGElement>(null)
  const beamRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const arrow = arrowRef.current
    const hand = handRef.current
    const beam = beamRef.current
    if (!wrap || !arrow || !hand || !beam) return

    // Hide the native cursor only while ours exists. The class is the whole
    // switch: no JS, no fine pointer, no `has-cursor`, native arrow.
    const root = document.documentElement
    root.classList.add('has-cursor')

    const motion = window.matchMedia(REDUCED_MOTION)

    let frame = 0
    let lastTime = 0
    let live = false
    let mode: Mode = 'default'
    let pressed = false
    let x = 0
    let y = 0
    let px = 0
    let py = 0
    let vx = 0
    let vy = 0
    const tilt = new Spring(0.16, 0.72)
    const squash = new Spring(0.28, 0.62)

    function paint(now: number) {
      frame = 0
      const dt = lastTime ? Math.min(2, (now - lastTime) / 16.7) : 1
      lastTime = now

      const still = motion.matches
      if (still) {
        vx = 0
        vy = 0
        tilt.t = 0
        squash.t = 0
        tilt.snap()
        squash.snap()
      } else {
        const decay = Math.pow(DECAY, dt)
        vx *= decay
        vy *= decay
        tilt.t = Math.max(-MAX_TILT, Math.min(MAX_TILT, vx * TILT_GAIN))
        squash.t = pressed ? 1 : 0
      }

      const tiltBusy = tilt.step(dt)
      const squashBusy = squash.step(dt)

      const stretch = still ? 0 : Math.min(MAX_STRETCH, Math.abs(vx) * STRETCH_GAIN)
      const sx = 1 - SQUASH_X * squash.x + stretch
      const sy = 1 - SQUASH_Y * squash.x

      const hot = HOTSPOT[mode]
      wrap!.style.transform = `translate3d(${x - hot.x}px, ${y - hot.y}px, 0)`
      const lean = mode === 'text' ? 0 : tilt.x
      const inner = `rotate(${lean}deg) scale(${sx}, ${sy})`
      arrow!.style.transform = inner
      hand!.style.transform = inner
      beam!.style.transform = `scale(${sx}, ${sy})`

      if (tiltBusy || squashBusy || Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
        frame = requestAnimationFrame(paint)
      } else {
        lastTime = 0
      }
    }

    function tick() {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    function show() {
      if (!live) {
        live = true
        vx = 0
        vy = 0
        px = x
        py = y
      }
      wrap?.setAttribute('data-shown', '')
    }

    function hide() {
      live = false
      wrap?.removeAttribute('data-shown')
    }

    function onMove(event: PointerEvent) {
      const nx = event.clientX
      const ny = event.clientY
      if (live) {
        // Smooth the per-event delta so a jittery mouse does not twitch the lean.
        vx = vx * 0.5 + (nx - px) * 0.5
        vy = vy * 0.5 + (ny - py) * 0.5
      }
      px = nx
      py = ny
      x = nx
      y = ny
      show()
      tick()
    }

    function setMode(next: Mode) {
      if (next === mode) return
      mode = next
      wrap?.setAttribute('data-mode', mode)
      tick()
    }

    function onOver(event: PointerEvent) {
      x = event.clientX
      y = event.clientY
      setMode(modeOf(event.target))
    }

    function onDown() {
      pressed = true
      tick()
    }

    function onUp() {
      pressed = false
      tick()
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointercancel', onUp, { passive: true })
    document.addEventListener('pointerleave', hide)
    window.addEventListener('mouseleave', hide)
    window.addEventListener('blur', onUp)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      root.classList.remove('has-cursor')
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      document.removeEventListener('pointerleave', hide)
      window.removeEventListener('mouseleave', hide)
      window.removeEventListener('blur', onUp)
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <div ref={wrapRef} className="cur" data-mode="default" aria-hidden="true">
      <ArrowDrawing svgRef={arrowRef} />
      <HandDrawing svgRef={handRef} />
      <svg ref={beamRef} className="cur-beam" width="14" height="30" viewBox="0 0 14 30">
        <path className="line" d={BEAM_D} fill="none" strokeWidth="3.4" strokeLinecap="round" />
        <path className="core" d={BEAM_D} fill="none" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default Cursor
