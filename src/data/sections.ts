import type { Layers } from '../audio/engine'

// How one 4-bar loop becomes a full song: the same loop, with layers added and taken away.
export const SECTIONS: { name: string; why: string; layers: Layers }[] = [
  { name: 'Intro', why: 'Chords only, to set the mood.', layers: { drums: false, chords: true, bass: false, melody: false } },
  { name: 'Verse', why: 'The drums, bass, and melody enter.', layers: { drums: true, chords: true, bass: true, melody: true } },
  { name: 'Chorus', why: 'Every part plays, with bells doubling the melody.', layers: { drums: true, chords: true, bass: true, melody: true, double: true } },
  { name: 'Break', why: 'The drums drop out so the final chorus feels bigger.', layers: { drums: false, chords: true, bass: true, melody: true } },
  { name: 'Chorus', why: 'All parts return.', layers: { drums: true, chords: true, bass: true, melody: true, double: true } },
  { name: 'Outro', why: 'Chords only, to close the song.', layers: { drums: false, chords: true, bass: false, melody: false } },
]
