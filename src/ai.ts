// Client for /api/gemini (Vercel function in production, Vite middleware with gcloud in development).
import type { BassId, ChordInstId, ExtraId, Feeling, GenreId, KitId, LeadId } from './data/genres'

export type Blueprint = {
  summary: string
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
}

export type PlanSet = { plans: Blueprint[]; model: string }
export type LyricDraft = { lines: string[]; tip: string; model: string }
export type Coaching = { good: string; tip: string; model: string }

async function ask<T>(task: 'blueprint' | 'lyrics' | 'coach', payload: unknown): Promise<T> {
  const r = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, payload }) })
  const data = await r.json().catch(() => ({ error: 'Gemini sent an unreadable reply.' }))
  if (!r.ok) throw new Error(data.error || 'Gemini is unavailable right now.')
  return data as T
}

export const planSong = (text: string) => ask<PlanSet>('blueprint', { text })

export const writeLyrics = (payload: { genre: string; feeling: Feeling; topic: string; title: string; syllables: number[]; part: string }) =>
  ask<LyricDraft>('lyrics', payload)

export const coachTake = (payload: { kind: 'beat' | 'melody'; samples: Float32Array; sampleRate: number; bpm: number; genre: string; feeling: Feeling; target: string }) =>
  ask<Coaching>('coach', { kind: payload.kind, bpm: payload.bpm, genre: payload.genre, feeling: payload.feeling, target: payload.target, audio: toWav16k(payload.samples, payload.sampleRate) })

/** Downsample a recording to 16 kHz mono 16-bit WAV and return it as base64, small enough to send to Gemini. */
function toWav16k(samples: Float32Array, sampleRate: number): string {
  const ratio = sampleRate / 16000
  const len = Math.floor(samples.length / ratio)
  const pcm = new Int16Array(len)
  for (let i = 0; i < len; i++) {
    const a = Math.floor(i * ratio)
    const b = Math.max(a + 1, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = a; j < b; j++) sum += samples[j] ?? 0
    const v = Math.max(-1, Math.min(1, sum / (b - a)))
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff
  }
  const buf = new DataView(new ArrayBuffer(44 + len * 2))
  const str = (o: number, s: string) => [...s].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  buf.setUint32(4, 36 + len * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  buf.setUint32(16, 16, true)
  buf.setUint16(20, 1, true)
  buf.setUint16(22, 1, true)
  buf.setUint32(24, 16000, true)
  buf.setUint32(28, 32000, true)
  buf.setUint16(32, 2, true)
  buf.setUint16(34, 16, true)
  str(36, 'data')
  buf.setUint32(40, len * 2, true)
  new Uint8Array(buf.buffer, 44).set(new Uint8Array(pcm.buffer))
  let bin = ''
  const bytes = new Uint8Array(buf.buffer)
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
