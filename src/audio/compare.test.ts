import { describe, expect, it } from 'vitest'
import { emptyDrums } from './analysis'
import { beatTips, compareBeats, countWords } from './compare'
import { TEMPLATES, templateGrid } from '../data/templates'

describe('compareBeats', () => {
  const target = templateGrid(TEMPLATES.find((t) => t.id === 'happy-pop')!)

  it('scores a perfect copy 100', () => {
    expect(compareBeats(target, target).score).toBe(100)
  })

  it('scores silence 0 and says nothing was heard', () => {
    const c = compareBeats(target, emptyDrums())
    expect(c.score).toBe(0)
    expect(beatTips(c).join(' ')).toMatch(/No BOOM/)
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

describe('templates', () => {
  it('every template has 4 chords and a tempo the engine supports', () => {
    for (const t of TEMPLATES) {
      expect(t.chords).toHaveLength(4)
      expect(t.bpm).toBeGreaterThanOrEqual(60)
      expect(t.bpm).toBeLessThanOrEqual(160)
    }
  })
})
