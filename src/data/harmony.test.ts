import { describe, expect, it } from 'vitest'
import { nextChords } from './harmony'

describe('chord suggestions', () => {
  it('starts bright songs on C and dark songs on Am', () => {
    expect(nextChords([], 0, 'pop', 'bright')[0].chord).toBe('C')
    expect(nextChords([], 0, 'pop', 'dark')[0].chord).toBe('Am')
  })

  it('suggests the classic moves first', () => {
    expect(nextChords(['Dm'], 1, 'lofi', 'bright')[0].chord).toBe('G')
    expect(nextChords(['C', 'G'], 2, 'pop', 'bright')[0].chord).toBe('Am')
    expect(nextChords(['C'], 1, 'rock', 'bright').slice(0, 2).map((x) => x.chord)).toContain('F')
  })

  it('ranks all six chords and marks one as best', () => {
    const ideas = nextChords(['Am', 'F', 'C'], 3, 'latin', 'dark')
    expect(ideas).toHaveLength(6)
    expect(ideas.filter((x) => x.best)).toHaveLength(1)
    expect(ideas[0].why.length).toBeGreaterThan(10)
  })
})
