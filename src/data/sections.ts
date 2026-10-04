import type { Layers, SectionPlan } from '../audio/engine'

export type Section = SectionPlan & { name: string; why: string }
export type LayerKey = 'drums' | 'bass' | 'chords' | 'melody' | 'extras'
export type SongLength = 'verse' | 'chorus' | 'full'
export type PartId = 'verse' | 'chorus'

export const LENGTHS: { id: SongLength; name: string; detail: string }[] = [
  { id: 'verse', name: 'Just a verse', detail: 'One part, about 25 seconds' },
  { id: 'chorus', name: 'Just a chorus', detail: 'One catchy part, about 25 seconds' },
  { id: 'full', name: 'Full song', detail: 'Verse and chorus, about a minute' },
]

const L = (drums: boolean, bass: boolean, chords: boolean, melody: boolean, extras: boolean, double = false): Layers => ({ drums, bass, chords, melody, extras, double })

// How the two core loops become a full song: the verse and chorus take turns, with parts added and taken away.
const FULL: Section[] = [
  { name: 'Intro', kind: 'verse', why: 'Chords only, to set the mood.', layers: L(false, false, true, false, true) },
  { name: 'Verse', kind: 'verse', why: 'The beat, bass and your verse melody.', layers: L(true, true, true, true, false) },
  { name: 'Chorus', kind: 'chorus', why: 'Your chorus, with everything playing.', layers: L(true, true, true, true, true, true) },
  { name: 'Verse', kind: 'verse', why: 'Back to the verse, now with the added instruments.', layers: L(true, true, true, true, true) },
  { name: 'Chorus', kind: 'chorus', why: 'The chorus again, the biggest moment.', layers: L(true, true, true, true, true, true) },
  { name: 'Outro', kind: 'verse', why: 'Chords only, to close the song.', layers: L(false, false, true, false, true) },
]

/** Sections for the chosen length. A single part repeats enough times to last about 25 seconds. */
export function sectionsFor(length: SongLength, bpm: number): Section[] {
  if (length === 'full') return FULL
  const loopSeconds = 960 / bpm
  const passes = Math.max(2, Math.min(4, Math.round(25 / loopSeconds)))
  const label = length === 'verse' ? 'Verse' : 'Chorus'
  return Array.from({ length: passes }, (_, i) => ({
    name: `${label} ${i + 1}`,
    kind: length,
    why: i === 0 ? 'The core loop.' : i === passes - 1 ? 'Everything together for the ending.' : 'The loop again, a little bigger.',
    layers: L(true, true, true, true, i > 0, length === 'chorus' && i === passes - 1),
  }))
}
