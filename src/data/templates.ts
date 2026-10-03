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
    tagline: 'Heartbreak, missing someone',
    bpmText: '60-85 BPM',
    facts: [
      'Slow: about 60 to 85 beats per minute.',
      'Built on minor chords, which sound darker.',
      'The drums leave lots of space, or hold back until the end.',
    ],
  },
  {
    id: 'chill',
    name: 'Chill',
    tagline: 'Late night, lazy Sunday',
    bpmText: '75-95 BPM',
    facts: [
      'Medium-slow and relaxed.',
      'Soft drums with a laid-back, slightly late feel.',
      'Gentle chords that drift instead of pushing.',
    ],
  },
  {
    id: 'happy',
    name: 'Happy',
    tagline: 'Dancing, summer, good news',
    bpmText: '100-130 BPM',
    facts: [
      'Fast enough to dance to.',
      'Major chords, which sound bright.',
      'The snare lands on 2 and 4, right where you clap.',
    ],
  },
  {
    id: 'hype',
    name: 'Hype',
    tagline: 'Gym, big game, main character',
    bpmText: '80-95 BPM, hits hard',
    facts: [
      'Not always fast, but every hit is heavy.',
      'Big kicks and claps you can stomp to.',
      'Short ideas that repeat and build energy.',
    ],
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
    name: 'Slow-burn ballad',
    bpm: 70,
    ref: { title: 'Fix You', artist: 'Coldplay', bpmText: '70 BPM', signature: false },
    pattern: { kick: [0, 10], snare: [8], hat: QUARTERS },
    chords: ['C', 'Em', 'Am', 'G'],
    chordsWhy: 'The chord shape Fix You is built on, moved to the key of C (I - iii - vi - V).',
    tips: [
      'Count slowly: 1... 2... 3... 4. A soft TSS on every count.',
      'BOOM on 1, then a late BOOM just after 3.',
      'Only one PFF per bar, on 3. That half-speed snare is what makes it feel heavy.',
      'In Fix You the drums wait until near the end. Holding the beat back is a classic sad-song move.',
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
    chordsWhy: 'The three chords Stay With Me leans on: Am - F - C. Starting on a minor chord makes it ache.',
    tips: [
      'PFF on 2 and 4, like a choir clapping in church.',
      'BOOM on 1, then two quick BOOMs around 3.',
      'Keep it slow and heavy. Every hit should feel like a footstep.',
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
    chordsWhy: 'The chords step down one at a time. It feels like sinking into a couch.',
    tips: [
      'TSS twice per count, nice and even.',
      'PFF on 2 and 4.',
      'The BOOM after 2 lands a little early. That off-beat kick gives it the bounce.',
    ],
  },
  {
    id: 'chill-lofi',
    vibe: 'chill',
    name: 'Lo-fi study beat',
    bpm: 80,
    ref: null,
    pattern: { kick: [0, 10, 11], snare: [4, 12], hat: [...EIGHTHS, 15] },
    chords: ['Dm', 'G', 'C', 'Am'],
    chordsWhy: 'A jazzy loop (ii - V - I - vi). Lo-fi producers use it constantly.',
    tips: [
      'This is the classic "boom bap" beat: BOOM ... PFF ... BOOM BOOM ... PFF.',
      'Keep your TSS soft. Lo-fi drums sound tired on purpose.',
    ],
  },
  {
    id: 'happy-pop',
    vibe: 'happy',
    name: 'The Billie Jean beat',
    bpm: 117,
    ref: { title: 'Billie Jean', artist: 'Michael Jackson', bpmText: '117 BPM', signature: true },
    pattern: { kick: [0, 8], snare: [4, 12], hat: EIGHTHS },
    chords: ['C', 'G', 'Am', 'F'],
    chordsWhy: 'The four chords behind hundreds of pop hits (I - V - vi - IV).',
    tips: [
      'The simplest beat in pop: BOOM on 1 and 3, PFF on 2 and 4.',
      'TSS twice per count, steady like a clock.',
      'Say it as one loop: BOOM-tss-PFF-tss-BOOM-tss-PFF-tss.',
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
    chordsWhy: 'The bright "50s progression" (I - vi - IV - V).',
    tips: [
      'BOOM on every count: 1, 2, 3, 4. That is the "four on the floor".',
      'PFF on 2 and 4, on top of the BOOM.',
      'TSS in between the counts, on the "and". Fun fact: this tempo is the speed of CPR chest compressions.',
    ],
  },
  {
    id: 'hype-stomp',
    vibe: 'hype',
    name: 'Stomp stomp clap',
    bpm: 81,
    ref: { title: 'We Will Rock You', artist: 'Queen', bpmText: '81 BPM', signature: true },
    pattern: { kick: [0, 2, 8, 10], snare: [4, 12], hat: [] },
    chords: ['Am', 'Am', 'F', 'G'],
    chordsWhy: 'Staying on Am for two bars builds tension before F and G push forward.',
    tips: [
      'BOOM BOOM PFF, rest. BOOM BOOM PFF, rest.',
      'No hi-hat at all. The empty space is what makes the stomps hit.',
    ],
  },
  {
    id: 'hype-hiphop',
    vibe: 'hype',
    name: 'Head-nod hip-hop',
    bpm: 86,
    ref: { title: 'Lose Yourself', artist: 'Eminem', bpmText: 'about 86 BPM', signature: false },
    pattern: { kick: [0, 3, 8, 10], snare: [4, 12], hat: EIGHTHS },
    chords: ['Am', 'F', 'G', 'Am'],
    chordsWhy: 'Minor and serious: it starts and ends on Am, so it never fully relaxes.',
    tips: [
      'PFF on 2 and 4, hard.',
      'BOOM on 1, a sneaky BOOM just before 2, then BOOM on 3 and right after.',
      'Nod your head on every PFF. If you nod, it works.',
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
    { chords: ['Am', 'F', 'C', 'G'], why: 'The "sad four chords": the pop progression, but starting on the minor chord.' },
    { chords: ['F', 'G', 'Em', 'Am'], why: 'Climbs up, then lands on a sad chord at the end.' },
  ],
  chill: [
    { chords: ['C', 'Am', 'Dm', 'G'], why: 'Smooth and round, loops forever without getting tiring.' },
    { chords: ['F', 'G', 'C', 'Am'], why: 'Floats between bright and soft.' },
  ],
  happy: [
    { chords: ['F', 'G', 'C', 'C'], why: 'Builds up and lands home on C. Feels like a big smile.' },
    { chords: ['C', 'F', 'G', 'F'], why: 'Rock-and-roll simple. Three bright chords.' },
  ],
  hype: [
    { chords: ['Am', 'G', 'F', 'G'], why: 'Walks down and back up. Good for chanting over.' },
    { chords: ['Am', 'Am', 'Am', 'G'], why: 'Almost one chord. Leaves all the room for the beat.' },
  ],
}

const n = (rows: number[][]): Note[] => rows.map(([start, len, midi]) => ({ start, len, midi }))

/** Original example tunes, one per vibe. Written for this app. */
export const EXAMPLE_TUNES: Record<VibeId, { notes: Note[]; tip: string }> = {
  sad: {
    tip: 'Sad tunes move in small steps and end each line on a long note that falls.',
    notes: n([
      [0, 2, 67], [2, 2, 67], [4, 2, 64], [6, 2, 62], [8, 6, 60],
      [16, 2, 64], [18, 2, 64], [20, 2, 67], [22, 2, 64], [24, 6, 62],
      [32, 2, 72], [34, 2, 72], [36, 2, 71], [38, 2, 69], [40, 6, 64],
      [48, 2, 67], [50, 2, 65], [52, 2, 64], [54, 2, 62], [56, 8, 62],
    ]),
  },
  chill: {
    tip: 'Chill tunes are relaxed and a little off the beat, almost like talking.',
    notes: n([
      [2, 2, 69], [4, 2, 67], [6, 2, 67], [10, 2, 64], [12, 4, 65],
      [18, 2, 64], [20, 2, 62], [22, 2, 62], [26, 2, 60], [28, 4, 62],
      [34, 2, 65], [36, 2, 64], [38, 2, 64], [42, 2, 62], [44, 4, 60],
      [50, 2, 62], [52, 2, 64], [54, 2, 64], [58, 6, 60],
    ]),
  },
  happy: {
    tip: 'Happy tunes use short, bouncy notes that jump up. Repeat the catchy bit.',
    notes: n([
      [0, 2, 67], [2, 2, 67], [4, 2, 69], [6, 2, 67], [8, 4, 72], [12, 4, 71],
      [16, 2, 69], [18, 2, 69], [20, 2, 71], [22, 2, 69], [24, 4, 67], [28, 4, 64],
      [32, 2, 65], [34, 2, 65], [36, 2, 67], [38, 2, 69], [40, 4, 72], [44, 4, 74],
      [48, 2, 72], [50, 2, 71], [52, 4, 67], [56, 8, 72],
    ]),
  },
  hype: {
    tip: 'Hype tunes are short, punchy and repeated. Repetition is energy.',
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
