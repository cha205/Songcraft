import { describe, expect, it } from 'vitest'
import { cursorOf, melodyFromChords, nextNotes, polishMelody } from './melody'

const CHORDS = ['C', 'G', 'Am', 'F']

describe('melody suggestions', () => {
  it('starts on a note of the first chord', () => {
    const first = nextNotes([], CHORDS, 4, 'bright')[0]
    expect([0, 4, 7]).toContain(first.midi % 12)
    expect(first.best).toBe(true)
  })

  it('prefers small steps from the last note', () => {
    const ideas = nextNotes([{ start: 0, len: 2, midi: 64 }], CHORDS, 2, 'bright')
    expect(Math.abs(ideas[0].midi - 64)).toBeLessThanOrEqual(4)
  })

  it('ends the loop on C', () => {
    const notes = [{ start: 0, len: 56, midi: 67 }]
    expect(nextNotes(notes, CHORDS, 8, 'bright')[0].midi % 12).toBe(0)
  })

  it('builds a full starter melody from the chords', () => {
    const m = melodyFromChords(CHORDS, false)
    expect(cursorOf(m)).toBe(64)
    expect(m.every((n) => n.midi >= 62 && n.midi <= 81)).toBe(true)
  })

  it('cleans up a hummed melody', () => {
    const hum = [{ start: 0, len: 4, midi: 65 }, { start: 4, len: 1, midi: 67 }, { start: 8, len: 4, midi: 64 }]
    const out = polishMelody(hum, ['C', 'G', 'Am', 'F'])
    expect(out).toHaveLength(2)
    expect(out[0].midi).toBe(64)
    expect(out.every((n) => n.len >= 2)).toBe(true)
  })
})
