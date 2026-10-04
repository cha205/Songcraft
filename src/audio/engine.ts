// Playback + mic recording. Tone.js plays the instruments; an AudioWorklet captures the mic with
// sample-accurate timestamps so recorded sounds line up with the beat grid.
import * as Tone from 'tone'
import { BARS, STEPS, bassMidi, chordMidis, emptyDrums, stepSeconds } from './analysis'
import type { Note } from './analysis'
import { KITS } from '../data/genres'
import type { BassId, ChordInstId, ExtraId, KitId, LeadId } from '../data/genres'

/** Which parts are audible. `double` adds the melody an octave up on bells (used in choruses). */
export type Layers = { drums: boolean; chords: boolean; bass: boolean; melody: boolean; double?: boolean; extras?: boolean }
export const ALL: Layers = { drums: true, chords: true, bass: true, melody: true, extras: true }
/** One 4-bar section of the full song: which drum pattern it uses and which parts play. */
export type SectionPlan = { kind: 'verse' | 'chorus'; layers: Layers }

/** The song the sequencer reads on every step. React writes into it; the audio thread never waits on React. */
export const song = {
  bpm: 90,
  swing: 0,
  kit: 'acoustic' as KitId,
  verse: emptyDrums(),
  chorus: emptyDrums(),
  fill: false,
  part: 'verse' as 'verse' | 'chorus',
  notes: [] as Note[],
  chords: null as string[] | null,
  lead: 'piano' as LeadId,
  chordInst: 'pad' as ChordInstId,
  bass: 'roots' as BassId,
  extras: [] as ExtraId[],
  layers: ALL,
}

// Full-song mode: one plan per 4-bar section.
let arrangement: SectionPlan[] | null = null
let section = -1
let onSection: (i: number) => void = () => {}
let songDone: (() => void) | null = null

type Mode = 'play' | 'rec-drums' | 'rec-hum'
let mode: Mode = 'play'
let clickWhileRecording = false
let onStep: (step: number) => void = () => {}
export const setStepListener = (fn: (step: number) => void) => (onStep = fn)

let inst: ReturnType<typeof build> | null = null
let seq: Tone.Sequence<number> | null = null

const freq = (midi: number) => Tone.Frequency(midi, 'midi').toFrequency()

// Real instrument samples (tonejs-instruments, CC BY 3.0) and drum kits (Tone.js drum-samples).
const NB = 'https://nbrosowsky.github.io/tonejs-instruments/samples/'
const SAMPLED: Record<'flute' | 'violin' | 'cello' | 'guitar', { folder: string; notes: string[]; volume: number }> = {
  flute: { folder: 'flute', notes: ['C4', 'E4', 'A4', 'C5', 'E5', 'A5', 'C6', 'E6', 'A6', 'C7'], volume: -6 },
  violin: { folder: 'violin', notes: ['G3', 'A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'G5', 'A5', 'C6', 'E6', 'G6', 'A6', 'C7'], volume: -8 },
  cello: { folder: 'cello', notes: ['C2', 'E2', 'G2', 'A2', 'C3', 'E3', 'G3', 'A3', 'C4', 'E4', 'G4', 'A4', 'C5'], volume: -8 },
  guitar: { folder: 'guitar-acoustic', notes: ['E2', 'G2', 'A2', 'C3', 'E3', 'G3', 'A3', 'C4', 'E4', 'G4', 'A4', 'C5'], volume: -4 },
}
const samplers: Partial<Record<keyof typeof SAMPLED, Tone.Sampler>> = {}
const kits: Partial<Record<KitId, Tone.Players>> = {}

function build() {
  // Keep the mix from clipping when every part hits at once.
  Tone.getDestination().chain(new Tone.Limiter(-1))
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).toDestination()
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 } }).toDestination()
  kick.volume.value = -2
  const snare = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).connect(new Tone.Filter(1200, 'highpass').toDestination())
  snare.volume.value = -8
  const hat = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }).connect(new Tone.Filter(7000, 'highpass').toDestination())
  hat.volume.value = -14
  // Unpitched tick so it never fools the hum pitch detector.
  const click = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.02, sustain: 0 } }).connect(new Tone.Filter(3000, 'bandpass').toDestination())
  click.volume.value = -4
  const piano = new Tone.Sampler({
    urls: { C2: 'C2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3', C6: 'C6.mp3' },
    baseUrl: 'https://tonejs.github.io/audio/salamander/',
    release: 1,
  }).connect(reverb)
  const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.3 } }).connect(
    new Tone.Filter(2200, 'lowpass').connect(reverb),
  )
  synth.volume.value = -10
  const bells = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.01, modulationIndex: 10, envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 1 } }).connect(reverb)
  bells.volume.value = -8
  const pad = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.3, decay: 0.3, sustain: 0.6, release: 1.2 } }).connect(
    new Tone.Filter(1400, 'lowpass').connect(reverb),
  )
  pad.volume.value = -16
  const pluck = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.2 } }).connect(reverb)
  pluck.volume.value = -14
  const bass = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.2 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, baseFrequency: 200, octaves: 2 },
  }).toDestination()
  bass.volume.value = -8
  const sub = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    portamento: 0.04,
    envelope: { attack: 0.005, decay: 0.9, sustain: 0.3, release: 0.4 },
    filterEnvelope: { attack: 0.005, decay: 0.3, sustain: 1, baseFrequency: 300, octaves: 1 },
  }).toDestination()
  sub.volume.value = -3
  const drumBus = new Tone.Volume(-2).toDestination()
  return { kick, snare, hat, click, piano, synth, bells, pad, pluck, bass, sub, reverb, drumBus }
}

function sampler(name: keyof typeof SAMPLED): Tone.Sampler | null {
  if (!inst) return null
  if (!samplers[name]) {
    const s = SAMPLED[name]
    samplers[name] = new Tone.Sampler({
      urls: Object.fromEntries(s.notes.map((n) => [n, `${n}.mp3`])),
      baseUrl: `${NB}${s.folder}/`,
      release: 1,
      volume: s.volume,
    }).connect(inst.reverb)
  }
  const sm = samplers[name]!
  return sm.loaded ? sm : null
}

function kit(id: KitId): Tone.Players | null {
  if (!inst) return null
  if (!kits[id]) {
    const folder = KITS.find((k) => k.id === id)?.folder ?? 'acoustic-kit'
    const base = `https://tonejs.github.io/audio/drum-samples/${folder}/`
    const p = new Tone.Players({ kick: `${base}kick.mp3`, snare: `${base}snare.mp3`, hihat: `${base}hihat.mp3` }).connect(inst.drumBus)
    kits[id] = p
  }
  const p = kits[id]!
  return p.loaded ? p : null
}

/** Start downloading the samples a song needs, so they are ready when it plays. */
export async function preload(opts: { kit?: KitId; lead?: LeadId; chordInst?: ChordInstId; extras?: ExtraId[] }) {
  await ensure(false)
  if (opts.kit) kit(opts.kit)
  const names = new Set<keyof typeof SAMPLED>()
  if (opts.lead === 'flute' || opts.lead === 'violin' || opts.lead === 'guitar') names.add(opts.lead)
  if (opts.chordInst === 'guitar' || opts.extras?.includes('guitar')) names.add('guitar')
  if (opts.chordInst === 'strings' || opts.extras?.includes('strings')) names.add('violin').add('cello')
  if (opts.extras?.includes('flute')) names.add('flute')
  names.forEach((n) => sampler(n))
}

function hitDrum(d: 'kick' | 'snare' | 'hat', time: number, vel = 1) {
  if (!inst) return
  const players = kit(song.kit)
  if (players) {
    const p = players.player(d === 'hat' ? 'hihat' : d)
    p.volume.value = (d === 'hat' ? -7 : 0) + 20 * Math.log10(vel)
    p.start(time)
    return
  }
  if (d === 'kick') inst.kick.triggerAttackRelease('C1', '8n', time, vel)
  else if (d === 'snare') inst.snare.triggerAttackRelease('16n', time, vel)
  else inst.hat.triggerAttackRelease('32n', time, vel)
}

function playLead(midi: number, dur: number, time: number, vel = 1) {
  if (!inst) return
  const l = song.lead
  const s = l === 'flute' || l === 'violin' || l === 'guitar' ? sampler(l) : null
  if (s) s.triggerAttackRelease(freq(midi), dur, time, vel)
  else if (l === 'piano' && inst.piano.loaded) inst.piano.triggerAttackRelease(freq(midi), dur, time, vel)
  else if (l === 'bells') inst.bells.triggerAttackRelease(freq(midi), dur, time, vel)
  else inst.synth.triggerAttackRelease(freq(midi), dur, time, vel)
}

function strum(notes: number[], dur: number, time: number, vel: number) {
  const g = sampler('guitar')
  notes.forEach((m, i) => (g ? g.triggerAttackRelease(freq(m), dur, time + i * 0.018, vel) : inst!.pluck.triggerAttackRelease(freq(m), dur, time + i * 0.018, vel * 0.8)))
}

function playStrings(chord: string, dur: number, time: number, vel: number) {
  const v = sampler('violin')
  const c = sampler('cello')
  const tones = chordMidis(chord).map((m) => m + 12)
  if (v) tones.forEach((m) => v.triggerAttackRelease(freq(m), dur, time, vel * 0.7))
  else inst!.pad.triggerAttackRelease(tones.map(freq), dur, time, vel)
  if (c) c.triggerAttackRelease(freq(bassMidi(chord) + 12), dur, time, vel * 0.8)
}

/** Chords on the chosen instrument. Called on every step; each instrument decides when to play. */
function playChords(kind: ChordInstId | ExtraId, chord: string, step: number, time: number, bar: number, vel: number) {
  const b = step % 16
  const tones = chordMidis(chord)
  if (kind === 'piano' && (b === 0 || b === 8)) {
    if (inst!.piano.loaded) inst!.piano.triggerAttackRelease(tones.map(freq), bar / 2, time, vel * 0.7)
    else inst!.pad.triggerAttackRelease(tones.map(freq), bar / 2, time, vel)
  } else if (kind === 'guitar' && [0, 6, 8, 12].includes(b)) {
    strum([tones[0] - 12, ...tones], bar / 4, time, b === 0 ? vel * 0.8 : vel * 0.55)
  } else if (kind === 'strings' && b === 0) {
    playStrings(chord, bar * 0.98, time, vel)
  } else if (kind === 'pad' && b === 0) {
    inst!.pad.triggerAttackRelease(tones.map(freq), '1m', time, vel)
  } else if (kind === 'arp' && b % 2 === 0) {
    const order = [0, 1, 2, 1]
    inst!.pluck.triggerAttackRelease(freq(tones[order[(b / 2) % 4]] + 12), '16n', time, vel * 0.6)
  } else if (kind === 'flute' && (b === 0 || b === 8)) {
    const f = sampler('flute')
    const m = (b === 0 ? tones[2] : tones[1]) + 12
    if (f) f.triggerAttackRelease(freq(m), bar * 0.4, time, vel * 0.6)
    else inst!.bells.triggerAttackRelease(freq(m), bar * 0.4, time, vel * 0.4)
  }
}

function tick(time: number, step: number) {
  if (!inst) return
  const { notes, chords, bpm } = song

  if (arrangement && step === 0) {
    section++
    if (section >= arrangement.length) {
      Tone.getTransport().stop(time)
      const done = songDone
      setTimeout(() => done?.(), Math.max(0, (time - Tone.getContext().currentTime) * 1000))
      return
    }
    const i = section
    Tone.getDraw().schedule(() => onSection(i), time)
  }
  const plan = arrangement ? arrangement[section] : null
  const L = mode === 'play' ? (plan ? plan.layers : song.layers) : null
  const grid = plan ? (plan.kind === 'chorus' ? song.chorus : song.verse) : mode === 'play' && song.part === 'chorus' ? song.chorus : song.verse
  const hasDrums = grid.kick.some(Boolean) || grid.snare.some(Boolean) || grid.hat.some(Boolean)
  const barLen = stepSeconds(bpm) * 16

  if (mode === 'rec-hum' || L?.drums) {
    if (song.fill && step >= 60 && mode === 'play') {
      // A fill at the end of the loop: four quick snares lead into the next section.
      if (step === 60) hitDrum('kick', time)
      hitDrum('snare', time, 0.55 + (step - 60) * 0.15)
    } else {
      if (grid.kick[step]) hitDrum('kick', time)
      if (grid.snare[step]) hitDrum('snare', time)
      if (grid.hat[step]) hitDrum('hat', time, step % 4 === 0 ? 1 : 0.7)
    }
  }
  const wantClick = mode !== 'play' && (clickWhileRecording || (mode === 'rec-hum' && !hasDrums))
  if (wantClick && step % 4 === 0) inst.click.triggerAttackRelease('32n', time)

  if (L?.melody) {
    for (const n of notes) {
      if (n.start !== step) continue
      const dur = n.len * stepSeconds(bpm) * 0.95
      playLead(n.midi, dur, time)
      if (L.double) inst.bells.triggerAttackRelease(freq(n.midi + 12), dur, time, 0.35)
    }
  }
  if (chords) {
    const chord = chords[Math.floor(step / 16)]
    // While humming, the chords play quietly so they guide the voice without leaking into the mic much.
    if (mode === 'rec-hum') {
      if (step % 16 === 0) inst.pad.triggerAttackRelease(chordMidis(chord).map(freq), '1m', time, 0.4)
    } else if (L?.chords) {
      playChords(song.chordInst, chord, step, time, barLen, 1)
    }
    if (L?.extras) {
      for (const e of song.extras) if (e !== song.chordInst) playChords(e, chord, step, time, barLen, 0.8)
    }
    if (L?.bass) {
      const bar = Math.floor(step / 16) * 16
      const barHasKick = grid.kick.slice(bar, bar + 16).some(Boolean)
      const onKick = barHasKick ? grid.kick[step] : step % 8 === 0
      const root = freq(bassMidi(chord))
      if (song.bass === 'eighths' && step % 2 === 0) inst.bass.triggerAttackRelease(root, '16n', time, step % 4 === 0 ? 1 : 0.7)
      else if (song.bass === 'sub' && onKick) inst.sub.triggerAttackRelease(root, stepSeconds(bpm) * 3.5, time)
      else if (song.bass === 'roots' && onKick) inst.bass.triggerAttackRelease(root, '8n', time)
    }
  }
  Tone.getDraw().schedule(() => onStep(step), time)
}

async function ensure(startAudio = true) {
  if (startAudio) await Tone.start()
  if (!inst) inst = build()
  if (!seq) {
    seq = new Tone.Sequence<number>(tick, Array.from({ length: STEPS }, (_, i) => i), '16n')
    seq.start(0)
  }
  const t = Tone.getTransport()
  t.bpm.value = song.bpm
  t.swing = song.swing
  t.swingSubdivision = '16n'
  if (startAudio) await Promise.race([Tone.loaded(), new Promise((r) => setTimeout(r, 4000))])
}

export function setBpm(bpm: number) {
  song.bpm = bpm
  Tone.getTransport().bpm.value = bpm
}

export function setSwing(swing: number) {
  song.swing = swing
  Tone.getTransport().swing = swing
  Tone.getTransport().swingSubdivision = '16n'
}

export async function play() {
  await ensure()
  const t = Tone.getTransport()
  t.stop()
  t.position = 0
  mode = 'play'
  arrangement = null
  t.start('+0.05')
}

export function stop() {
  Tone.getTransport().stop()
  arrangement = null
  songDone?.()
  onStep(-1)
}

/**
 * Play the whole arranged song once while capturing the speakers' signal. Resolves with a WAV file, or null if
 * stopped early. `sectionCb` gets each section index as it starts, and -1 at the end.
 */
export async function playSong(sections: SectionPlan[], sectionCb: (i: number) => void): Promise<Blob | null> {
  await ensure()
  await ensureWorklet()
  stop()
  // Tap the master output with the same worklet approach as the mic: raw samples, no codec, no MediaRecorder.
  const ctx = Tone.getContext()
  const tap = ctx.createAudioWorkletNode('songmaker-tap', { channelCount: 2, channelCountMode: 'explicit' })
  const sink = ctx.createGain()
  sink.gain.value = 0
  const left: Float32Array[] = []
  const right: Float32Array[] = []
  tap.port.onmessage = (e: MessageEvent<[Float32Array, Float32Array]>) => {
    left.push(e.data[0])
    right.push(e.data[1])
  }
  Tone.getDestination().connect(tap)
  tap.connect(sink)
  sink.connect(ctx.rawContext.destination)

  arrangement = sections
  section = -1
  onSection = sectionCb
  mode = 'play'
  return new Promise((resolve) => {
    songDone = async () => {
      const finished = arrangement !== null
      songDone = null
      arrangement = null
      onStep(-1)
      // Let the reverb ring out before cutting the file.
      if (finished) await new Promise((r) => setTimeout(r, 2500))
      Tone.getDestination().disconnect(tap)
      tap.disconnect()
      sink.disconnect()
      sectionCb(-1)
      resolve(finished ? encodeWav([join(left), join(right)], ctx.sampleRate) : null)
    }
    const t = Tone.getTransport()
    t.position = 0
    t.start('+0.1')
  })
}

function join(parts: Float32Array[]) {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function encodeWav(data: Float32Array[], sampleRate: number): Blob {
  const ch = data.length
  const len = data[0].length
  const out = new DataView(new ArrayBuffer(44 + len * ch * 2))
  const str = (o: number, x: string) => [...x].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  out.setUint32(4, 36 + len * ch * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  out.setUint32(16, 16, true)
  out.setUint16(20, 1, true)
  out.setUint16(22, ch, true)
  out.setUint32(24, sampleRate, true)
  out.setUint32(28, sampleRate * ch * 2, true)
  out.setUint16(32, ch * 2, true)
  out.setUint16(34, 16, true)
  str(36, 'data')
  out.setUint32(40, len * ch * 2, true)
  let o = 44
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, data[c][i]))
      out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true)
      o += 2
    }
  }
  return new Blob([out], { type: 'audio/wav' })
}

let rawPlayer: Tone.Player | null = null
export async function playRaw(samples: Float32Array) {
  await ensure()
  stop()
  rawPlayer?.dispose()
  rawPlayer = new Tone.Player(Tone.ToneAudioBuffer.fromArray(samples)).toDestination()
  rawPlayer.start()
}

const WORKLET = `class SongmakerRec extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (ch) this.port.postMessage({ frame: currentFrame, data: ch.slice(0) })
    return true
  }
}
registerProcessor('songmaker-rec', SongmakerRec)
class SongmakerTap extends AudioWorkletProcessor {
  process(inputs) {
    const i = inputs[0]
    if (i && i.length) this.port.postMessage([i[0].slice(0), (i[1] || i[0]).slice(0)])
    return true
  }
}
registerProcessor('songmaker-tap', SongmakerTap)`
let workletReady = false
async function ensureWorklet() {
  if (workletReady) return
  await Tone.getContext().addAudioWorkletModule(URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' })))
  workletReady = true
}

export type Recording = { samples: Float32Array; sampleRate: number; preroll: number }

/**
 * Count in one bar, then record BARS bars from the mic while the beat (or a click) plays.
 * `onCount` gets 4,3,2,1 during the count-in, then "rec" with the bar number while recording.
 */
export async function record(
  kind: 'drums' | 'hum',
  opts: { click: boolean; onCount: (label: string) => void },
): Promise<Recording> {
  await ensure()
  stop()
  const ctx = Tone.getContext()
  await ensureWorklet()
  const stream = await navigator.mediaDevices.getUserMedia({
    // Noise suppression treats a steady hum as noise and deletes it, so it stays off.
    audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
  })
  const src = ctx.createMediaStreamSource(stream)
  const node = ctx.createAudioWorkletNode('songmaker-rec')
  const sink = ctx.createGain()
  sink.gain.value = 0
  const chunks: { frame: number; data: Float32Array }[] = []
  node.port.onmessage = (e: MessageEvent<{ frame: number; data: Float32Array }>) => chunks.push(e.data)
  src.connect(node)
  node.connect(sink)
  sink.connect(ctx.rawContext.destination)

  const beat = 60 / song.bpm
  const t0 = Tone.now() + 0.2
  const recStart = t0 + 4 * beat
  const dur = BARS * 4 * beat
  const draw = Tone.getDraw()
  for (let i = 0; i < 4; i++) {
    inst!.click.triggerAttackRelease('32n', t0 + i * beat)
    draw.schedule(() => opts.onCount(String(4 - i)), t0 + i * beat)
  }
  for (let b = 0; b < BARS; b++) draw.schedule(() => opts.onCount(`rec ${b + 1}`), recStart + b * 4 * beat)

  mode = kind === 'drums' ? 'rec-drums' : 'rec-hum'
  clickWhileRecording = opts.click
  const t = Tone.getTransport()
  t.position = 0
  t.start(recStart)
  t.stop(recStart + dur)

  const endAt = recStart + dur + 0.3
  await new Promise((r) => setTimeout(r, (endAt - ctx.currentTime) * 1000))

  src.disconnect()
  node.disconnect()
  sink.disconnect()
  stream.getTracks().forEach((tr) => tr.stop())
  mode = 'play'
  opts.onCount('')
  onStep(-1)

  // People hear the beat a little late (speaker latency) and the mic adds its own delay.
  const raw = ctx.rawContext as AudioContext
  const latency = (raw.outputLatency || 0) + 0.015
  const sr = ctx.sampleRate
  const preroll = stepSeconds(song.bpm) / 2
  const first = Math.round((recStart + latency - preroll) * sr)
  const samples = new Float32Array(Math.round((dur + preroll) * sr))
  for (const c of chunks) {
    for (let j = 0; j < c.data.length; j++) {
      const idx = c.frame + j - first
      if (idx >= 0 && idx < samples.length) samples[idx] = c.data[j]
    }
  }
  return { samples, sampleRate: sr, preroll }
}
