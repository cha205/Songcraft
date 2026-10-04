// "Beats from songs you know": simplified versions of famous songs' basic drum grooves, rebuilt with Songmaker's own
// drums so beginners can study and try them. No audio, melody or lyrics from the songs is used.
// To remove the whole section, set SHOW_FAMOUS_BEATS to false. To change the list, edit FAMOUS_BEATS.
import { STEPS } from '../audio/analysis'
import type { DrumGrid } from '../audio/analysis'
import type { GenreId, KitId } from './genres'

export const SHOW_FAMOUS_BEATS = true

export type FamousBeat = {
  id: string
  song: string
  artist: string
  bpm: number
  kit: KitId
  /** One bar of 16 steps; it repeats for the whole loop. */
  bar: { kick: number[]; snare: number[]; hat: number[] }
  /** What to notice, in one sentence a 10-year-old understands. */
  lesson: string
  fits: GenreId[]
}

const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14]

export const FAMOUS_BEATS: FamousBeat[] = [
  {
    id: 'rock-you',
    song: 'We Will Rock You',
    artist: 'Queen',
    bpm: 81,
    kit: 'acoustic',
    bar: { kick: [0, 2, 8, 10], snare: [4, 12], hat: [] },
    lesson: 'Two stomps, one clap, then silence. The gaps are what make it feel huge.',
    fits: ['rock', 'pop'],
  },
  {
    id: 'billie-jean',
    song: 'Billie Jean',
    artist: 'Michael Jackson',
    bpm: 117,
    kit: 'linn',
    bar: { kick: [0, 8], snare: [4, 12], hat: EIGHTHS },
    lesson: 'The classic pop beat: kick on 1 and 3, snare on 2 and 4, even hi-hats. Simple, so the bass and voice can shine.',
    fits: ['pop', 'rnb', 'dance'],
  },
  {
    id: 'bites-dust',
    song: 'Another One Bites the Dust',
    artist: 'Queen',
    bpm: 110,
    kit: 'acoustic',
    bar: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [] },
    lesson: 'A kick on every beat and the snare on 2 and 4. A marching groove that makes people stomp along.',
    fits: ['rock', 'dance', 'pop'],
  },
  {
    id: 'bad-guy',
    song: 'bad guy',
    artist: 'Billie Eilish',
    bpm: 135,
    kit: 'kit8',
    bar: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [] },
    lesson: 'Only a deep kick on every beat and a snap on 2 and 4. A beat can be tiny and still hit hard.',
    fits: ['pop', 'dance', 'hiphop'],
  },
  {
    id: 'despacito',
    song: 'Despacito',
    artist: 'Luis Fonsi and Daddy Yankee',
    bpm: 89,
    kit: 'kit8',
    bar: { kick: [0, 4, 8, 12], snare: [3, 6, 11, 14], hat: EIGHTHS },
    lesson: 'The dembow: a kick on every beat while the snare skips just before and after it. That stutter makes reggaeton danceable.',
    fits: ['latin', 'pop'],
  },
  {
    id: 'old-town-road',
    song: 'Old Town Road',
    artist: 'Lil Nas X',
    bpm: 136,
    kit: 'kit8',
    bar: { kick: [0, 6, 10], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15] },
    lesson: 'A trap beat at half speed: one big clap on beat 3 and fast hi-hat rolls. It feels slow and fast at the same time.',
    fits: ['hiphop'],
  },
]

/** The famous beat as a full loop for the drum grid. */
export function famousGrid(b: FamousBeat): DrumGrid {
  const row = (steps: number[]) => Array.from({ length: STEPS }, (_, i) => steps.includes(i % 16))
  return { kick: row(b.bar.kick), snare: row(b.bar.snare), hat: row(b.bar.hat) }
}
