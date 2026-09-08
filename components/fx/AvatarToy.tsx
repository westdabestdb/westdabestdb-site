'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { Spring } from '@/lib/spring'
import { play } from './Sounds'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** Below this much travel a press is a click, not a drag. */
const SLOP = 4
/** Fraction of the pull the avatar follows near the middle — a band, not a grab. */
const PULL = 0.55
/** Rubber-band softness. `d * PULL / (1 + d / BAND)` → asymptotic at PULL × BAND. */
const BAND = 220
/** Where the band tops out: ≈121px, approached smoothly and never clamped. */
const CAP = PULL * BAND
/** Stretch along the drag axis at the far end of the band. */
const STRETCH_X = 0.22
const SQUASH_Y = 0.1
/** One full turn on click. */
const SPIN_MS = 700
const SPIN_EASE = 'cubic-bezier(.2, .7, .2, 1)'

/**
 * Makes the home-page avatar a toy. Wraps the `next/image` picture — the photo
 * itself is untouched; this only adds behaviour, a `rotate` on the image and a
 * `transform` on the wrapper.
 *
 * - **Click** (press and release without moving more than 4px): the image
 *   turns 360° once over 700ms through the Web Animations API, animating the
 *   independent `rotate` property on the *image* while the drag owns
 *   `transform` on the *wrapper* — two different properties on two different
 *   elements, so a spin and a drag can never fight over one value. Plus the
 *   "pop" sound.
 * - **Drag**: `setPointerCapture` on the wrapper at pointerdown, and
 *   move/up/cancel are listened for on `document` as well, so a fast drag that
 *   outruns the 64px box keeps tracking and a release anywhere still lands.
 *   Displacement is always measured from the pointerdown origin, never
 *   accumulated, and softened by `d × 0.55 / (1 + d / 220)`: ~0.55 of the pull
 *   near the middle, easing to ≈121px however hard you throw it. The wrapper
 *   stretches along the drag axis (rotate to the angle, scale, rotate back) up
 *   to `scaleX 1.22` / `scaleY .9`. Every transform is written from the rAF
 *   loop, never straight out of an event. Release springs it home on the
 *   shared `Spring` at k .18 / d .74, which overshoots visibly, plus the "up"
 *   sound.
 *
 * `dragstart` is cancelled (on top of `draggable={false}` and
 * `-webkit-user-drag: none`), or the browser's own image-drag ghost would take
 * over a few pixels in and the wrapper would stop seeing pointermoves. Nothing
 * here calls `preventDefault` on `pointerdown`, so pointer capture, the click
 * ripple and the custom cursor's mode switching all behave normally.
 *
 * The avatar is not focusable, so keyboard users see no change at all, and
 * under `prefers-reduced-motion: reduce` neither gesture does anything: the
 * picture just sits there. Layout — the 64px box, `touch-action`,
 * `user-select` — is the "Avatar toy" block of `app/fx.css`.
 */
export function AvatarToy({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const motion = window.matchMedia(REDUCED_MOTION)
    const home = new Spring(0.18, 0.74)

    let frame = 0
    let last = 0
    /** 'drag' writes the live offset; 'return' runs the spring back to zero. */
    let phase: 'idle' | 'drag' | 'return' = 'idle'
    let active = -1
    let dragging = false
    let originX = 0
    let originY = 0
    /** The offset the loop paints, the drag angle, and 0..1 "how stretched". */
    let dx = 0
    let dy = 0
    let angle = 0
    let amount = 0

    function paint(offsetX: number, offsetY: number, stretch: number) {
      if (!el) return
      if (Math.abs(offsetX) < 0.05 && Math.abs(offsetY) < 0.05 && stretch < 0.001) {
        el.style.transform = ''
        return
      }
      const sx = 1 + STRETCH_X * stretch
      const sy = 1 - SQUASH_Y * stretch
      el.style.transform =
        `translate3d(${offsetX}px, ${offsetY}px, 0) ` +
        `rotate(${angle}deg) scale(${sx}, ${sy}) rotate(${-angle}deg)`
    }

    /** The only place `style.transform` is written. */
    function loop(now: number) {
      frame = 0
      if (phase === 'drag') {
        paint(dx, dy, amount)
        return
      }
      if (phase !== 'return') return

      const dt = last ? Math.min(2, (now - last) / 16.7) : 1
      last = now
      const busy = home.step(dt)
      const s = home.x
      paint(dx * s, dy * s, amount * Math.min(1, Math.abs(s)))

      if (busy) {
        frame = requestAnimationFrame(loop)
      } else {
        last = 0
        phase = 'idle'
        dx = 0
        dy = 0
        amount = 0
        paint(0, 0, 0)
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(loop)
    }

    function spin() {
      const image = el?.querySelector('img') ?? el?.firstElementChild
      if (!image || typeof image.animate !== 'function') return
      // `rotate`, not `transform`: the wrapper's transform stays untouched.
      image.animate([{ rotate: '0deg' }, { rotate: '360deg' }], {
        duration: SPIN_MS,
        easing: SPIN_EASE,
      })
    }

    function stopSpin() {
      const image = el?.querySelector('img') ?? el?.firstElementChild
      if (image && typeof image.getAnimations === 'function') {
        image.getAnimations().forEach((animation) => animation.cancel())
      }
    }

    function onDragStart(event: Event) {
      // Without this the native image drag hijacks the gesture a few px in.
      event.preventDefault()
    }

    function onDown(event: PointerEvent) {
      if (event.button !== 0 || motion.matches) return
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      last = 0
      phase = 'idle'
      active = event.pointerId
      dragging = false
      originX = event.clientX
      originY = event.clientY
      try {
        el?.setPointerCapture(event.pointerId)
      } catch {
        // No live pointer with that id (synthetic events); the document
        // listeners below still carry the drag.
      }
      // Follow the pointer wherever it goes, capture or no capture.
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
      document.addEventListener('pointercancel', onCancel)
    }

    function release(pointerId: number) {
      active = -1
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
      try {
        if (el?.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId)
      } catch {
        // Already released.
      }
    }

    function onMove(event: PointerEvent) {
      if (event.pointerId !== active) return
      // Always from the origin, never accumulated per event.
      const rawX = event.clientX - originX
      const rawY = event.clientY - originY
      const raw = Math.hypot(rawX, rawY)

      if (!dragging) {
        if (raw < SLOP) return
        dragging = true
        phase = 'drag'
        // A spin still turning would keep the photo spinning under the drag.
        stopSpin()
      }

      // Rubber band: ~0.55 of the pull near the middle, easing to CAP.
      const reach = (raw * PULL) / (1 + raw / BAND)
      dx = (rawX / raw) * reach
      dy = (rawY / raw) * reach
      amount = Math.min(1, reach / CAP)
      angle = (Math.atan2(rawY, rawX) * 180) / Math.PI
      schedule()
    }

    function onUp(event: PointerEvent) {
      if (event.pointerId !== active) return
      release(event.pointerId)

      if (!dragging) {
        spin()
        play('pop')
        return
      }
      dragging = false
      play('up')

      // Springs from "all the way out" back to home, overshooting past it.
      phase = 'return'
      last = 0
      home.x = 1
      home.v = 0
      home.t = 0
      schedule()
    }

    function onCancel(event: PointerEvent) {
      if (event.pointerId !== active) return
      release(event.pointerId)
      if (!dragging) return
      dragging = false
      phase = 'return'
      last = 0
      home.x = 1
      home.v = 0
      home.t = 0
      schedule()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('dragstart', onDragStart)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('dragstart', onDragStart)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
      el.style.transform = ''
    }
  }, [])

  return (
    <div ref={ref} className="avatar-toy">
      {children}
    </div>
  )
}

export default AvatarToy
