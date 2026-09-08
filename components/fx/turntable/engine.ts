/**
 * Generative lo-fi jazz, synthesised on the fly. No files, no dependencies.
 *
 * Everything below is built lazily inside `play()` — the first call happens in
 * a click handler, which is what the autoplay policy requires — and torn down
 * again by `dispose()`. Nothing is persisted: a reload starts silent, because
 * a reload could not have started the audio anyway.
 *
 * Signal flow
 *
 *   rhodes ─┬─────────────┐
 *   lead   ─┤             │
 *           └─ send(.22) ─┼─ convolver ─┐
 *   bass ─────────────────┤             ├─ master ─ destination
 *   drums ─ lowpass 7k ───┤             │
 *   vinyl ────────────────┴─── dry ─────┘
 *
 * The parts are written by a look-ahead scheduler: a 100ms `setInterval` walks
 * every 16th note whose `AudioContext.currentTime` falls inside the next 250ms
 * and books it with sample-accurate automation, so a throttled timer never
 * shifts the groove.
 */

/* ----------------------------------------------------------------- tempo */

const BPM = 74
const BEAT = 60 / BPM
const BAR = BEAT * 4
/** Off-eighths land 60% of the way through the beat, not halfway. */
const SWING = 0.6
/** Fraction of a beat for the four 16ths of that beat, swing applied. */
const OFFSETS = [0, SWING / 2, SWING, SWING + (1 - SWING) / 2] as const

const TICK_MS = 100
const AHEAD = 0.25

const MASTER_TARGET = 0.32
const FADE_IN = 1.5
const FADE_OUT = 1.2

/* ----------------------------------------------------------------- notes */

type Chord = {
  /** Bass register, MIDI 38–52. */
  root: number
  /** Rootless Rhodes voicing, MIDI 55–76. */
  voicing: readonly number[]
  /** Melody pool: the chord's pentatonic, MIDI 72–84. */
  mel: readonly number[]
  /** 10 for minor and dominant sevenths, 11 for a major seventh. */
  seventh: number
}

const Gm9: Chord = { root: 43, voicing: [58, 62, 65, 69], mel: [72, 74, 77, 79, 82, 84], seventh: 10 }
const C13: Chord = { root: 48, voicing: [58, 64, 69, 74], mel: [72, 74, 76, 79, 81], seventh: 10 }
const Fmaj9: Chord = { root: 41, voicing: [60, 64, 67, 69], mel: [72, 74, 77, 79, 81, 84], seventh: 11 }
const Dm9: Chord = { root: 50, voicing: [60, 65, 69, 74], mel: [72, 74, 77, 79, 81], seventh: 10 }

const Bbm9: Chord = { root: 46, voicing: [61, 65, 68, 72], mel: [73, 75, 77, 80, 82], seventh: 10 }
const Eb13: Chord = { root: 51, voicing: [61, 65, 67, 72], mel: [73, 77, 79, 82, 84], seventh: 10 }
const Abmaj9: Chord = { root: 44, voicing: [60, 63, 67, 70], mel: [75, 77, 80, 82, 84], seventh: 11 }
const Fm9: Chord = { root: 41, voicing: [60, 63, 68, 72], mel: [75, 77, 80, 82, 84], seventh: 10 }

/** Eight bars, one chord each. Sixteen bars in, the whole thing moves up to A flat. */
const KEYS: readonly (readonly Chord[])[] = [
  [Gm9, C13, Fmaj9, Dm9, Gm9, C13, Fmaj9, Fmaj9],
  [Bbm9, Eb13, Abmaj9, Fm9, Bbm9, Eb13, Abmaj9, Abmaj9],
]

function mtof(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Fold a bass note back into the register the bass patch is voiced for. */
function fold(midi: number): number {
  let m = midi
  while (m > 52) m -= 12
  while (m < 38) m += 12
  return m
}

function pick<T>(list: readonly T[]): T | undefined {
  return list[Math.floor(Math.random() * list.length)]
}

/* --------------------------------------------------------------- buffers */

/** Flat white noise, reused by every hat, brush, hiss and pop. */
function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/**
 * The reverb tail: 2.2s of stereo noise under an exponential decay, run
 * through a one-pole lowpass so the room is dark rather than glassy. Built
 * once, in about 200k multiplies — cheap enough to sit inside the click.
 */
function impulse(ctx: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * 2.2))
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    let last = 0
    for (let i = 0; i < length; i++) {
      last += 0.28 * (Math.random() * 2 - 1 - last)
      data[i] = last * 3 * Math.exp((-4.5 * i) / length)
    }
  }
  return buffer
}

/* ----------------------------------------------------------------- graph */

type Rig = {
  ctx: AudioContext
  master: GainNode
  dry: GainNode
  send: GainNode
  rhodes: GainNode
  lead: GainNode
  bass: GainNode
  drums: GainNode
  noise: AudioBuffer
}

function build(): Rig | null {
  const Ctor = window.AudioContext
  if (!Ctor) return null
  const ctx = new Ctor()

  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  const dry = ctx.createGain()
  dry.connect(master)

  const convolver = ctx.createConvolver()
  convolver.buffer = impulse(ctx)
  convolver.connect(master)

  const send = ctx.createGain()
  send.gain.value = 0.22
  send.connect(convolver)

  // Rhodes and melody are the only parts that get the room.
  const rhodes = ctx.createGain()
  rhodes.connect(dry)
  rhodes.connect(send)

  const lead = ctx.createGain()
  lead.connect(dry)
  lead.connect(send)

  // One shared tremolo on the Rhodes bus: ±12% at 4.6Hz around unity.
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 4.6
  const depth = ctx.createGain()
  depth.gain.value = 0.12
  lfo.connect(depth).connect(rhodes.gain)
  lfo.start()

  const bass = ctx.createGain()
  bass.connect(dry)

  // Everything percussive goes through one lowpass so the kit stays brushed.
  const kitTone = ctx.createBiquadFilter()
  kitTone.type = 'lowpass'
  kitTone.frequency.value = 7000
  kitTone.connect(dry)
  const drums = ctx.createGain()
  drums.connect(kitTone)

  const noise = noiseBuffer(ctx, 8)

  // Vinyl hiss: one 8s loop, band-limited to the surface-noise window.
  const hiss = ctx.createBufferSource()
  hiss.buffer = noise
  hiss.loop = true
  const hissHigh = ctx.createBiquadFilter()
  hissHigh.type = 'highpass'
  hissHigh.frequency.value = 4000
  const hissLow = ctx.createBiquadFilter()
  hissLow.type = 'lowpass'
  hissLow.frequency.value = 9000
  const hissGain = ctx.createGain()
  hissGain.gain.value = 0.035
  hiss.connect(hissHigh).connect(hissLow).connect(hissGain).connect(dry)
  hiss.start()

  return { ctx, master, dry, send, rhodes, lead, bass, drums, noise }
}

/* ---------------------------------------------------------------- voices */

/** Where an exponential decay from `peak` towards `peak × sustain` has got to. */
function decayed(peak: number, sustain: number, elapsed: number, decay: number): number {
  const k = Math.min(1, Math.max(0, elapsed / decay))
  return Math.max(0.0002, peak * Math.pow(sustain, k))
}

/**
 * One Rhodes note: a sine at the fundamental and a triangle an octave up at
 * −14dB, detuned four cents in opposite directions so the pair beats slowly.
 */
function rhodes(rig: Rig, midi: number, at: number, peak: number, hold: number): void {
  const { ctx } = rig
  const hz = mtof(midi)

  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 2400
  tone.Q.value = 0.7

  const env = ctx.createGain()
  tone.connect(env).connect(rig.rhodes)

  const body = ctx.createOscillator()
  body.type = 'sine'
  body.frequency.value = hz
  body.detune.value = 4
  body.connect(tone)

  const bell = ctx.createOscillator()
  bell.type = 'triangle'
  bell.frequency.value = hz * 2
  bell.detune.value = -4
  const bellGain = ctx.createGain()
  bellGain.gain.value = 0.2
  bell.connect(bellGain).connect(tone)

  const attack = 0.006
  const decay = 0.9
  const sustain = 0.35
  const release = 0.6
  const off = at + Math.max(attack + 0.03, hold)

  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(peak, at + attack)
  env.gain.exponentialRampToValueAtTime(peak * sustain, at + attack + decay)
  // The decay is cut short by hand rather than by a stray `setValueAtTime`
  // landing mid-ramp, which would bend the curve instead of leaving it.
  env.gain.setValueAtTime(decayed(peak, sustain, off - at - attack, decay), off)
  env.gain.exponentialRampToValueAtTime(0.0001, off + release)

  body.start(at)
  bell.start(at)
  body.stop(off + release + 0.05)
  bell.stop(off + release + 0.05)
}

/** Upright-ish bass: triangle and sine together under a 320Hz lowpass. */
function bass(rig: Rig, midi: number, at: number, hold: number): void {
  const { ctx } = rig
  const hz = mtof(midi)

  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 320

  const env = ctx.createGain()
  tone.connect(env).connect(rig.bass)

  const saw = ctx.createOscillator()
  saw.type = 'triangle'
  saw.frequency.value = hz
  saw.connect(tone)

  const sub = ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = hz
  const subGain = ctx.createGain()
  subGain.gain.value = 0.7
  sub.connect(subGain).connect(tone)

  const peak = 0.5
  const attack = 0.008
  const decay = 0.45
  const sustain = 0.3
  const release = 0.2
  const off = at + Math.max(attack + 0.03, hold)

  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(peak, at + attack)
  env.gain.exponentialRampToValueAtTime(peak * sustain, at + attack + decay)
  env.gain.setValueAtTime(decayed(peak, sustain, off - at - attack, decay), off)
  env.gain.exponentialRampToValueAtTime(0.0001, off + release)

  saw.start(at)
  sub.start(at)
  saw.stop(off + release + 0.05)
  sub.stop(off + release + 0.05)
}

/** Kick: a sine dropping 110Hz to 48Hz in 140ms. */
function kick(rig: Rig, at: number, peak: number): void {
  const { ctx } = rig
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(110, at)
  osc.frequency.exponentialRampToValueAtTime(48, at + 0.14)

  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(peak, at + 0.006)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.14)

  osc.connect(env).connect(rig.drums)
  osc.start(at)
  osc.stop(at + 0.16)
}

/** One filtered burst out of the shared noise loop: hats, brushes and pops. */
function burst(
  rig: Rig,
  destination: AudioNode,
  at: number,
  type: BiquadFilterType,
  hz: number,
  q: number,
  seconds: number,
  peak: number,
): void {
  const { ctx } = rig
  const source = ctx.createBufferSource()
  source.buffer = rig.noise

  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = hz
  filter.Q.value = q

  const env = ctx.createGain()
  env.gain.setValueAtTime(peak, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + seconds)

  source.connect(filter).connect(env).connect(destination)
  const offset = Math.random() * Math.max(0.01, rig.noise.duration - seconds - 0.05)
  source.start(at, offset, seconds + 0.03)
}

/** Melody: sine with a little triangle on top, through the room. */
function lead(rig: Rig, midi: number, at: number, seconds: number): void {
  const { ctx } = rig
  const hz = mtof(midi)

  const env = ctx.createGain()
  env.connect(rig.lead)

  const body = ctx.createOscillator()
  body.type = 'sine'
  body.frequency.value = hz
  body.connect(env)

  const edge = ctx.createOscillator()
  edge.type = 'triangle'
  edge.frequency.value = hz
  const edgeGain = ctx.createGain()
  edgeGain.gain.value = 0.25
  edge.connect(edgeGain).connect(env)

  const peak = 0.16
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(peak, at + 0.012)
  env.gain.setValueAtTime(peak, at + seconds)
  env.gain.exponentialRampToValueAtTime(0.0001, at + seconds + 0.25)

  body.start(at)
  edge.start(at)
  body.stop(at + seconds + 0.3)
  edge.stop(at + seconds + 0.3)
}

/* ------------------------------------------------------------------ plan */

type MelodyNote = { midi: number; long: boolean }

type BarPlan = {
  chord: Chord
  /** Chord stabbed on 1 and the "and" of 2, rather than held from 1. */
  twoHit: boolean
  ghostKick: boolean
  /** Bass approach note on the "and" of 4, or nothing. */
  passing: number | null
  /** 16th-note step → note. Empty on most bars. */
  melody: Record<number, MelodyNote>
}

function planBar(index: number): BarPlan {
  const key = KEYS[Math.floor(index / 16) % KEYS.length] ?? KEYS[0]!
  const chord = key[index % key.length] ?? Fmaj9
  const next = key[(index + 1) % key.length] ?? Fmaj9

  let passing: number | null = null
  if (Math.random() < 0.4) {
    passing =
      Math.random() < 0.5 ? fold(chord.root + chord.seventh) : fold(next.root - 1)
  }

  const melody: Record<number, MelodyNote> = {}
  // Every other bar at most, and never on the downbeat — the phrase answers
  // the chord rather than doubling it.
  if (index % 2 === 1 && Math.random() < 0.45) {
    const slots = [2, 4, 6, 8, 10, 12, 14]
    const count = 2 + Math.floor(Math.random() * 3)
    const chosen = new Set<number>()
    let guard = 0
    while (chosen.size < count && guard++ < 40) {
      const slot = pick(slots)
      if (slot !== undefined) chosen.add(slot)
    }
    for (const slot of chosen) {
      const midi = pick(chord.mel)
      if (midi !== undefined) melody[slot] = { midi, long: Math.random() < 0.25 }
    }
  }

  return {
    chord,
    twoHit: Math.random() < 0.3,
    ghostKick: Math.random() < 0.2,
    passing,
    melody,
  }
}

/* ---------------------------------------------------------------- engine */

export type JazzEngine = {
  play(): Promise<void>
  pause(): void
  readonly playing: boolean
  dispose(): void
}

/** Peak of a single Rhodes note; four of them make a chord. */
const CHORD_LEVEL = 0.12

export function create(): JazzEngine {
  let rig: Rig | null = null
  let playing = false
  let timer: number | null = null
  let fade: number | null = null

  let barStart = 0
  let bar = 0
  let step = 0
  let plan: BarPlan | null = null
  let nextPop = 0

  function stepTime(index: number): number {
    const beat = Math.floor(index / 4)
    return barStart + beat * BEAT + (OFFSETS[index % 4] ?? 0) * BEAT
  }

  function strike(current: Rig, chord: Chord, at: number, level: number, hold: number): void {
    for (const note of chord.voicing) {
      // ±10% of velocity, so no two hits of the same chord are identical.
      rhodes(current, note, at, CHORD_LEVEL * level * (0.9 + Math.random() * 0.2), hold)
    }
  }

  function scheduleStep(current: Rig, index: number, at: number): void {
    if (index === 0) plan = planBar(bar)
    const now = plan
    if (!now) return
    const chord = now.chord

    /* Rhodes */
    if (index === 0) strike(current, chord, at, 1, now.twoHit ? BEAT * 1.2 : BEAT * 2.2)
    if (now.twoHit && index === 6) strike(current, chord, at, 0.85, BEAT * 1.6)
    // −6dB re-strike halfway through a sustained bar.
    if (!now.twoHit && index === 8) strike(current, chord, at, 0.5, BEAT * 1.8)

    /* Bass */
    if (index === 0) bass(current, chord.root, at, BEAT * 0.9)
    if (index === 8) bass(current, fold(chord.root + 7), at, BEAT * 0.9)
    if (index === 14 && now.passing !== null) bass(current, now.passing, at, BEAT * 0.45)

    /* Drums */
    if (index === 0 || index === 8) kick(current, at, 0.55)
    if (index === 6 && now.ghostKick) kick(current, at, 0.55 * 0.316)
    if (index % 2 === 0) {
      burst(current, current.drums, at, 'highpass', 6500, 0.8, 0.035, index % 4 === 0 ? 0.18 : 0.1)
    }
    if (index === 4 || index === 12) {
      burst(current, current.drums, at, 'bandpass', 1700, 2, 0.09, 0.22)
    }

    /* Melody */
    const note = now.melody[index]
    if (note) lead(current, note.midi, at, note.long ? 0.9 : 0.22)
  }

  function tick(): void {
    const current = rig
    if (!current) return
    const now = current.ctx.currentTime

    // A backgrounded tab throttles the interval; rather than fire a hundred
    // late notes at once, drop the gap and pick the groove up from here. The
    // test is the next *unscheduled* step, which a healthy scheduler always
    // leaves at least `AHEAD` in the future — `barStart` itself is up to a
    // whole bar in the past by the end of every bar, and testing that instead
    // restarts the bar early, every bar.
    if (stepTime(step) < now - 1) {
      barStart = now
      step = 0
      plan = null
    }

    let guard = 0
    while (stepTime(step) < now + AHEAD && guard++ < 128) {
      scheduleStep(current, step, stepTime(step))
      step += 1
      if (step === 16) {
        step = 0
        bar += 1
        barStart += BAR
      }
    }

    // Surface pops, on their own clock.
    let pops = 0
    while (nextPop < now + AHEAD && pops++ < 16) {
      if (nextPop > now) burst(current, current.dry, nextPop, 'lowpass', 3000, 1, 0.008 + Math.random() * 0.007, 0.12)
      nextPop += 0.4 + Math.random() * 2.1
    }
  }

  async function play(): Promise<void> {
    if (typeof window === 'undefined') return
    if (!rig) rig = build()
    const current = rig
    if (!current) return

    if (fade !== null) {
      window.clearTimeout(fade)
      fade = null
    }
    playing = true

    try {
      await current.ctx.resume()
    } catch {
      // A context that will not resume simply stays silent.
    }

    const now = current.ctx.currentTime
    current.master.gain.cancelScheduledValues(now)
    current.master.gain.setValueAtTime(current.master.gain.value, now)
    current.master.gain.linearRampToValueAtTime(MASTER_TARGET, now + FADE_IN)

    if (timer === null) {
      barStart = now + 0.12
      bar = 0
      step = 0
      plan = null
      nextPop = now + 0.6 + Math.random()
      timer = window.setInterval(tick, TICK_MS)
      tick()
    }
  }

  function pause(): void {
    const current = rig
    if (!current || !playing) return
    playing = false

    const now = current.ctx.currentTime
    current.master.gain.cancelScheduledValues(now)
    current.master.gain.setValueAtTime(current.master.gain.value, now)
    current.master.gain.linearRampToValueAtTime(0, now + FADE_OUT)

    // The scheduler keeps booking notes through the fade, then stops — which
    // is also what lets a fast play/pause/play carry on without a seam.
    if (fade !== null) window.clearTimeout(fade)
    fade = window.setTimeout(() => {
      fade = null
      if (playing) return
      if (timer !== null) {
        window.clearInterval(timer)
        timer = null
      }
      void rig?.ctx.suspend().catch(() => {})
    }, FADE_OUT * 1000 + 80)
  }

  function dispose(): void {
    playing = false
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
    if (fade !== null) {
      window.clearTimeout(fade)
      fade = null
    }
    const current = rig
    rig = null
    if (current) void current.ctx.close().catch(() => {})
  }

  return {
    play,
    pause,
    get playing() {
      return playing
    },
    dispose,
  }
}
