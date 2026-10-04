// Fit a hum recorded on its own (not along to the beat) into the song: trim the silence at both ends, stretch it to
// the nearest 1, 2 or 4 bars at the song's tempo, snap the notes to eighth notes and repeat it to fill the loop.
import { BARS, humToNotes } from './analysis'
import type { HumResult, Note } from './analysis'

export type FittedHum = HumResult & { bars: number; seconds: number }

export function fitHum(samples: Float32Array, sampleRate: number, bpm: number): FittedHum {
  let peak = 0
  for (let i = 0; i < samples.length; i += 16) peak = Math.max(peak, Math.abs(samples[i]))
  const gate = peak * 0.12
  let start = 0
  while (start < samples.length && Math.abs(samples[start]) < gate) start++
  let end = samples.length - 1
  while (end > start && Math.abs(samples[end]) < gate) end--
  const pad = Math.round(sampleRate * 0.04)
  const clip = samples.subarray(Math.max(0, start - pad), Math.min(samples.length, end + pad))
  const seconds = clip.length / sampleRate
  const barSec = 240 / bpm
  // The bar count closest to how long the hum naturally is, so it is stretched as little as possible.
  const bars = [1, 2, 4].reduce((best, n) => (Math.abs(Math.log2(seconds / barSec / n)) < Math.abs(Math.log2(seconds / barSec / best)) ? n : best), 4)
  const res = humToNotes(clip, sampleRate, (240 * bars) / Math.max(0.5, seconds), 0)
  const span = bars * 16
  const snapped: Note[] = []
  for (const n of res.notes.filter((x) => x.start < span).sort((a, b) => a.start - b.start)) {
    const s = Math.min(span - 2, Math.round(n.start / 2) * 2)
    if (snapped.length && snapped[snapped.length - 1].start === s) continue
    snapped.push({ start: s, len: Math.max(2, Math.round(n.len / 2) * 2), midi: n.midi })
  }
  // Each note lasts until the next one starts, at most.
  snapped.forEach((n, i) => {
    const next = i + 1 < snapped.length ? snapped[i + 1].start : span
    n.len = Math.max(1, Math.min(n.len, next - n.start))
  })
  const notes: Note[] = []
  for (let k = 0; k < BARS / bars; k++) for (const n of snapped) notes.push({ ...n, start: n.start + k * span })
  return { ...res, notes, bars, seconds }
}
