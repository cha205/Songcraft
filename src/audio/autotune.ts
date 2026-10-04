// Pitch correction for a sung take, done offline in the browser. No browser APIs, so it is unit-testable.
// 1. Track the voice's pitch with pitchy (McLeod Pitch Method) every 512 samples.
// 2. Pick a target note for each moment: the melody note the singer is meant to sing (moved to their octave) when they
//    are close to it, otherwise the nearest note of the key (C major / A minor, which every chord in the app uses).
// 3. Re-pitch with TD-PSOLA: cut two-period grains around each pitch period and lay them back down at the target
//    period. Unvoiced sounds (s, t, breaths) pass through unchanged.
import { PitchDetector } from 'pitchy'
import type { Note } from './analysis'

const SCALE = [0, 2, 4, 5, 7, 9, 11]
const HOP = 512
const WIN = 2048

/** `glide` 0..1: how fast the correction moves toward the target each frame. 1 snaps instantly (the robot sound). */
export type TuneOptions = { notes?: Note[]; bpm?: number; preroll?: number; strength?: number; glide?: number }

const toMidi = (f: number) => 69 + 12 * Math.log2(f / 440)

function nearestInScale(m: number) {
  let best = Math.round(m)
  let dist = Infinity
  for (let n = Math.floor(m) - 2; n <= Math.ceil(m) + 2; n++) {
    if (!SCALE.includes(((n % 12) + 12) % 12)) continue
    if (Math.abs(n - m) < dist) {
      dist = Math.abs(n - m)
      best = n
    }
  }
  return best
}

/** Return a pitch-corrected copy of `samples`. `strength` 0..1 blends from no correction to hard, robotic correction. */
export function autotune(samples: Float32Array, sampleRate: number, opts: TuneOptions = {}): Float32Array {
  const strength = opts.strength ?? 1
  const glide = opts.glide ?? 1
  let shift = 0
  const n = samples.length
  const frames = Math.ceil(n / HOP)
  const detector = PitchDetector.forFloat32Array(WIN)
  const frame = new Float32Array(WIN)
  const ratio = new Float32Array(frames).fill(1)
  const period = new Float32Array(frames).fill(Math.round(sampleRate / 200))
  const stepSec = opts.bpm ? 60 / opts.bpm / 4 : 0
  let held = NaN

  for (let f = 0; f < frames; f++) {
    const start = f * HOP - WIN / 2
    let energy = 0
    for (let i = 0; i < WIN; i++) {
      const v = samples[start + i] ?? 0
      frame[i] = v
      energy += v * v
    }
    if (Math.sqrt(energy / WIN) < 0.01) {
      held = NaN
      shift = 0
      continue
    }
    const [hz, clarity] = detector.findPitch(frame, sampleRate)
    if (!(clarity >= 0.85 && hz >= 70 && hz <= 1000)) {
      held = NaN
      shift = 0
      continue
    }
    const m = toMidi(hz)
    let target = nearestInScale(m)
    // Prefer the melody note planned for this moment, moved into the singer's octave.
    if (opts.notes && stepSec) {
      const step = Math.floor((f * HOP) / sampleRate / stepSec - (opts.preroll ?? 0) / stepSec)
      const planned = opts.notes.find((x) => step >= x.start && step < x.start + x.len)
      if (planned) {
        const folded = planned.midi + 12 * Math.round((m - planned.midi) / 12)
        if (Math.abs(folded - m) <= 2.5) target = folded
      }
    }
    // A little hysteresis so a voice sitting between two notes does not flutter.
    if (!Number.isNaN(held) && Math.abs(m - held) < 0.7 && target !== held) target = held
    held = target
    shift += glide * ((target - m) * strength - shift)
    ratio[f] = Math.pow(2, shift / 12)
    period[f] = sampleRate / hz
  }

  // Analysis pitch marks, one per period of the input.
  const marks: number[] = []
  for (let t = 0; t < n; ) {
    marks.push(Math.round(t))
    t += Math.max(32, period[Math.min(frames - 1, Math.floor(t / HOP))])
  }

  // Overlap-add two-period Hann grains at the target spacing, then divide by the summed window to keep the level.
  const out = new Float32Array(n)
  const weight = new Float32Array(n)
  let k = 0
  for (let ts = 0; ts < n; ) {
    while (k + 1 < marks.length && Math.abs(marks[k + 1] - ts) <= Math.abs(marks[k] - ts)) k++
    const ta = marks[k]
    const fi = Math.min(frames - 1, Math.floor(ta / HOP))
    const p = Math.round(period[fi])
    for (let i = -p; i < p; i++) {
      const src = ta + i
      const dst = Math.round(ts) + i
      if (src < 0 || src >= n || dst < 0 || dst >= n) continue
      const w = 0.5 + 0.5 * Math.cos((Math.PI * i) / p)
      out[dst] += samples[src] * w
      weight[dst] += w
    }
    ts += Math.max(16, p / ratio[fi])
  }
  for (let i = 0; i < n; i++) if (weight[i] > 1e-3) out[i] /= weight[i]
  return out
}
