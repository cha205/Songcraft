import { describe, expect, it } from 'vitest'
import { fitHum } from './fitHum'

const SR = 44100
// A hum of four notes, sung at its own speed with silence around it.
function hum(notes: number[], noteSec: number, lead = 0.6, tail = 0.8) {
  const out = new Float32Array(Math.round(SR * (lead + notes.length * noteSec + tail)))
  notes.forEach((hz, k) => {
    const a = Math.round(SR * (lead + k * noteSec))
    const b = Math.round(SR * (lead + (k + 1) * noteSec - 0.05))
    for (let i = a; i < b; i++) out[i] = 0.4 * Math.sin((2 * Math.PI * hz * i) / SR) + 0.1 * Math.sin((4 * Math.PI * hz * i) / SR)
  })
  return out
}

describe('fitHum', () => {
  it('fits a 6 second hum into bars of the beat and fills the loop', () => {
    const r = fitHum(hum([261.6, 293.7, 329.6, 392], 1.5), SR, 82)
    expect(r.bars).toBe(2)
    expect(r.notes.length).toBeGreaterThanOrEqual(6)
    expect(Math.max(...r.notes.map((n) => n.start + n.len))).toBeLessThanOrEqual(64)
    expect(r.notes.every((n) => n.start % 2 === 0)).toBe(true)
    expect(r.notes.some((n) => n.start >= 32)).toBe(true)
  })

  it('stretches a quick hum to fit a single bar', () => {
    const r = fitHum(hum([329.6, 392, 440, 392], 0.6), SR, 100)
    expect(r.bars).toBe(1)
    expect(r.notes.some((n) => n.start >= 48)).toBe(true)
  })
})
