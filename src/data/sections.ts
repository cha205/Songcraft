import type { Layers } from '../audio/engine'

// How one 4-bar loop becomes a full song: the same loop, with layers added and taken away.
export const SECTIONS: { name: string; why: string; layers: Layers }[] = [
  { name: 'Intro', why: 'Just the chords, to set the mood.', layers: { drums: false, chords: true, bass: false, melody: false } },
  { name: 'Verse', why: 'The beat and bass come in, and your tune starts.', layers: { drums: true, chords: true, bass: true, melody: true } },
  { name: 'Chorus', why: 'Everything, plus bells doubling your tune. The biggest part.', layers: { drums: true, chords: true, bass: true, melody: true, double: true } },
  { name: 'Break', why: 'The drums drop out, so the last chorus hits harder.', layers: { drums: false, chords: true, bass: true, melody: true } },
  { name: 'Chorus', why: 'Back with everything.', layers: { drums: true, chords: true, bass: true, melody: true, double: true } },
  { name: 'Outro', why: 'Chords only, to say goodbye.', layers: { drums: false, chords: true, bass: false, melody: false } },
]
