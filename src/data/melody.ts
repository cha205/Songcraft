// Melody suggestions as you build: for the next note, rank the notes of the key by how well they fit the chord under
// them, how easy the jump from the last note is to sing, and whether the phrase is ending. Music theory, no AI.
import { STEPS, chordMidis, noteName } from '../audio/analysis'
import type { Note } from '../audio/analysis'
import type { Feeling } from './genres'

// The notes a melody can use: C major from C4 to C6, the same rows as the piano roll.
export const MELODY_NOTES = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84]

export type NoteIdea = { midi: number; name: string; why: string; best: boolean }

const pc = (m: number) => ((m % 12) + 12) % 12

/** Where the next note goes: right after the last note (or at the start). */
export const cursorOf = (notes: Note[]) => notes.reduce((end, n) => Math.max(end, n.start + n.len), 0)

export function nextNotes(notes: Note[], chords: string[], len: number, feeling: Feeling): NoteIdea[] {
  const at = cursorOf(notes)
  const prev = notes.length ? notes.reduce((a, b) => (b.start > a.start ? b : a)).midi : null
  const chord = chords[Math.min(3, Math.floor(at / 16))] ?? 'C'
  const tones = chordMidis(chord).map(pc)
  const root = pc(chordMidis(chord)[0])
  const strong = at % 8 === 0
  // A phrase ends where this note reaches the end of a bar; the very last note of the loop ends the whole line.
  const endsBar = (at + len) % 16 === 0
  const endsLoop = at + len >= STEPS

  const ideas = MELODY_NOTES.map((m) => {
    let score = 0
    const reasons: string[] = []
    const inChord = tones.includes(pc(m))
    if (inChord) {
      score += strong ? 5 : 3.5
      reasons.push(`${noteName(m).replace(/\d/, '')} is in the ${chord} chord, so it sounds settled`)
    } else {
      score += strong ? 0 : 1.5
      if (!strong) reasons.push(`${noteName(m).replace(/\d/, '')} is a passing note that connects two chord notes`)
    }
    if (prev !== null) {
      const jump = Math.abs(m - prev)
      if (jump === 0) score += 1.5
      else if (jump <= 2) score += 3
      else if (jump <= 4) score += 2
      else if (jump <= 7) score += 0.5
      else score -= 2.5
      if (jump === 0) reasons.push('repeating a note makes a line catchy')
      else if (jump <= 2) reasons.push(`a small step ${m > prev ? 'up' : 'down'}, easy to sing`)
      else if (jump <= 7) reasons.push(`a jump ${m > prev ? 'up adds excitement' : 'down feels like a sigh'}`)
      else reasons.push('a big leap, hard to sing')
      if (feeling === 'dark' && m < prev) score += 0.6
      if (feeling === 'bright' && m > prev) score += 0.6
    } else {
      score += m >= 64 && m <= 72 ? 1.5 : 0
    }
    if (endsLoop && pc(m) === 0) {
      score += 4
      reasons.unshift('ending the melody on C feels finished, like a full stop')
    } else if (endsBar && pc(m) === root) {
      score += 2
      reasons.unshift(`ending the line on ${chord.replace('m', '')}, the chord's home note, sounds complete`)
    }
    // Stay in a comfortable singing range.
    if (m < 62 || m > 79) score -= 1
    const why = reasons.slice(0, 2).join(', ')
    return { midi: m, name: noteName(m), why: why.charAt(0).toUpperCase() + why.slice(1) + '.', score, best: false }
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
  ideas[0].best = true
  return ideas.map(({ midi, name, why, best }) => ({ midi, name, why, best }))
}

/** A simple starting melody built from the user's own chords: chord notes on a common rhythm. */
export function melodyFromChords(chords: string[], chorus: boolean): Note[] {
  const rhythm: [number, number, number][] = [
    [0, 2, 1], [2, 2, 1], [4, 4, 2], [8, 2, 0], [10, 2, 1], [12, 4, 2],
  ]
  const out: Note[] = []
  chords.forEach((c, bar) => {
    const t = chordMidis(c).map((m) => m + (chorus ? 12 : 0))
    const fit = (m: number) => {
      while (m < 62) m += 12
      while (m > 81) m -= 12
      return m
    }
    rhythm.forEach(([s, len, i], k) => {
      const last = bar === chords.length - 1 && k === rhythm.length - 1
      out.push({ start: bar * 16 + s, len, midi: fit(last ? t[0] : t[i]) })
    })
  })
  return out
}
