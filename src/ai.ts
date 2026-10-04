// Client for /api/gemini (Vercel function in production, Vite middleware with gcloud in development).
import type { BassId, ChordInstId, ExtraId, Feeling, GenreId, KitId, LeadId } from './data/genres'

export type Blueprint = {
  genre: GenreId
  feeling: Feeling
  bpm: number
  kick: string
  snare: string
  hat: string
  kit: KitId
  chords: string[]
  chordInst: ChordInstId
  bass: BassId
  lead: LeadId
  extras: ExtraId[]
  title: string
  topic: string
  reasons: { part: string; why: string }[]
  model: string
}

export type LyricDraft = { lines: string[]; tip: string; model: string }

async function ask<T>(task: 'blueprint' | 'lyrics', payload: unknown): Promise<T> {
  const r = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, payload }) })
  const data = await r.json().catch(() => ({ error: 'Gemini sent an unreadable reply.' }))
  if (!r.ok) throw new Error(data.error || 'Gemini is unavailable right now.')
  return data as T
}

export const planSong = (text: string) => ask<Blueprint>('blueprint', { text })

export const writeLyrics = (payload: { genre: string; feeling: Feeling; topic: string; title: string; syllables: number[] }) =>
  ask<LyricDraft>('lyrics', payload)
