import type { Layers, SectionPlan } from '../audio/engine'

export type Section = SectionPlan & { name: string; why: string }
export type LayerKey = 'drums' | 'bass' | 'chords' | 'melody' | 'extras'

// How one 4-bar loop becomes a full song: the same loop, with parts added and taken away.
const L = (drums: boolean, bass: boolean, chords: boolean, melody: boolean, extras: boolean, double = false): Layers => ({ drums, bass, chords, melody, extras, double })

export const DEFAULT_SECTIONS: Section[] = [
  { name: 'Intro', kind: 'verse', why: 'Chords only, to set the mood.', layers: L(false, false, true, false, true) },
  { name: 'Verse', kind: 'verse', why: 'The drums, bass and melody enter.', layers: L(true, true, true, true, false) },
  { name: 'Chorus', kind: 'chorus', why: 'Everything plays, with bells doubling the melody.', layers: L(true, true, true, true, true, true) },
  { name: 'Break', kind: 'verse', why: 'The drums drop out so the last chorus feels bigger.', layers: L(false, true, true, true, true) },
  { name: 'Chorus', kind: 'chorus', why: 'All parts return.', layers: L(true, true, true, true, true, true) },
  { name: 'Outro', kind: 'verse', why: 'Chords only, to close the song.', layers: L(false, false, true, false, true) },
]
