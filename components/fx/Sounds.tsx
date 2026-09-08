'use client'

import { useEffect, useSyncExternalStore } from 'react'

export const SOUND_STORAGE_KEY = 'sound'

/** The hover tick is a mouse thing: a fingertip has no "moving onto" moment. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
/** Same set the custom cursor shows its pointing hand over. */
const HOVER_TARGET = 'a, button, select, [role="button"], label'
/** Never tick more often than this, however fast you sweep a list. */
const HOVER_GAP = 70

/* ------------------------------------------------------------------ store */

const listeners = new Set<() => void>()

function readEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function writeEnabled(on: boolean): void {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Storage unavailable; the choice just will not persist.
  }
  listeners.forEach((fn) => fn())
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

/* ------------------------------------------------------------------ synth */

/** Everything is synthesised: no audio files, nothing to download. */
let context: AudioContext | null = null
let master: GainNode | null = null

/**
 * Created lazily on the first sound. A click is a gesture and the context
 * starts running; a hover is not, so the first hover before any click leaves
 * it suspended and silent — `resume()` then settles on the next real gesture,
 * and its rejection (Safari) is swallowed rather than left unhandled.
 */
function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor = window.AudioContext
    if (!Ctor) return null
    context = new Ctor()
    master = context.createGain()
    master.gain.value = 0.5
    master.connect(context.destination)
  }
  if (context.state === 'suspended') void context.resume().catch(() => {})
  return context
}

/** A short burst of filtered noise: the "click" texture. */
function noise(ctx: AudioContext, seconds: number, gain: number, filter: BiquadFilterType, hz: number) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const biquad = ctx.createBiquadFilter()
  biquad.type = filter
  biquad.frequency.value = hz
  const env = ctx.createGain()
  const t = ctx.currentTime
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
  source.connect(biquad).connect(env).connect(master!)
  source.start(t)
  source.stop(t + seconds)
}

/** A sine that drops in pitch: the "thock" body under the click. */
function tone(ctx: AudioContext, from: number, to: number, seconds: number, gain: number) {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  const env = ctx.createGain()
  const t = ctx.currentTime
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + seconds)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.004)
  env.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
  osc.connect(env).connect(master!)
  osc.start(t)
  osc.stop(t + seconds)
}

const sounds = {
  /** Mouse button down: a soft mechanical thock. */
  down() {
    const ctx = ensureContext()
    if (!ctx) return
    noise(ctx, 0.028, 0.16, 'lowpass', 1400)
    tone(ctx, 190, 120, 0.05, 0.14)
  },
  /** Mouse button up: a lighter, higher tick. */
  up() {
    const ctx = ensureContext()
    if (!ctx) return
    noise(ctx, 0.018, 0.1, 'highpass', 2200)
    tone(ctx, 320, 240, 0.03, 0.06)
  },
  /** Pointer moving onto a link: the lightest, shortest tick of the set. */
  hover() {
    const ctx = ensureContext()
    if (!ctx) return
    noise(ctx, 0.01, 0.045, 'highpass', 3500)
    tone(ctx, 900, 700, 0.014, 0.03)
  },
  /** Theme switch: a small pop. */
  pop() {
    const ctx = ensureContext()
    if (!ctx) return
    tone(ctx, 560, 280, 0.09, 0.16)
  },
}

/**
 * Play one of the three sounds from anywhere in the app. Reads the same
 * `localStorage.sound` flag the footer toggle writes, so a muted visitor stays
 * muted, and goes through `ensureContext`, so the AudioContext is still only
 * created inside a user gesture. Used by `components/fx/AvatarToy.tsx`.
 */
export function play(name: 'down' | 'up' | 'pop' | 'hover'): void {
  if (!readEnabled()) return
  sounds[name]()
}

/* --------------------------------------------------------------- component */

/**
 * Click sounds. Mounted once in the root layout. Listens on `document` for
 * primary-button presses and releases, for the pointer arriving on something
 * clickable, and for theme changes, and plays tiny synthesised sounds through
 * Web Audio. Off when the footer toggle says so (`localStorage.sound ===
 * 'off'`).
 *
 * The hover tick is fine-pointer only, fires at most once per 70ms, and keys
 * off the closest `a, button, select, [role=button], label` — so moving
 * between the words inside one link is silent, while leaving it and coming
 * back ticks again. Nothing is audible until the visitor's first real gesture:
 * a hover before that leaves the AudioContext suspended.
 */
export function Sounds() {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true)

  useEffect(() => {
    if (!enabled) return

    function onDown(event: PointerEvent) {
      if (event.button !== 0) return
      sounds.down()
    }
    function onUp(event: PointerEvent) {
      if (event.button !== 0) return
      sounds.up()
    }

    /* A tactile tick when the pointer arrives on something clickable. The
       "last" element is the link itself, not whatever span the pointer
       entered, so sliding across the words inside one link stays silent. */
    const fine = window.matchMedia(FINE_POINTER)
    let lastHover: Element | null = null
    let lastTick = 0

    function onOver(event: PointerEvent) {
      if (!fine.matches) return
      const target =
        event.target instanceof Element ? event.target.closest(HOVER_TARGET) : null
      if (!target || target === lastHover) return
      lastHover = target

      const now = performance.now()
      if (now - lastTick < HOVER_GAP) return
      lastTick = now
      sounds.hover()
    }

    /** Left the element for something outside it, so entering it again ticks. */
    function onOut(event: PointerEvent) {
      if (!lastHover) return
      const from = event.target
      if (!(from instanceof Node) || !lastHover.contains(from)) return
      const to = event.relatedTarget
      if (to instanceof Node && lastHover.contains(to)) return
      lastHover = null
    }

    let lastTheme = document.documentElement.getAttribute('data-theme')
    const observer = new MutationObserver(() => {
      const next = document.documentElement.getAttribute('data-theme')
      if (next !== lastTheme) {
        lastTheme = next
        sounds.pop()
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      observer.disconnect()
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
    }
  }, [enabled])

  return null
}

/** Footer control: plain text like the theme toggle. "Sound" when on, "Muted" when off. */
export function SoundToggle() {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true)

  function toggle() {
    const next = !enabled
    writeEnabled(next)
    // Confirm the new state audibly only when turning on; silence when muting.
    if (next) sounds.up()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute click sounds' : 'Turn click sounds on'}
    >
      {enabled ? 'Sound' : 'Muted'}
    </button>
  )
}

export default Sounds
