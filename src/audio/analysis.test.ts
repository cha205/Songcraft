import { describe, expect, it } from 'vitest'
import { beatboxToHits, humToNotes, pickChords, stepSeconds } from './analysis'

const SR = 44100
const BPM = 90
const STEP = stepSeconds(BPM)

// Fixed-seed noise so tests are repeatable.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296 - 0.5
  }
}

/** A hum-like tone: fundamental plus two weaker harmonics, with a soft attack and release. */
function hum(out: Float32Array, startStep: number, steps: number, midi: number, cents = 0) {
  const f = 440 * 2 ** ((midi - 69 + cents / 100) / 12)
  const s0 = Math.round(startStep * STEP * SR)
  const n = Math.round(steps * STEP * SR * 0.9)
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const env = Math.min(1, i / 400, (n - i) / 400)
    const t = i / SR
    out[s0 + i] += 0.3 * env * (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(4 * Math.PI * f * t) + 0.2 * Math.sin(6 * Math.PI * f * t))
  }
}

describe('humToNotes', () => {
  it('turns four hummed pitches into four in-key notes on the grid, keeping the tune shape', () => {
    const out = new Float32Array(Math.round(64 * STEP * SR))
    // E major arpeggio-ish tune (E, F#, G#, B), a bit sharp like a real hum.
    ;[52, 54, 56, 59].forEach((m, i) => hum(out, i * 4, 4, m, 25))
    const { notes } = humToNotes(out, SR, BPM)
    expect(notes.map((n) => n.start)).toEqual([0, 4, 8, 12])
    for (const n of notes) expect(n.len).toBeGreaterThanOrEqual(3)
    expect(notes.map((n) => n.midi - notes[0].midi)).toEqual([0, 2, 4, 7])
    for (const n of notes) expect([0, 2, 4, 5, 7, 9, 11]).toContain(n.midi % 12)
    for (const n of notes) expect(n.midi).toBeGreaterThanOrEqual(60)
  })

  it('returns nothing for silence', () => {
    expect(humToNotes(new Float32Array(SR * 2), SR, BPM).notes).toEqual([])
  })
})

describe('beatboxToHits', () => {
  it('tells BOOM, PFF and TSS apart and puts them on the right steps', () => {
    const out = new Float32Array(Math.round(16 * STEP * SR))
    const noise = rng(7)
    const put = (step: number, len: number, gen: (i: number) => number) => {
      const s0 = Math.round(step * STEP * SR)
      for (let i = 0; i < len; i++) out[s0 + i] += gen(i)
    }
    // BOOM: 70 Hz thump.
    for (const s of [0, 8]) put(s, 6000, (i) => 0.8 * Math.exp(-i / 2500) * Math.sin((2 * Math.PI * 70 * i) / SR))
    // PFF: mid-band noise burst (two-pole low-pass at ~2 kHz).
    for (const s of [4, 12]) {
      let y1 = 0
      let y2 = 0
      const a = 1 - Math.exp((-2 * Math.PI * 2000) / SR)
      put(s, 5000, (i) => {
        y1 += a * (noise() - y1)
        y2 += a * (y1 - y2)
        return 4 * Math.exp(-i / 1500) * y2
      })
    }
    // TSS: high hiss (differenced noise).
    for (const s of [2, 6, 10, 14]) {
      let prev = 0
      put(s, 2500, (i) => {
        const x = noise()
        const d = x - prev
        prev = x
        return 0.6 * Math.exp(-i / 800) * d
      })
    }
    const hits = beatboxToHits(out, SR, BPM)
    const by = (d: string) => hits.filter((h) => h.drum === d).map((h) => h.step)
    expect(by('kick')).toEqual([0, 8])
    expect(by('snare')).toEqual([4, 12])
    expect(by('hat')).toEqual([2, 6, 10, 14])
  })
})

describe('pickChords', () => {
  it('picks a chord that contains the notes of each bar', () => {
    const chords = pickChords([
      { start: 0, len: 8, midi: 60 },
      { start: 8, len: 8, midi: 64 },
      { start: 16, len: 16, midi: 67 },
      { start: 32, len: 16, midi: 69 },
      { start: 48, len: 16, midi: 65 },
    ])
    expect(chords[0]).toBe('C')
    expect(['G', 'C', 'Em']).toContain(chords[1])
    expect(['Am', 'F', 'Dm']).toContain(chords[2])
    expect(['F', 'Dm']).toContain(chords[3])
  })
})
