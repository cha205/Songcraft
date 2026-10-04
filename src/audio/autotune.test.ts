import { PitchDetector } from 'pitchy'
import { describe, expect, it } from 'vitest'
import { autotune } from './autotune'

const SR = 48000
const tone = (hz: (t: number) => number, seconds: number) => {
  const out = new Float32Array(SR * seconds)
  let phase = 0
  for (let i = 0; i < out.length; i++) {
    phase += (2 * Math.PI * hz(i / SR)) / SR
    // A voice-like tone: a fundamental plus two harmonics.
    out[i] = 0.3 * Math.sin(phase) + 0.12 * Math.sin(2 * phase) + 0.06 * Math.sin(3 * phase)
  }
  return out
}
const pitchAt = (x: Float32Array, at: number) => {
  const d = PitchDetector.forFloat32Array(4096)
  const start = Math.floor(at * SR)
  return d.findPitch(x.slice(start, start + 4096), SR)[0]
}
const cents = (a: number, b: number) => 1200 * Math.log2(a / b)

describe('autotune', () => {
  it('pulls a sharp A back to 440 Hz', () => {
    const out = autotune(tone(() => 452, 1.5), SR)
    expect(Math.abs(cents(pitchAt(out, 0.6), 440))).toBeLessThan(15)
  })

  it('moves an out-of-key note to the nearest note in C major', () => {
    // 277 Hz is C sharp, which is not in the key; it should land on C (261.6) or D (293.7).
    const got = pitchAt(autotune(tone(() => 285, 1.5), SR), 0.6)
    expect(Math.min(Math.abs(cents(got, 261.63)), Math.abs(cents(got, 293.66)))).toBeLessThan(20)
  })

  it('aims for the planned melody note in the singer octave', () => {
    // Singing about 205 Hz (between G#3 and A3) while the melody says A4: it should land on A3, an octave down.
    const out = autotune(tone(() => 205, 1.5), SR, { notes: [{ start: 0, len: 16, midi: 69 }], bpm: 120, preroll: 0 })
    expect(Math.abs(cents(pitchAt(out, 0.6), 220))).toBeLessThan(15)
  })

  it('keeps the length and leaves silence silent', () => {
    const x = new Float32Array(SR)
    const out = autotune(x, SR)
    expect(out.length).toBe(x.length)
    expect(out.every((v) => v === 0)).toBe(true)
  })
})

describe('natural pitch correction', () => {
  it('glides onto the note instead of snapping', () => {
    const out = autotune(tone(() => 452, 1.5), SR, { glide: 0.25 })
    expect(Math.abs(cents(pitchAt(out, 0.8), 440))).toBeLessThan(15)
  })
})
