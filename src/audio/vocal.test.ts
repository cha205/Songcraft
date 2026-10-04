import { describe, expect, it } from 'vitest'
import { cleanVocal } from './vocal'

const SR = 48000

describe('cleanVocal', () => {
  it('silences room noise between phrases and keeps the singing', () => {
    const x = new Float32Array(SR * 2)
    let seed = 1
    const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.01
    for (let i = 0; i < x.length; i++) {
      const singing = i > SR * 0.5 && i < SR * 1.5
      x[i] = noise() + (singing ? 0.3 * Math.sin((2 * Math.PI * 220 * i) / SR) : 0)
    }
    const out = cleanVocal(x, SR)
    const rms = (a: number, b: number) => Math.sqrt(out.slice(a, b).reduce((s, v) => s + v * v, 0) / (b - a))
    expect(rms(0, SR * 0.3)).toBeLessThan(0.002)
    expect(rms(SR * 0.8, SR * 1.2)).toBeGreaterThan(0.3)
  })

  it('normalizes the loudest moment to just under full scale', () => {
    const x = new Float32Array(SR).map((_, i) => 0.1 * Math.sin((2 * Math.PI * 330 * i) / SR))
    const out = cleanVocal(x, SR)
    const peak = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
    expect(peak).toBeGreaterThan(0.85)
    expect(peak).toBeLessThanOrEqual(0.9)
  })
})
