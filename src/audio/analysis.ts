// Pure audio analysis: mouth sounds in, notes and drum hits out. No browser APIs, so it is unit-testable.
import { PitchDetector } from 'pitchy'

export const STEPS_PER_BAR = 16
export const BARS = 4
export const STEPS = STEPS_PER_BAR * BARS

export const DRUMS = ['kick', 'snare', 'hat'] as const
export type Drum = (typeof DRUMS)[number]
export type DrumGrid = Record<Drum, boolean[]>
export type Note = { start: number; len: number; midi: number }

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

export const stepSeconds = (bpm: number) => 60 / bpm / 4
export const noteName = (midi: number) => NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1)
export const emptyDrums = (): DrumGrid => ({
  kick: new Array(STEPS).fill(false),
  snare: new Array(STEPS).fill(false),
  hat: new Array(STEPS).fill(false),
})

function rmsAt(a: Float32Array, from: number, len: number) {
  let s = 0
  const end = Math.min(a.length, from + len)
  for (let i = from; i < end; i++) s += a[i] * a[i]
  return Math.sqrt(s / Math.max(1, end - from))
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

export type HumResult = {
  notes: Note[]
  /** semitones the tune was moved to land in C major */
  shift: number
  /** the key the user hummed in, e.g. "G" */
  hummedKey: string
}

/**
 * Hum -> notes. Pitch is measured every ~10 ms, then each 16th-note step takes the median pitch of its
 * frames (grid snap). The whole tune is moved into C major (key snap) and leftover off-key notes are
 * pushed to the nearest in-key note.
 */
export function humToNotes(samples: Float32Array, sr: number, bpm: number, preroll = 0): HumResult {
  const win = 2048
  const hop = 512
  const detector = PitchDetector.forFloat32Array(win)
  const stepDur = stepSeconds(bpm)
  const perStep: number[][] = Array.from({ length: STEPS }, () => [])
  const framesPerStep = new Array(STEPS).fill(0)

  const frameRms: number[] = []
  for (let i = 0; i + win <= samples.length; i += hop) frameRms.push(rmsAt(samples, i, win))
  const gate = Math.max(0.004, 0.08 * Math.max(0, ...frameRms))

  frameRms.forEach((r, k) => {
    const i = k * hop
    const step = Math.floor(((i + win / 2) / sr - preroll) / stepDur)
    if (step < 0 || step >= STEPS) return
    framesPerStep[step]++
    if (r < gate) return
    const [f, clarity] = detector.findPitch(samples.subarray(i, i + win), sr)
    if (clarity < 0.85 || f < 65 || f > 1100) return
    perStep[step].push(69 + 12 * Math.log2(f / 440))
  })

  const raw: (number | null)[] = perStep.map((ps, s) =>
    ps.length > 0 && ps.length >= framesPerStep[s] * 0.4 ? median(ps) : null,
  )
  const voiced = raw.filter((p): p is number => p !== null)
  if (voiced.length === 0) return { notes: [], shift: 0, hummedKey: 'C' }

  // Tuning: people hum "between" piano keys. Find the average offset and remove it.
  let cs = 0
  let sn = 0
  for (const p of voiced) {
    const a = 2 * Math.PI * (p - Math.round(p))
    cs += Math.cos(a)
    sn += Math.sin(a)
  }
  const tuning = Math.atan2(sn, cs) / (2 * Math.PI)

  // Key: try every transposition, keep the one where the most notes already sit in C major.
  let best = 0
  let bestCost = Infinity
  for (const t of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]) {
    const cost = voiced.reduce((c, p) => c + (MAJOR.includes((((Math.round(p - tuning) + t) % 12) + 12) % 12) ? 0 : 1), 0)
    if (cost < bestCost) {
      bestCost = cost
      best = t
    }
  }

  const snapped = raw.map((p) => {
    if (p === null) return null
    const exact = p - tuning + best
    let q = Math.round(exact)
    const pc = ((q % 12) + 12) % 12
    if (!MAJOR.includes(pc)) q += exact >= q ? 1 : -1
    return q
  })

  // Remove one-step glitches and fill one-step gaps inside a held note.
  for (let i = 1; i < STEPS - 1; i++) {
    if (snapped[i - 1] !== null && snapped[i - 1] === snapped[i + 1] && snapped[i] !== snapped[i - 1]) {
      snapped[i] = snapped[i - 1]
    }
  }

  // Octave: move the tune so it sits in the middle of the C4..C6 piano roll.
  const med = median(snapped.filter((p): p is number => p !== null))
  const octave = 12 * Math.round((67 - med) / 12)

  const notes: Note[] = []
  for (let i = 0; i < STEPS; i++) {
    const p = snapped[i]
    if (p === null) continue
    let midi = p + octave
    while (midi < 60) midi += 12
    while (midi > 84) midi -= 12
    const last = notes[notes.length - 1]
    if (last && last.start + last.len === i && snapped[i - 1] === p) last.len++
    else notes.push({ start: i, len: 1, midi })
  }

  return { notes, shift: best, hummedKey: NAMES[(((0 - best) % 12) + 12) % 12] }
}

export type Hit = { step: number; drum: Drum; zcr: number; low: number }

/**
 * Beatbox -> drum hits. Finds each sudden jump in loudness (an onset), then reads two numbers from the
 * first 40 ms of the sound: how often the wave crosses zero (hiss = high, boom = low) and how much of the
 * energy is deep bass. BOOM = kick, PFF/K = snare, TSS = hi-hat.
 */
export function beatboxToHits(samples: Float32Array, sr: number, bpm: number, preroll = 0): Hit[] {
  const hop = 256
  const r: number[] = []
  for (let i = 0; i + hop <= samples.length; i += hop) r.push(rmsAt(samples, i, hop * 2))
  const max = Math.max(0, ...r)
  if (max < 0.01) return []
  const thr = Math.max(0.012, max * 0.12)
  const refractory = Math.ceil((0.07 * sr) / hop)
  const stepDur = stepSeconds(bpm)
  const winLen = Math.round(0.04 * sr)
  const a = 1 - Math.exp((-2 * Math.PI * 250) / sr)

  const hits: Hit[] = []
  let last = -Infinity
  for (let k = 0; k < r.length; k++) {
    const before = k === 0 ? 0 : Math.min(...r.slice(Math.max(0, k - 4), k))
    if (r[k] < thr || r[k] < before * 1.6 + 0.002 || k - last < refractory) continue
    last = k
    const start = k * hop
    let crossings = 0
    let total = 0
    let lowE = 0
    let y = 0
    const end = Math.min(samples.length, start + winLen)
    for (let i = start; i < end; i++) {
      const x = samples[i]
      if (i > start && (x >= 0) !== (samples[i - 1] >= 0)) crossings++
      y += a * (x - y)
      total += x * x
      lowE += y * y
    }
    const zcr = crossings / Math.max(1, end - start)
    const low = total > 0 ? lowE / total : 0
    const drum: Drum = low > 0.4 || zcr < 0.07 ? 'kick' : zcr > 0.2 ? 'hat' : 'snare'
    const step = Math.max(0, Math.round((start / sr - preroll) / stepDur))
    if (step < STEPS) hits.push({ step, drum, zcr, low })
  }
  return hits
}

export function hitsToGrid(hits: Hit[]): DrumGrid {
  const g = emptyDrums()
  for (const h of hits) g[h.drum][h.step] = true
  return g
}

type Chord = { name: string; root: number; pcs: number[]; common: number }
const CHORDS: Chord[] = [
  { name: 'C', root: 0, pcs: [0, 4, 7], common: 1 },
  { name: 'Dm', root: 2, pcs: [2, 5, 9], common: 0.5 },
  { name: 'Em', root: 4, pcs: [4, 7, 11], common: 0.4 },
  { name: 'F', root: 5, pcs: [5, 9, 0], common: 0.9 },
  { name: 'G', root: 7, pcs: [7, 11, 2], common: 0.9 },
  { name: 'Am', root: 9, pcs: [9, 0, 4], common: 0.9 },
]
const FALLBACK = ['C', 'G', 'Am', 'F']

/** One chord per bar: the in-key chord that contains the most of the tune's notes in that bar. */
export function pickChords(notes: Note[]): string[] {
  const out: string[] = []
  for (let b = 0; b < BARS; b++) {
    const lo = b * STEPS_PER_BAR
    const hi = lo + STEPS_PER_BAR
    const weight = new Array(12).fill(0)
    for (const n of notes) {
      const overlap = Math.min(hi, n.start + n.len) - Math.max(lo, n.start)
      if (overlap <= 0) continue
      weight[n.midi % 12] += overlap * (n.start % 4 === 0 ? 1.5 : 1)
    }
    const total = weight.reduce((s, w) => s + w, 0)
    if (total === 0) {
      out.push(FALLBACK[b])
      continue
    }
    const prev = out[b - 1]
    let best = CHORDS[0]
    let bestScore = -Infinity
    for (const c of CHORDS) {
      const fit = c.pcs.reduce((s, pc) => s + weight[pc], 0) / total
      const score = fit + 0.15 * c.common - (c.name === prev ? 0.2 : 0) + (b === 0 && c.name === 'C' ? 0.1 : 0)
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    out.push(best.name)
  }
  return out
}

export function chordMidis(name: string): number[] {
  const c = CHORDS.find((x) => x.name === name) ?? CHORDS[0]
  const third = c.name.endsWith('m') ? 3 : 4
  return [48 + c.root, 48 + c.root + third, 48 + c.root + 7]
}

export const bassMidi = (name: string) => 36 + (CHORDS.find((x) => x.name === name)?.root ?? 0)
