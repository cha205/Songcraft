import { describe, expect, it } from 'vitest'
import { FAMOUS_BEATS } from './famousBeats'
import { GENRES, tempoZone } from './genres'

describe('tempo zones', () => {
  it('put every genre default tempo in the green zone', () => {
    for (const g of GENRES) for (const f of ['bright', 'dark'] as const) expect(tempoZone(g.id, g.bpm[f]), `${g.id} ${f}`).toBe('in')
  })

  it('put every famous example beat in its own genre green zone', () => {
    for (const b of FAMOUS_BEATS) expect(tempoZone(b.genre, b.bpm), b.song).toBe('in')
  })

  it('treat a 120 BPM hip-hop beat as normal', () => {
    expect(tempoZone('hiphop', 120)).toBe('in')
  })

  it('still warn when a style is pushed far out of its range', () => {
    expect(tempoZone('lofi', 150)).toBe('far')
    expect(tempoZone('dance', 108)).toBe('near')
    expect(tempoZone('dance', 100)).toBe('far')
  })
})
