import { describe, expect, it } from 'vitest'
import { emptyDrums } from './analysis'
import { beatTips, compareBeats, countWords } from './compare'
import { GENRES, gridFrom } from '../data/genres'

describe('compareBeats', () => {
  const target = gridFrom('heartbeat', 'backbeat', 'eighth')

  it('scores a perfect copy 100', () => {
    expect(compareBeats(target, target).score).toBe(100)
  })

  it('scores silence 0 and says nothing was heard', () => {
    const c = compareBeats(target, emptyDrums())
    expect(c.score).toBe(0)
    expect(beatTips(c).join(' ')).toMatch(/No kick detected/)
  })

  it('gives half credit for hits one step late', () => {
    const late = emptyDrums()
    target.kick.forEach((on, s) => (late.kick[s + 1] = on || late.kick[s + 1]))
    const c = compareBeats({ ...emptyDrums(), kick: target.kick }, { ...emptyDrums(), kick: late.kick.slice(0, 64) })
    expect(c.rows.kick.near).toBe(c.rows.kick.total)
    expect(c.score).toBe(50)
  })

  it('counts extra hits against the score', () => {
    const extra = { ...target, hat: target.hat.map(() => true) }
    const c = compareBeats(target, extra)
    expect(c.rows.hat.extra).toBe(32)
    expect(c.score).toBeLessThan(100)
  })
})

describe('countWords', () => {
  it('writes steps as musician counts', () => {
    expect(countWords([0, 6, 8, 15])).toBe('1, 2&, 3, 4a')
  })
})

describe('genres', () => {
  it('every genre has four chords per set and tempos the engine supports', () => {
    for (const g of GENRES) {
      for (const f of ['bright', 'dark'] as const) {
        for (const p of g.chords[f]) expect(p.chords).toHaveLength(4)
        expect(g.bpm[f]).toBeGreaterThanOrEqual(60)
        expect(g.bpm[f]).toBeLessThanOrEqual(160)
      }
    }
  })
})
