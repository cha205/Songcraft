import { describe, expect, it } from 'vitest'
import { EXAMPLE_CHORUS, EXAMPLE_TUNES, gridFrom } from './genres'
import { decodeSong, encodeSong } from './share'
import type { SharedSong } from './share'

const song: SharedSong = {
  genre: 'hiphop',
  feeling: 'dark',
  length: 'full',
  bpm: 86,
  swing: 0.15,
  kit: 'kit8',
  fill: true,
  chordInst: 'pad',
  bass: 'sub',
  lead: 'bells',
  extras: ['strings', 'pad'],
  title: 'Paper Planes at Midnight',
  topic: 'missing my friends after moving away',
  parts: {
    verse: { grid: gridFrom('rolling', 'halftime', 'trap'), notes: EXAMPLE_TUNES.dark.notes, chords: ['Am', 'F', 'C', 'G'], lyrics: ['Empty streets and quiet rooms', 'Your old jacket on my chair', 'Every song still sounds like you', 'Looking up, you are not there'] },
    chorus: { grid: gridFrom('rolling', 'halftime', 'sixteenth'), notes: EXAMPLE_CHORUS.dark.notes, chords: ['F', 'G', 'Am', 'Am'], lyrics: ['Paper planes at midnight', 'Flying out to you', 'Paper planes at midnight', 'Tell me you miss me too'] },
  },
  sections: null,
}

describe('song links', () => {
  it('round-trips a whole song', async () => {
    const code = await encodeSong(song)
    expect(await decodeSong(code)).toEqual(song)
  })

  it('stays short enough for a QR code', async () => {
    const code = await encodeSong(song)
    expect(code.length).toBeLessThan(1200)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('replaces unknown values from a tampered link', async () => {
    const code = await encodeSong({ ...song, genre: 'polka' as never, bpm: 999 })
    const back = await decodeSong(code)
    expect(back.genre).toBe('pop')
    expect(back.bpm).toBe(160)
  })
})
