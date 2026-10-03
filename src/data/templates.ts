// Vibes, beat templates and example tunes. Templates use only facts that are free to use (tempo, simplified
// drum patterns, chord progressions). Never a famous song's melody, lyrics or audio.
import { STEPS, emptyDrums } from '../audio/analysis'
import type { DrumGrid, Note } from '../audio/analysis'

export type VibeId = 'sad' | 'chill' | 'happy' | 'hype'

export type Vibe = { id: VibeId; name: string; tagline: string; bpmText: string; facts: string[] }

export const VIBES: Vibe[] = [
  {
    id: 'sad',
    name: 'Sad',
    tagline: 'Heartbreak and late nights',
    bpmText: '60 to 85 BPM',
    facts: ['Slow and spacious.', 'Minor chords give it a darker tone.', 'The drums stay sparse, or enter late.'],
  },
  {
    id: 'chill',
    name: 'Chill',
    tagline: 'Slow mornings and sunsets',
    bpmText: '75 to 95 BPM',
    facts: ['Relaxed and steady.', 'Soft drums sit slightly behind the beat.', 'Gentle chords drift rather than push.'],
  },
  {
    id: 'happy',
    name: 'Happy',
    tagline: 'Summer, dancing, good news',
    bpmText: '100 to 130 BPM',
    facts: ['Fast enough to dance to.', 'Major chords give it a bright tone.', 'The snare lands on beats 2 and 4.'],
  },
  {
    id: 'hype',
    name: 'Energetic',
    tagline: 'Game day and big moments',
    bpmText: '80 to 95 BPM',
    facts: ['Every hit lands hard.', 'Strong kicks and claps drive it.', 'Short phrases repeat and build.'],
  },
]

export type Template = {
  id: string
  vibe: VibeId
  name: string
  bpm: number
  ref: { title: string; artist: string; bpmText: string; signature: boolean } | null
  /** One bar of 16 steps; repeated for every bar. */
  pattern: { kick: number[]; snare: number[]; hat: number[] }
  chords: string[]
  chordsWhy: string
  tips: string[]
}

const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14]
const QUARTERS = [0, 4, 8, 12]

export const TEMPLATES: Template[] = [
  {
    id: 'sad-ballad',
    vibe: 'sad',
    name: 'Slow ballad',
    bpm: 70,
    ref: { title: 'Fix You', artist: 'Coldplay', bpmText: '70 BPM', signature: false },
    pattern: { kick: [0, 10], snare: [8], hat: QUARTERS },
    chords: ['C', 'Em', 'Am', 'G'],
    chordsWhy: 'The chord progression from Fix You, moved to the key of C (I, iii, vi, V).',
    tips: [
      'Count slowly: 1, 2, 3, 4. Play a soft hi-hat on every count.',
      'Play the kick on 1, then again just after 3.',
      'Play the snare once per bar, on 3. This half-time feel makes the beat sound heavier.',
      'In Fix You, the drums only enter near the end. Holding back the drums is a common technique in sad songs.',
    ],
  },
  {
    id: 'sad-gospel',
    vibe: 'sad',
    name: 'Gospel ballad',
    bpm: 84,
    ref: { title: 'Stay With Me', artist: 'Sam Smith', bpmText: '84 BPM', signature: false },
    pattern: { kick: [0, 7, 8], snare: [4, 12], hat: QUARTERS },
    chords: ['Am', 'F', 'C', 'C'],
    chordsWhy: 'The three chords Stay With Me is built on: Am, F, and C. Starting on a minor chord gives it a sad tone.',
    tips: [
      'Play the snare on 2 and 4, like a choir clapping.',
      'Play the kick on 1, then twice around 3.',
      'Keep it slow. Each hit should land like a footstep.',
    ],
  },
  {
    id: 'chill-groove',
    vibe: 'chill',
    name: 'Laid-back groove',
    bpm: 90,
    ref: { title: 'Sunflower', artist: 'Post Malone, Swae Lee', bpmText: '90 BPM', signature: false },
    pattern: { kick: [0, 7, 10], snare: [4, 12], hat: EIGHTHS },
    chords: ['F', 'Em', 'Dm', 'C'],
    chordsWhy: 'Each chord steps down from the one before, which gives a relaxed, settling feel.',
    tips: [
      'Play the hi-hat twice per count, evenly.',
      'Play the snare on 2 and 4.',
      'The kick after beat 2 lands slightly early. That off-beat kick gives the groove its bounce.',
    ],
  },
  {
    id: 'chill-lofi',
    vibe: 'chill',
    name: 'Lo-fi beat',
    bpm: 80,
    ref: null,
    pattern: { kick: [0, 10, 11], snare: [4, 12], hat: [...EIGHTHS, 15] },
    chords: ['Dm', 'G', 'C', 'Am'],
    chordsWhy: 'A jazz progression (ii, V, I, vi) that lo-fi producers use often.',
    tips: [
      'This is the classic boom bap pattern: kick, snare, two kicks, snare.',
      'Keep the hi-hat quiet. Lo-fi drums are meant to sound soft and worn.',
    ],
  },
  {
    id: 'happy-pop',
    vibe: 'happy',
    name: 'Billie Jean beat',
    bpm: 117,
    ref: { title: 'Billie Jean', artist: 'Michael Jackson', bpmText: '117 BPM', signature: true },
    pattern: { kick: [0, 8], snare: [4, 12], hat: EIGHTHS },
    chords: ['C', 'G', 'Am', 'F'],
    chordsWhy: 'The four chords behind many pop hits (I, V, vi, IV).',
    tips: [
      'This is the most common beat in pop: kick on 1 and 3, snare on 2 and 4.',
      'Play the hi-hat twice per count, steady like a clock.',
      'Try it as one loop: boom, tss, pff, tss, boom, tss, pff, tss.',
    ],
  },
  {
    id: 'happy-disco',
    vibe: 'happy',
    name: 'Four on the floor',
    bpm: 104,
    ref: { title: "Stayin' Alive", artist: 'Bee Gees', bpmText: '104 BPM', signature: true },
    pattern: { kick: QUARTERS, snare: [4, 12], hat: [2, 6, 10, 14] },
    chords: ['C', 'Am', 'F', 'G'],
    chordsWhy: 'The bright 1950s progression (I, vi, IV, V).',
    tips: [
      'Play the kick on every count: 1, 2, 3, 4.',
      'Add the snare on 2 and 4, together with the kick.',
      'Play the hi-hat between the counts. This tempo is often used to teach the pace of CPR chest compressions.',
    ],
  },
  {
    id: 'hype-stomp',
    vibe: 'hype',
    name: 'Stomp, stomp, clap',
    bpm: 81,
    ref: { title: 'We Will Rock You', artist: 'Queen', bpmText: '81 BPM', signature: true },
    pattern: { kick: [0, 2, 8, 10], snare: [4, 12], hat: [] },
    chords: ['Am', 'Am', 'F', 'G'],
    chordsWhy: 'Holding Am for two bars builds tension before F and G move the song forward.',
    tips: [
      'Kick, kick, snare, rest. Repeat.',
      'Leave out the hi-hat. The silence makes each stomp hit harder.',
    ],
  },
  {
    id: 'hype-hiphop',
    vibe: 'hype',
    name: 'Hip-hop groove',
    bpm: 86,
    ref: { title: 'Lose Yourself', artist: 'Eminem', bpmText: 'about 86 BPM', signature: false },
    pattern: { kick: [0, 3, 8, 10], snare: [4, 12], hat: EIGHTHS },
    chords: ['Am', 'F', 'G', 'Am'],
    chordsWhy: 'Starting and ending on Am keeps the progression serious and unresolved.',
    tips: [
      'Play the snare hard on 2 and 4.',
      'Play the kick on 1, just before 2, on 3, and just after 3.',
      'Nod your head on each snare to keep time.',
    ],
  },
]

export function templateGrid(t: Template): DrumGrid {
  const g = emptyDrums()
  for (let s = 0; s < STEPS; s++) {
    const b = s % 16
    g.kick[s] = t.pattern.kick.includes(b)
    g.snare[s] = t.pattern.snare.includes(b)
    g.hat[s] = t.pattern.hat.includes(b)
  }
  return g
}

export const PROGRESSIONS: Record<VibeId, { chords: string[]; why: string }[]> = {
  sad: [
    { chords: ['Am', 'F', 'C', 'G'], why: 'The common pop progression, starting on its minor chord instead.' },
    { chords: ['F', 'G', 'Em', 'Am'], why: 'Rises, then ends on a minor chord.' },
  ],
  chill: [
    { chords: ['C', 'Am', 'Dm', 'G'], why: 'Smooth and even, so it loops without getting tiring.' },
    { chords: ['F', 'G', 'C', 'Am'], why: 'Moves between bright and soft chords.' },
  ],
  happy: [
    { chords: ['F', 'G', 'C', 'C'], why: 'Builds up and resolves on C, which sounds settled and bright.' },
    { chords: ['C', 'F', 'G', 'F'], why: 'Three major chords, as in early rock and roll.' },
  ],
  hype: [
    { chords: ['Am', 'G', 'F', 'G'], why: 'Steps down and back up, which suits a chant.' },
    { chords: ['Am', 'Am', 'Am', 'G'], why: 'Stays on one chord, which leaves room for the drums.' },
  ],
}

const n = (rows: number[][]): Note[] => rows.map(([start, len, midi]) => ({ start, len, midi }))

/** Original example melodies, one per mood. Written for this app. */
export const EXAMPLE_TUNES: Record<VibeId, { notes: Note[]; tip: string }> = {
  sad: {
    tip: 'Sad melodies move in small steps and end each line on a long, falling note.',
    notes: n([
      [0, 2, 67], [2, 2, 67], [4, 2, 64], [6, 2, 62], [8, 6, 60],
      [16, 2, 64], [18, 2, 64], [20, 2, 67], [22, 2, 64], [24, 6, 62],
      [32, 2, 72], [34, 2, 72], [36, 2, 71], [38, 2, 69], [40, 6, 64],
      [48, 2, 67], [50, 2, 65], [52, 2, 64], [54, 2, 62], [56, 8, 62],
    ]),
  },
  chill: {
    tip: 'Chill melodies are relaxed and sit slightly off the beat, close to speech.',
    notes: n([
      [2, 2, 69], [4, 2, 67], [6, 2, 67], [10, 2, 64], [12, 4, 65],
      [18, 2, 64], [20, 2, 62], [22, 2, 62], [26, 2, 60], [28, 4, 62],
      [34, 2, 65], [36, 2, 64], [38, 2, 64], [42, 2, 62], [44, 4, 60],
      [50, 2, 62], [52, 2, 64], [54, 2, 64], [58, 6, 60],
    ]),
  },
  happy: {
    tip: 'Happy melodies use short notes that jump upward and repeat a catchy phrase.',
    notes: n([
      [0, 2, 67], [2, 2, 67], [4, 2, 69], [6, 2, 67], [8, 4, 72], [12, 4, 71],
      [16, 2, 69], [18, 2, 69], [20, 2, 71], [22, 2, 69], [24, 4, 67], [28, 4, 64],
      [32, 2, 65], [34, 2, 65], [36, 2, 67], [38, 2, 69], [40, 4, 72], [44, 4, 74],
      [48, 2, 72], [50, 2, 71], [52, 4, 67], [56, 8, 72],
    ]),
  },
  hype: {
    tip: 'Energetic melodies use short, repeated notes to build momentum.',
    notes: n([
      [0, 2, 69], [4, 2, 69], [6, 2, 72], [8, 4, 69],
      [16, 2, 69], [20, 2, 69], [22, 2, 72], [24, 4, 74],
      [32, 2, 69], [36, 2, 69], [38, 2, 72], [40, 4, 69],
      [48, 2, 67], [50, 2, 69], [52, 4, 72], [56, 4, 71], [60, 4, 69],
    ]),
  },
}

export const LYRIC_PROMPTS: Record<VibeId, string[]> = {
  sad: ['Someone you miss', 'A place you cannot go back to', 'The last thing you never said'],
  chill: ['A slow morning', 'Driving at night with the windows down', 'Doing nothing with someone you like'],
  happy: ['The best day of your summer', 'Your favourite person walking in', 'Getting good news'],
  hype: ['Proving everyone wrong', 'Walking into the big game', 'Your comeback'],
}

export const youtubeSearch = (title: string, artist: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`
