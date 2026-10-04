// A whole song fits in a link: settings, both drum grids, melodies, chords and lyrics, packed into bytes, deflated and
// written in base64url after "#song=". Nothing is uploaded; whoever opens the link rebuilds the song in their browser.
import { DRUMS, STEPS } from '../audio/analysis'
import type { DrumGrid, Note } from '../audio/analysis'
import type { Layers } from '../audio/engine'
import { BASSES, CHORD_INSTS, EXTRAS, GENRES, KITS, LEADS } from './genres'
import type { BassId, ChordInstId, ExtraId, Feeling, GenreId, KitId, LeadId } from './genres'
import type { PartId, SongLength } from './sections'

export type SharedPart = { grid: DrumGrid; notes: Note[]; chords: string[]; lyrics: string[] }
export type SharedSong = {
  genre: GenreId
  feeling: Feeling
  length: SongLength
  bpm: number
  swing: number
  kit: KitId
  fill: boolean
  chordInsts: ChordInstId[]
  bass: BassId
  lead: LeadId
  extras: ExtraId[]
  title: string
  topic: string
  parts: Record<PartId, SharedPart>
  /** Layers per section, only when the arrangement was edited. */
  sections: Layers[] | null
}

const LAYER_KEYS = ['drums', 'bass', 'chords', 'melody', 'extras', 'double'] as const
// Links come from anywhere, so every value is checked against what the app supports.
const one = <T extends string>(v: unknown, list: { id: T }[]): T => list.find((x) => x.id === v)?.id ?? list[0].id

const gridBits = (g: DrumGrid) => {
  const bytes = new Uint8Array((DRUMS.length * STEPS) / 8)
  DRUMS.forEach((d, r) => g[d].forEach((on, i) => on && (bytes[(r * STEPS + i) >> 3] |= 1 << ((r * STEPS + i) & 7))))
  return bytes
}
const bitsGrid = (bytes: Uint8Array): DrumGrid => {
  const g = {} as DrumGrid
  DRUMS.forEach((d, r) => (g[d] = Array.from({ length: STEPS }, (_, i) => !!(bytes[(r * STEPS + i) >> 3] & (1 << ((r * STEPS + i) & 7))))))
  return g
}
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

export async function encodeSong(s: SharedSong): Promise<string> {
  const part = (p: SharedPart) => [b64(gridBits(p.grid)), b64(Uint8Array.from(p.notes.flatMap((n) => [n.start, n.len, n.midi]))), p.chords.join(' '), p.lyrics]
  const sections = s.sections?.map((l) => LAYER_KEYS.reduce((m, k, i) => m | (l[k] ? 1 << i : 0), 0))
  const json = JSON.stringify([1, s.genre, s.feeling, s.length, s.bpm, s.swing, s.kit, s.fill ? 1 : 0, s.chordInsts, s.bass, s.lead, s.extras, s.title, s.topic, part(s.parts.verse), part(s.parts.chorus), sections ?? 0])
  const packed = await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw'))
  return b64(packed).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function decodeSong(code: string): Promise<SharedSong> {
  const raw = unb64(code.replace(/-/g, '+').replace(/_/g, '/'))
  const a = JSON.parse(new TextDecoder().decode(await pipe(raw, new DecompressionStream('deflate-raw'))))
  if (a[0] !== 1) throw new Error('Unknown song link version')
  const part = (p: [string, string, string, string[]]): SharedPart => {
    const n = unb64(p[1])
    const notes: Note[] = []
    for (let i = 0; i + 2 < n.length; i += 3) notes.push({ start: n[i], len: n[i + 1], midi: n[i + 2] })
    return { grid: bitsGrid(unb64(p[0])), notes, chords: p[2].split(' ').filter(Boolean).slice(0, 4), lyrics: [...p[3], '', '', '', ''].slice(0, 4).map((l) => String(l).slice(0, 80)) }
  }
  const sections = Array.isArray(a[16]) ? (a[16] as number[]).map((m) => Object.fromEntries(LAYER_KEYS.map((k, i) => [k, !!(m & (1 << i))])) as Layers) : null
  return {
    genre: one(a[1], GENRES),
    feeling: a[2] === 'dark' ? 'dark' : 'bright',
    length: a[3] === 'verse' || a[3] === 'chorus' ? a[3] : 'full',
    bpm: Math.max(60, Math.min(160, Number(a[4]) || 100)),
    swing: Math.max(0, Math.min(0.5, Number(a[5]) || 0)),
    kit: one(a[6], KITS),
    fill: !!a[7],
    chordInsts: (Array.isArray(a[8]) ? a[8] : [a[8]]).filter((c: unknown) => CHORD_INSTS.some((x) => x.id === c)),
    bass: one(a[9], BASSES),
    lead: one(a[10], LEADS),
    extras: (Array.isArray(a[11]) ? a[11] : []).filter((e: unknown) => EXTRAS.some((x) => x.id === e)),
    title: String(a[12] ?? '').slice(0, 40),
    topic: String(a[13] ?? '').slice(0, 80),
    parts: { verse: part(a[14]), chorus: part(a[15]) },
    sections,
  }
}
