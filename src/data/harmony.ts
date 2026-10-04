// Chord suggestions as you build: after each chord, rank the six chords of the key by how well they follow it in the
// chosen style and feeling. Plain music theory (common progressions in C major / A minor), no AI.
import type { Feeling, GenreId } from './genres'

export const KEY_CHORDS = ['C', 'Dm', 'Em', 'F', 'G', 'Am'] as const

// How naturally one chord moves to the next, 0 to 10, from the most common pop, rock and folk progressions.
const MOVE: Record<string, Record<string, number>> = {
  C: { C: 3, Dm: 6, Em: 5, F: 9, G: 9, Am: 8 },
  Dm: { C: 5, Dm: 2, Em: 5, F: 6, G: 10, Am: 6 },
  Em: { C: 5, Dm: 5, Em: 2, F: 8, G: 5, Am: 9 },
  F: { C: 9, Dm: 6, Em: 6, F: 3, G: 9, Am: 6 },
  G: { C: 10, Dm: 4, Em: 6, F: 7, G: 3, Am: 9 },
  Am: { C: 6, Dm: 7, Em: 7, F: 10, G: 7, Am: 3 },
}

// Moves each style leans on (pop's C G Am F loop, lo-fi's Dm G C, rock's C F G...).
const STYLE_MOVES: Record<GenreId, [string, string, number][]> = {
  pop: [['C', 'G', 3], ['G', 'Am', 3], ['Am', 'F', 3], ['F', 'C', 2], ['F', 'G', 2]],
  lofi: [['Dm', 'G', 3], ['G', 'C', 2], ['F', 'Em', 3], ['Em', 'Dm', 3], ['Dm', 'C', 2], ['Am', 'Dm', 2]],
  rnb: [['Dm', 'G', 3], ['F', 'Em', 3], ['Em', 'Dm', 2], ['C', 'Am', 2], ['Am', 'Dm', 2]],
  hiphop: [['Am', 'Am', 4], ['Am', 'F', 2], ['Dm', 'Em', 2], ['F', 'Em', 2], ['Dm', 'G', 2]],
  dance: [['F', 'G', 3], ['G', 'Am', 3], ['Am', 'F', 2], ['C', 'G', 2]],
  rock: [['C', 'F', 3], ['F', 'G', 3], ['G', 'C', 2], ['G', 'F', 2], ['Am', 'G', 2]],
  acoustic: [['C', 'Am', 3], ['Am', 'F', 2], ['F', 'G', 2], ['G', 'C', 2], ['C', 'F', 2]],
  latin: [['Am', 'F', 2], ['F', 'C', 2], ['C', 'G', 2], ['G', 'Am', 3]],
}

const FIRST: Record<Feeling, Record<string, number>> = {
  bright: { C: 10, F: 8, G: 7, Am: 4, Dm: 3, Em: 2 },
  dark: { Am: 10, Dm: 8, Em: 7, F: 5, C: 3, G: 3 },
}

// What each chord does, in words a beginner understands.
const FEEL: Record<string, string> = {
  C: 'C is home: landing here feels settled and finished.',
  Dm: 'Dm is soft and a little jazzy.',
  Em: 'Em is gentle and wistful.',
  F: 'F lifts the song and sounds open.',
  G: 'G builds tension that wants to go home to C.',
  Am: 'Am is the sad twin of C: almost the same notes, a darker mood.',
}

// Why a specific move works, so every suggestion is explained relative to the chord before it.
const MOVE_WHY: Record<string, string> = {
  'G>C': 'After G, C feels like coming home: the strongest move in music.',
  'G>Am': 'G to Am is a surprise: it sounds like home, turned sad.',
  'G>F': 'G down to F is a laid-back rock move.',
  'G>Em': 'G to Em softens the energy.',
  'F>G': 'F to G climbs up and builds tension for what comes next.',
  'F>C': 'F back to C feels warm and settled, like an "amen".',
  'F>Em': 'F to Em steps down gently, a favourite in lo-fi and R&B.',
  'F>Am': 'F to Am drifts into a more thoughtful mood.',
  'Am>F': 'Am to F lifts a sad line into something hopeful.',
  'Am>G': 'Am to G walks down, a classic pop and rock move.',
  'Am>Dm': 'Am to Dm stays in the minor world: moody and calm.',
  'Am>Em': 'Am to Em keeps it dark and floating.',
  'C>G': 'C to G opens the song up, the start of countless hits.',
  'C>F': 'C to F feels bright and open.',
  'C>Am': 'C to Am keeps almost the same notes but turns the mood darker.',
  'C>Dm': 'C to Dm takes a soft, jazzy step up.',
  'Dm>G': 'Dm to G is the classic jazz move that pulls toward C.',
  'Dm>C': 'Dm to C settles down softly.',
  'Dm>Am': 'Dm to Am sinks deeper into a sad mood.',
  'Em>Am': 'Em to Am is a gentle step down into a sadder place.',
  'Em>F': 'Em to F rises by just one note: a soft lift.',
  'Em>Dm': 'Em to Dm keeps stepping down, relaxed and dreamy.',
}

export type ChordIdea = { chord: string; score: number; why: string; best: boolean }

/**
 * Rank the chords that could go in slot `index` (0 to 3) after the chords already chosen before it.
 * The last slot also looks ahead: a chord that leads back to the first one makes the loop repeat smoothly.
 */
export function nextChords(chosen: string[], index: number, genre: GenreId, feeling: Feeling): ChordIdea[] {
  const prev = index > 0 ? chosen[index - 1] : null
  const ideas = KEY_CHORDS.map((c) => {
    let score = prev ? MOVE[prev]?.[c] ?? 4 : FIRST[feeling][c]
    if (prev) for (const [a, b, bonus] of STYLE_MOVES[genre]) if (a === prev && b === c) score += bonus
    const minor = c.endsWith('m')
    if (prev) score += feeling === 'dark' ? (minor ? 1.5 : 0) : minor ? 0 : 1.5
    if (index === 3 && chosen[0]) score += (MOVE[c]?.[chosen[0]] ?? 4) * 0.4
    // Chords already used earlier in the progression rank lower, so the progression keeps moving.
    const used = chosen.slice(0, index).filter((x) => x === c).length
    if (!(genre === 'hiphop' && c === prev)) score -= used * 2.5
    let why = (prev && MOVE_WHY[`${prev}>${c}`]) || FEEL[c]
    if (prev && c === prev) why = `Staying on ${c} for another bar gives the words room, common in ${genre === 'hiphop' ? 'hip-hop' : 'slower songs'}.`
    else if (index === 3 && chosen[0] && (MOVE[c]?.[chosen[0]] ?? 0) >= 9) why = `${why} It also leads straight back to ${chosen[0]}, so the loop repeats smoothly.`
    return { chord: c, score, why, best: false }
  }).sort((a, b) => b.score - a.score)
  ideas[0].best = true
  return ideas
}
