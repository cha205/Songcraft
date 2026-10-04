// Genres, feelings and the drum lesson. Everything here is original teaching material: style conventions, not copies of songs.
import { STEPS, emptyDrums } from '../audio/analysis'
import type { DrumGrid, Note } from '../audio/analysis'
import type { IconName } from '../components/Icon'

export type GenreId = 'pop' | 'hiphop' | 'lofi' | 'rnb' | 'dance' | 'rock' | 'acoustic' | 'latin'
export type Feeling = 'bright' | 'dark'
export type KitId = 'acoustic' | 'kit8' | 'cr78' | 'linn' | 'techno' | 'breakbeat' | 'r8' | 'kit3' | 'kpr77' | 'stark' | 'fm' | 'bongos' | 'break8' | 'break9'
export type LeadId = 'piano' | 'flute' | 'guitar' | 'violin' | 'synth' | 'bells' | 'sax' | 'trumpet' | 'eguitar' | 'harp' | 'organ' | 'nylon'
export type ChordInstId = 'piano' | 'guitar' | 'strings' | 'pad' | 'eguitar' | 'organ' | 'nylon' | 'harp'
export type BassId = 'roots' | 'eighths' | 'sub' | 'electric' | 'octave' | 'none'
export type ExtraId = 'strings' | 'guitar' | 'arp' | 'flute' | 'pad' | 'eguitar' | 'organ'

export type LayerOption = { id: string; name: string; steps: number[]; why: string }

/** The three drum lessons. Each option is one bar of 16 steps and one sentence on what it does to the feel. */
export const KICKS: LayerOption[] = [
  { id: 'heartbeat', name: 'Beats 1 and 3', steps: [0, 8], why: 'The basic heartbeat of pop and rock.' },
  { id: 'four', name: 'Every beat', steps: [0, 4, 8, 12], why: 'Four on the floor: the steady engine of dance music.' },
  { id: 'laidback', name: 'Laid back', steps: [0, 10], why: 'The second kick lands late, which feels relaxed.' },
  { id: 'bounce', name: 'Bounce', steps: [0, 6, 10], why: 'Kicks between the beats make the groove bounce, as in classic hip-hop.' },
  { id: 'rolling', name: 'Rolling', steps: [0, 3, 7, 10, 14], why: 'Lots of off-beat kicks. Busy and modern, as in trap.' },
  { id: 'sparse', name: 'Only beat 1', steps: [0], why: 'Leaves space, so the song feels calm and open.' },
  { id: 'push', name: 'Pushed', steps: [0, 3, 8, 11], why: 'Kicks just before the beat push the groove forward, as in R&B and funk.' },
  { id: 'double', name: 'Double kick', steps: [0, 2, 8, 10], why: 'Two quick kicks in a row add punch, as in rock.' },
  { id: 'none', name: 'No kick', steps: [], why: 'No kick at all. Good for a soft intro or an acoustic song.' },
]
export const SNARES: LayerOption[] = [
  { id: 'backbeat', name: 'Beats 2 and 4', steps: [4, 12], why: 'Where people clap along. Used in most pop, rock and hip-hop.' },
  { id: 'halftime', name: 'Only beat 3', steps: [8], why: 'Half as many snares, so the song feels slower and heavier.' },
  { id: 'ghost', name: 'With ghost notes', steps: [4, 7, 12, 15], why: 'Extra snares between the claps add a smooth, funky groove.' },
  { id: 'dembow', name: 'Reggaeton', steps: [3, 6, 11, 14], why: 'The off-beat dembow rhythm that makes reggaeton danceable.' },
  { id: 'motown', name: 'Every beat', steps: [0, 4, 8, 12], why: 'A snare on every beat, the bouncy sound of Motown and indie pop.' },
  { id: 'pickup', name: 'With a pickup', steps: [4, 12, 15], why: 'An extra snare at the very end of the bar leads back to the start.' },
  { id: 'none', name: 'No snare', steps: [], why: 'No snare at all. The song floats instead of marching.' },
]
export const HATS: LayerOption[] = [
  { id: 'quarter', name: 'Once per beat', steps: [0, 4, 8, 12], why: 'Simple and calm, like a slow clock.' },
  { id: 'eighth', name: 'Twice per beat', steps: [0, 2, 4, 6, 8, 10, 12, 14], why: 'Steady and even. The most common hi-hat.' },
  { id: 'offbeat', name: 'Between beats', steps: [2, 6, 10, 14], why: 'Lifts the groove. The sound of house and disco.' },
  { id: 'sixteenth', name: 'Four per beat', steps: Array.from({ length: 16 }, (_, i) => i), why: 'Fast and driving, which adds energy.' },
  { id: 'trap', name: 'Rolls', steps: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15], why: 'Fast rolls at the end of each bar. The trap signature.' },
  { id: 'shuffle', name: 'Shuffle', steps: [0, 3, 4, 7, 8, 11, 12, 15], why: 'Skipping hi-hats that bounce. Lovely with swing turned up.' },
  { id: 'gallop', name: 'Gallop', steps: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], why: 'A galloping horse rhythm that drives rock songs forward.' },
  { id: 'none', name: 'No hi-hat', steps: [], why: 'No hi-hat. Fewer sounds, more space.' },
]

/** Which drum patterns suit each style. The first of each list is the safest choice. */
export const DRUM_FITS: Record<GenreId, { kick: string[]; snare: string[]; hat: string[] }> = {
  pop: { kick: ['heartbeat', 'four', 'double'], snare: ['backbeat', 'pickup', 'motown'], hat: ['eighth', 'sixteenth', 'offbeat'] },
  hiphop: { kick: ['bounce', 'rolling', 'laidback', 'sparse'], snare: ['backbeat', 'halftime', 'ghost'], hat: ['eighth', 'trap', 'sixteenth'] },
  lofi: { kick: ['laidback', 'bounce', 'heartbeat', 'sparse'], snare: ['backbeat', 'halftime', 'ghost'], hat: ['eighth', 'shuffle', 'quarter'] },
  rnb: { kick: ['push', 'laidback', 'bounce'], snare: ['backbeat', 'ghost', 'halftime'], hat: ['sixteenth', 'eighth', 'shuffle'] },
  dance: { kick: ['four'], snare: ['backbeat', 'motown'], hat: ['offbeat', 'sixteenth', 'eighth'] },
  rock: { kick: ['heartbeat', 'double', 'four'], snare: ['backbeat', 'pickup', 'motown'], hat: ['eighth', 'quarter', 'gallop'] },
  acoustic: { kick: ['heartbeat', 'sparse', 'none'], snare: ['backbeat', 'halftime', 'none'], hat: ['quarter', 'eighth', 'shuffle', 'none'] },
  latin: { kick: ['four', 'heartbeat'], snare: ['dembow', 'backbeat'], hat: ['eighth', 'sixteenth', 'offbeat'] },
}

/** Tempo zones per style: green inside a zone, yellow just outside, red far outside. */
export const TEMPO_ZONES: Record<GenreId, [number, number][]> = {
  pop: [[95, 125]],
  hiphop: [[80, 100], [130, 150]],
  lofi: [[70, 90]],
  rnb: [[65, 100]],
  dance: [[118, 130]],
  rock: [[95, 140]],
  acoustic: [[70, 120]],
  latin: [[88, 105]],
}
export type TempoZone = 'in' | 'near' | 'far'
export function tempoZone(genre: GenreId, bpm: number): TempoZone {
  const zones = TEMPO_ZONES[genre]
  const dist = Math.min(...zones.map(([a, b]) => (bpm < a ? a - bpm : bpm > b ? bpm - b : 0)))
  return dist === 0 ? 'in' : dist <= 10 ? 'near' : 'far'
}

// `fits` lists the styles each sound suits, so every screen can say "Fits Lo-fi" without hiding the other options.
export const KITS: { id: KitId; name: string; folder: string; fits: GenreId[] }[] = [
  { id: 'acoustic', name: 'Acoustic kit', folder: 'acoustic-kit', fits: ['rock', 'pop', 'acoustic'] },
  { id: 'kit8', name: '808 machine', folder: 'Kit8', fits: ['hiphop', 'latin', 'pop'] },
  { id: 'cr78', name: 'Vintage machine', folder: 'CR78', fits: ['lofi', 'rnb'] },
  { id: 'linn', name: '80s machine', folder: 'LINN', fits: ['pop', 'rnb', 'dance'] },
  { id: 'techno', name: 'Club kit', folder: 'Techno', fits: ['dance'] },
  { id: 'breakbeat', name: 'Breakbeat', folder: 'breakbeat13', fits: ['hiphop', 'lofi'] },
  { id: 'r8', name: 'Studio machine', folder: 'R8', fits: ['rnb', 'pop'] },
  { id: 'kit3', name: 'Dusty kit', folder: 'Kit3', fits: ['lofi', 'hiphop'] },
  { id: 'kpr77', name: 'Toy machine', folder: 'KPR77', fits: ['lofi', 'dance'] },
  { id: 'stark', name: 'Hard kit', folder: 'Stark', fits: ['hiphop', 'rock'] },
  { id: 'fm', name: 'Electro kit', folder: '4OP-FM', fits: ['dance', 'pop'] },
  { id: 'bongos', name: 'Bongos', folder: 'Bongos', fits: ['latin', 'acoustic'] },
  { id: 'break8', name: 'Funk break', folder: 'breakbeat8', fits: ['hiphop', 'rnb'] },
  { id: 'break9', name: 'Soul break', folder: 'breakbeat9', fits: ['lofi', 'rnb'] },
]

export const LEADS: { id: LeadId; name: string; icon: IconName; fits: GenreId[] }[] = [
  { id: 'piano', name: 'Piano', icon: 'keys', fits: ['pop', 'lofi', 'acoustic', 'rnb'] },
  { id: 'flute', name: 'Flute', icon: 'flute', fits: ['acoustic', 'lofi', 'hiphop'] },
  { id: 'guitar', name: 'Acoustic guitar', icon: 'guitar', fits: ['acoustic', 'pop'] },
  { id: 'eguitar', name: 'Electric guitar', icon: 'eguitar', fits: ['rock', 'pop'] },
  { id: 'nylon', name: 'Spanish guitar', icon: 'guitar', fits: ['latin', 'acoustic'] },
  { id: 'violin', name: 'Violin', icon: 'violin', fits: ['acoustic', 'rnb', 'pop'] },
  { id: 'sax', name: 'Saxophone', icon: 'sax', fits: ['rnb', 'lofi'] },
  { id: 'trumpet', name: 'Trumpet', icon: 'trumpet', fits: ['latin', 'hiphop'] },
  { id: 'harp', name: 'Harp', icon: 'harp', fits: ['acoustic', 'lofi'] },
  { id: 'organ', name: 'Organ', icon: 'keys', fits: ['rock', 'rnb'] },
  { id: 'synth', name: 'Synth', icon: 'synth', fits: ['dance', 'pop', 'hiphop'] },
  { id: 'bells', name: 'Bells', icon: 'xylophone', fits: ['hiphop', 'lofi', 'pop'] },
]
export const CHORD_INSTS: { id: ChordInstId; name: string; icon: IconName; fits: GenreId[]; why: string }[] = [
  { id: 'piano', name: 'Piano', icon: 'keys', fits: ['pop', 'lofi', 'rnb', 'acoustic'], why: 'Full chords twice a bar. Works in almost any style.' },
  { id: 'guitar', name: 'Acoustic guitar', icon: 'guitar', fits: ['acoustic', 'pop', 'latin'], why: 'Strummed chords with a bounce. Warm and human.' },
  { id: 'eguitar', name: 'Electric guitar', icon: 'eguitar', fits: ['rock'], why: 'Loud power chords on every eighth note. The sound of rock.' },
  { id: 'nylon', name: 'Spanish guitar', icon: 'guitar', fits: ['latin', 'acoustic', 'lofi'], why: 'Picked one string at a time, soft and warm.' },
  { id: 'strings', name: 'Strings', icon: 'cello', fits: ['acoustic', 'rnb', 'pop'], why: 'Long violin and cello chords that make a song feel big.' },
  { id: 'organ', name: 'Organ', icon: 'keys', fits: ['rock', 'rnb'], why: 'A held, buzzy chord. Classic in rock and soul.' },
  { id: 'harp', name: 'Harp', icon: 'harp', fits: ['acoustic', 'lofi'], why: 'Rippling chord notes that sparkle.' },
  { id: 'pad', name: 'Synth pad', icon: 'synth', fits: ['dance', 'hiphop', 'lofi', 'pop'], why: 'A soft, wide cloud of sound that holds each chord.' },
]
export const BASSES: { id: BassId; name: string; why: string; fits: GenreId[] }[] = [
  { id: 'roots', name: 'Follow the kick', why: 'Plays the chord root on every kick. Locks bass and drums together.', fits: ['pop', 'lofi', 'rnb', 'acoustic'] },
  { id: 'electric', name: 'Bass guitar', why: 'A real electric bass following the kick, as in rock and funk.', fits: ['rock', 'pop', 'rnb'] },
  { id: 'eighths', name: 'Driving', why: 'Steady eighth notes that push the song forward, as in rock and dance.', fits: ['rock', 'dance'] },
  { id: 'octave', name: 'Disco octaves', why: 'Jumps between a low and a high note. The disco and funk bounce.', fits: ['dance', 'pop'] },
  { id: 'sub', name: '808', why: 'A long, deep bass you feel more than hear. The hip-hop and reggaeton sound.', fits: ['hiphop', 'latin'] },
  { id: 'none', name: 'No bass', why: 'No bass at all. Lighter, for acoustic and intro moments.', fits: ['acoustic'] },
]
export const EXTRAS: { id: ExtraId; name: string; icon: IconName; why: string; fits: GenreId[] }[] = [
  { id: 'strings', name: 'Strings', icon: 'violin', why: 'Long violin and cello notes that make a song feel big.', fits: ['pop', 'acoustic', 'rnb', 'rock'] },
  { id: 'guitar', name: 'Guitar strums', icon: 'guitar', why: 'Rhythmic acoustic strums that add warmth.', fits: ['acoustic', 'pop', 'latin'] },
  { id: 'eguitar', name: 'Power chords', icon: 'eguitar', why: 'Loud electric guitar chords that make a chorus explode.', fits: ['rock'] },
  { id: 'organ', name: 'Organ', icon: 'keys', why: 'A held organ chord that fills the background.', fits: ['rock', 'rnb'] },
  { id: 'arp', name: 'Synth arpeggio', icon: 'synth', why: 'Fast repeating chord notes that add sparkle and motion.', fits: ['dance', 'pop'] },
  { id: 'flute', name: 'Flute line', icon: 'flute', why: 'A second, higher melody that answers yours.', fits: ['acoustic', 'lofi'] },
  { id: 'pad', name: 'Soft pad', icon: 'layers', why: 'A quiet cushion of sound that fills the gaps.', fits: ['lofi', 'hiphop', 'dance'] },
]

export type Progression = { chords: string[]; why: string }

export type Genre = {
  id: GenreId
  name: string
  icon: IconName
  tagline: string
  facts: string[]
  bpm: Record<Feeling, number>
  swing: number
  kit: Record<Feeling, KitId>
  drums: Record<Feeling, { kick: string; snare: string; hat: string }>
  chords: Record<Feeling, Progression[]>
  bass: BassId
  lead: LeadId
  chordInst: ChordInstId
  extras: ExtraId[]
}

export const GENRES: Genre[] = [
  {
    id: 'pop', name: 'Pop', icon: 'starmic', tagline: 'Catchy songs for the radio',
    facts: ['100 to 120 BPM', 'A kick and snare you can clap to', 'A catchy melody that repeats'],
    bpm: { bright: 112, dark: 100 }, swing: 0, kit: { bright: 'acoustic', dark: 'linn' },
    drums: { bright: { kick: 'heartbeat', snare: 'backbeat', hat: 'eighth' }, dark: { kick: 'heartbeat', snare: 'halftime', hat: 'eighth' } },
    chords: {
      bright: [{ chords: ['C', 'G', 'Am', 'F'], why: 'The four chords behind many pop hits.' }, { chords: ['F', 'G', 'C', 'Am'], why: 'Builds up and lands on a bright chord.' }],
      dark: [{ chords: ['Am', 'F', 'C', 'G'], why: 'The pop chords, starting on the minor one.' }, { chords: ['Am', 'Em', 'F', 'G'], why: 'Two minor chords first, for a moodier start.' }],
    },
    bass: 'roots', lead: 'piano', chordInst: 'pad', extras: ['strings', 'arp'],
  },
  {
    id: 'hiphop', name: 'Hip-hop', icon: 'boombox', tagline: 'Beats for rapping',
    facts: ['Boom bap 85 to 95 BPM, trap 130 to 150', 'Hard drums, the voice is the star', 'Deep bass you can feel'],
    bpm: { bright: 92, dark: 140 }, swing: 0.12, kit: { bright: 'breakbeat', dark: 'kit8' },
    drums: { bright: { kick: 'bounce', snare: 'backbeat', hat: 'eighth' }, dark: { kick: 'rolling', snare: 'halftime', hat: 'trap' } },
    chords: {
      bright: [{ chords: ['Dm', 'G', 'C', 'Am'], why: 'A jazzy loop, common in classic hip-hop.' }, { chords: ['F', 'G', 'Em', 'Am'], why: 'Rises, then settles on a minor chord.' }],
      dark: [{ chords: ['Am', 'F', 'Dm', 'Em'], why: 'All the darker chords. Serious and tense.' }, { chords: ['Am', 'Am', 'F', 'G'], why: 'Stays on one chord, which leaves room for the rapper.' }],
    },
    bass: 'sub', lead: 'bells', chordInst: 'piano', extras: ['pad'],
  },
  {
    id: 'lofi', name: 'Lo-fi', icon: 'cassette', tagline: 'Relaxed beats to study to',
    facts: ['70 to 90 BPM', 'Lazy, swung drums', 'Soft, warm and a little dusty'],
    bpm: { bright: 82, dark: 74 }, swing: 0.3, kit: { bright: 'cr78', dark: 'cr78' },
    drums: { bright: { kick: 'laidback', snare: 'backbeat', hat: 'eighth' }, dark: { kick: 'laidback', snare: 'backbeat', hat: 'quarter' } },
    chords: {
      bright: [{ chords: ['Dm', 'G', 'C', 'Am'], why: 'A jazz loop that lo-fi producers love.' }, { chords: ['F', 'Em', 'Dm', 'C'], why: 'Steps down gently, like sinking into a couch.' }],
      dark: [{ chords: ['Am', 'Dm', 'Em', 'Am'], why: 'Minor chords only, for a rainy-day mood.' }, { chords: ['Dm', 'Am', 'Em', 'Am'], why: 'Drifts between minor chords without resolving.' }],
    },
    bass: 'roots', lead: 'piano', chordInst: 'piano', extras: ['pad'],
  },
  {
    id: 'rnb', name: 'R&B', icon: 'rose', tagline: 'Smooth, soulful grooves',
    facts: ['70 to 100 BPM', 'A smooth groove with soft ghost notes', 'Lush chords and a smooth voice'],
    bpm: { bright: 92, dark: 78 }, swing: 0.15, kit: { bright: 'r8', dark: 'r8' },
    drums: { bright: { kick: 'laidback', snare: 'ghost', hat: 'sixteenth' }, dark: { kick: 'laidback', snare: 'halftime', hat: 'eighth' } },
    chords: {
      bright: [{ chords: ['F', 'Em', 'Dm', 'G'], why: 'Smooth steps down that lead back home.' }, { chords: ['C', 'Am', 'Dm', 'G'], why: 'A classic soul progression.' }],
      dark: [{ chords: ['Am', 'F', 'Dm', 'Em'], why: 'Soft and moody, good for late-night songs.' }, { chords: ['Dm', 'Am', 'F', 'Em'], why: 'Floats between minor chords.' }],
    },
    bass: 'roots', lead: 'sax', chordInst: 'piano', extras: ['strings', 'organ'],
  },
  {
    id: 'dance', name: 'Dance', icon: 'discoball', tagline: 'Club and festival energy',
    facts: ['120 to 130 BPM', 'A kick on every beat', 'Builds up, then drops'],
    bpm: { bright: 124, dark: 126 }, swing: 0, kit: { bright: 'techno', dark: 'techno' },
    drums: { bright: { kick: 'four', snare: 'backbeat', hat: 'offbeat' }, dark: { kick: 'four', snare: 'backbeat', hat: 'sixteenth' } },
    chords: {
      bright: [{ chords: ['F', 'G', 'Am', 'C'], why: 'Lifts higher with every chord.' }, { chords: ['C', 'G', 'Am', 'F'], why: 'The pop chords at club speed.' }],
      dark: [{ chords: ['Am', 'F', 'C', 'G'], why: 'Minor and driving, made for a dark club.' }, { chords: ['Am', 'G', 'F', 'G'], why: 'Walks down and back up, good for a build.' }],
    },
    bass: 'eighths', lead: 'synth', chordInst: 'pad', extras: ['arp'],
  },
  {
    id: 'rock', name: 'Rock', icon: 'eguitar', tagline: 'Guitars and big drums',
    facts: ['100 to 140 BPM', 'A loud backbeat with driving hi-hats', 'Guitars carry the song'],
    bpm: { bright: 120, dark: 108 }, swing: 0, kit: { bright: 'acoustic', dark: 'acoustic' },
    drums: { bright: { kick: 'heartbeat', snare: 'backbeat', hat: 'eighth' }, dark: { kick: 'bounce', snare: 'backbeat', hat: 'quarter' } },
    chords: {
      bright: [{ chords: ['C', 'F', 'G', 'F'], why: 'Three bright chords, as in classic rock.' }, { chords: ['C', 'G', 'F', 'C'], why: 'Simple and loud, built for singing along.' }],
      dark: [{ chords: ['Am', 'G', 'F', 'G'], why: 'The minor rock walk-down.' }, { chords: ['Am', 'F', 'G', 'Am'], why: 'Starts and ends on minor, so it feels heavy.' }],
    },
    bass: 'electric', lead: 'eguitar', chordInst: 'eguitar', extras: ['eguitar', 'organ'],
  },
  {
    id: 'acoustic', name: 'Acoustic', icon: 'campfire', tagline: 'Campfire songs and ballads',
    facts: ['70 to 110 BPM', 'Soft drums, or none at all', 'Guitar, piano and real instruments'],
    bpm: { bright: 96, dark: 72 }, swing: 0, kit: { bright: 'acoustic', dark: 'acoustic' },
    drums: { bright: { kick: 'heartbeat', snare: 'backbeat', hat: 'quarter' }, dark: { kick: 'sparse', snare: 'halftime', hat: 'quarter' } },
    chords: {
      bright: [{ chords: ['C', 'F', 'C', 'G'], why: 'Warm and simple, easy to sing over.' }, { chords: ['C', 'Am', 'F', 'G'], why: 'The 1950s progression, still everywhere.' }],
      dark: [{ chords: ['Am', 'F', 'C', 'G'], why: 'The classic sad-ballad chords.' }, { chords: ['C', 'Em', 'Am', 'G'], why: 'Starts bright, then turns sad halfway.' }],
    },
    bass: 'roots', lead: 'flute', chordInst: 'guitar', extras: ['strings'],
  },
  {
    id: 'latin', name: 'Latin', icon: 'maracas', tagline: 'Reggaeton and Latin pop',
    facts: ['90 to 100 BPM', 'The dembow drum rhythm', 'Made for dancing'],
    bpm: { bright: 96, dark: 92 }, swing: 0, kit: { bright: 'kit8', dark: 'kit8' },
    drums: { bright: { kick: 'four', snare: 'dembow', hat: 'eighth' }, dark: { kick: 'four', snare: 'dembow', hat: 'sixteenth' } },
    chords: {
      bright: [{ chords: ['F', 'G', 'C', 'Am'], why: 'Sunny and danceable.' }, { chords: ['C', 'G', 'Am', 'F'], why: 'The pop chords with a Latin beat.' }],
      dark: [{ chords: ['Am', 'F', 'C', 'G'], why: 'Minor and moody, as in modern reggaeton.' }, { chords: ['Am', 'Dm', 'G', 'C'], why: 'Moves through minor chords to a bright ending.' }],
    },
    bass: 'sub', lead: 'trumpet', chordInst: 'nylon', extras: ['guitar', 'arp'],
  },
]

export const FEELING_INFO: Record<Feeling, { name: string; icon: IconName; text: string }> = {
  bright: { name: 'Bright', icon: 'bright', text: 'Major chords and a lighter beat. Sounds happy, hopeful or fun.' },
  dark: { name: 'Dark', icon: 'dark', text: 'Minor chords and more space. Sounds sad, serious or intense.' },
}

export const option = (list: LayerOption[], id: string) => list.find((o) => o.id === id) ?? list[0]

/** Build a 4-bar drum grid from one-bar lesson choices. */
export function gridFrom(kick: string, snare: string, hat: string): DrumGrid {
  const g = emptyDrums()
  const k = option(KICKS, kick).steps
  const s = option(SNARES, snare).steps
  const h = option(HATS, hat).steps
  for (let i = 0; i < STEPS; i++) {
    const b = i % 16
    g.kick[i] = k.includes(b)
    g.snare[i] = s.includes(b)
    g.hat[i] = h.includes(b)
  }
  return g
}

/** The chorus version of a beat: busier hi-hats make the chorus feel bigger. */
export function chorusOf(verse: DrumGrid): DrumGrid {
  const count = verse.hat.slice(0, 16).filter(Boolean).length
  const hat = verse.hat.map((on, i) => on || (count <= 4 ? i % 2 === 0 : count <= 8 ? true : on))
  return { kick: [...verse.kick], snare: [...verse.snare], hat }
}

/** Plain-language summary of why the chosen beat feels the way it does. */
export function beatStory(bpm: number, kick: string, snare: string, hat: string): string {
  const parts: string[] = []
  parts.push(bpm < 85 ? 'A slow tempo feels calm or sad.' : bpm < 110 ? 'A medium tempo feels relaxed.' : 'A fast tempo feels energetic.')
  if (snare === 'halftime') parts.push('The snare on beat 3 makes it heavy and spacious.')
  if (snare === 'dembow') parts.push('The dembow snare makes it danceable.')
  if (kick === 'four') parts.push('A kick on every beat keeps it driving.')
  if (kick === 'sparse') parts.push('A single kick leaves lots of space.')
  if (hat === 'trap' || hat === 'sixteenth') parts.push('Fast hi-hats add energy.')
  if (hat === 'quarter') parts.push('Slow hi-hats keep it calm.')
  return parts.join(' ')
}

const n = (rows: number[][]): Note[] => rows.map(([start, len, midi]) => ({ start, len, midi }))

/** Original example melodies. Written for this app. */
export const EXAMPLE_TUNES: Record<Feeling, { notes: Note[]; tip: string }> = {
  bright: {
    tip: 'Bright melodies use short notes that jump upward and repeat a catchy phrase.',
    notes: n([
      [0, 2, 67], [2, 2, 67], [4, 2, 69], [6, 2, 67], [8, 4, 72], [12, 4, 71],
      [16, 2, 69], [18, 2, 69], [20, 2, 71], [22, 2, 69], [24, 4, 67], [28, 4, 64],
      [32, 2, 65], [34, 2, 65], [36, 2, 67], [38, 2, 69], [40, 4, 72], [44, 4, 74],
      [48, 2, 72], [50, 2, 71], [52, 4, 67], [56, 8, 72],
    ]),
  },
  dark: {
    tip: 'Dark melodies move in small steps and end each line on a long, falling note.',
    notes: n([
      [0, 2, 69], [2, 2, 69], [4, 2, 72], [6, 2, 71], [8, 6, 69],
      [16, 2, 65], [18, 2, 65], [20, 2, 69], [22, 2, 67], [24, 6, 64],
      [32, 2, 62], [34, 2, 62], [36, 2, 65], [38, 2, 64], [40, 6, 62],
      [48, 2, 64], [50, 2, 65], [52, 2, 64], [54, 2, 62], [56, 8, 64],
    ]),
  },
}

/** Original example chorus melodies: higher and more repetitive than the verse, so they feel like a hook. */
export const EXAMPLE_CHORUS: Record<Feeling, { notes: Note[]; tip: string }> = {
  bright: {
    tip: 'Choruses sit higher than verses and repeat one short phrase, so people remember them.',
    notes: n([
      [0, 2, 72], [2, 2, 72], [4, 2, 74], [6, 2, 72], [8, 4, 76], [12, 4, 74],
      [16, 2, 72], [18, 2, 72], [20, 2, 74], [22, 2, 72], [24, 8, 69],
      [32, 2, 72], [34, 2, 72], [36, 2, 74], [38, 2, 72], [40, 4, 76], [44, 4, 79],
      [48, 2, 77], [50, 2, 76], [52, 4, 74], [56, 8, 72],
    ]),
  },
  dark: {
    tip: 'Choruses sit higher than verses and repeat one phrase, which makes even a sad song stick.',
    notes: n([
      [0, 4, 72], [4, 2, 71], [6, 2, 69], [8, 8, 69],
      [16, 4, 71], [20, 2, 69], [22, 2, 67], [24, 8, 64],
      [32, 4, 72], [36, 2, 71], [38, 2, 69], [40, 4, 74], [44, 4, 72],
      [48, 4, 71], [52, 4, 67], [56, 8, 69],
    ]),
  },
}

const BUSIER_HAT: Record<string, string> = { quarter: 'eighth', eighth: 'sixteenth', offbeat: 'sixteenth', sixteenth: 'sixteenth', trap: 'trap', shuffle: 'sixteenth', gallop: 'gallop', none: 'quarter' }
/** Default chorus drums: the verse pattern with busier hi-hats, so the chorus feels bigger. */
export const chorusLesson = (l: { kick: string; snare: string; hat: string }) => ({ ...l, hat: BUSIER_HAT[l.hat] ?? l.hat })

export const LYRIC_PROMPTS: Record<Feeling, string[]> = {
  bright: ['The best day of your summer', 'Someone you love walking in', 'Winning the big game'],
  dark: ['Someone you miss', 'A place you cannot go back to', 'Proving everyone wrong'],
}

export const genreById = (id: GenreId) => GENRES.find((g) => g.id === id)!
