// Playback + mic recording. Tone.js plays the instruments; an AudioWorklet captures the mic with
// sample-accurate timestamps so recorded sounds line up with the beat grid.
import * as Tone from 'tone'
import { BARS, STEPS, bassMidi, chordMidis, emptyDrums, stepSeconds } from './analysis'
import type { DrumGrid, Note } from './analysis'

export type Instrument = 'piano' | 'synth' | 'bells'

/** Which parts are audible. `double` adds the tune an octave up on bells (used in choruses). */
export type Layers = { drums: boolean; chords: boolean; bass: boolean; melody: boolean; double?: boolean }
export const ALL: Layers = { drums: true, chords: true, bass: true, melody: true }

/** The song the sequencer reads on every step. React writes into it; the audio thread never waits on React. */
export const song: {
  bpm: number
  drums: DrumGrid
  notes: Note[]
  chords: string[] | null
  instrument: Instrument
  layers: Layers
} = { bpm: 90, drums: emptyDrums(), notes: [], chords: null, instrument: 'piano', layers: ALL }

// Full-song mode: one Layers entry per 4-bar section.
let arrangement: Layers[] | null = null
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

function build() {
  // Keep the mix from clipping when drums, chords, bass and two melody layers all hit at once.
  Tone.getDestination().chain(new Tone.Limiter(-1))
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).toDestination()
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
  }).toDestination()
  kick.volume.value = -2
  const snare = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).connect(
    new Tone.Filter(1200, 'highpass').toDestination(),
  )
  snare.volume.value = -8
  const hat = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }).connect(
    new Tone.Filter(7000, 'highpass').toDestination(),
  )
  hat.volume.value = -14
  // Unpitched tick so it never fools the hum pitch detector.
  const click = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.02, sustain: 0 } }).connect(
    new Tone.Filter(3000, 'bandpass').toDestination(),
  )
  click.volume.value = -4
  const piano = new Tone.Sampler({
    urls: { C2: 'C2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3', C6: 'C6.mp3' },
    baseUrl: 'https://tonejs.github.io/audio/salamander/',
    release: 1,
  }).connect(reverb)
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.3 },
  }).connect(new Tone.Filter(2200, 'lowpass').connect(reverb))
  synth.volume.value = -10
  const bells = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.01,
    modulationIndex: 10,
    envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 1 },
  }).connect(reverb)
  bells.volume.value = -8
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.3, decay: 0.3, sustain: 0.6, release: 1.2 },
  }).connect(new Tone.Filter(1400, 'lowpass').connect(reverb))
  pad.volume.value = -16
  const bass = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.2 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, baseFrequency: 200, octaves: 2 },
  }).toDestination()
  bass.volume.value = -8
  return { kick, snare, hat, click, piano, synth, bells, pad, bass }
}

function tick(time: number, step: number) {
  if (!inst) return
  const { drums, notes, chords, instrument, bpm } = song
  const hasDrums = drums.kick.some(Boolean) || drums.snare.some(Boolean) || drums.hat.some(Boolean)

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
  const L = mode === 'play' ? (arrangement ? arrangement[section] : song.layers) : null

  if (mode === 'rec-hum' || L?.drums) {
    if (drums.kick[step]) inst.kick.triggerAttackRelease('C1', '8n', time)
    if (drums.snare[step]) inst.snare.triggerAttackRelease('16n', time)
    if (drums.hat[step]) inst.hat.triggerAttackRelease('32n', time)
  }
  const wantClick = mode !== 'play' && (clickWhileRecording || (mode === 'rec-hum' && !hasDrums))
  if (wantClick && step % 4 === 0) inst.click.triggerAttackRelease('32n', time)

  if (L?.melody) {
    // The piano samples stream in from a CDN; use the synth until they arrive.
    const lead = instrument === 'piano' && inst.piano.loaded ? inst.piano : instrument === 'bells' ? inst.bells : inst.synth
    for (const n of notes) {
      if (n.start !== step) continue
      const dur = n.len * stepSeconds(bpm) * 0.95
      lead.triggerAttackRelease(freq(n.midi), dur, time)
      if (L.double) inst.bells.triggerAttackRelease(freq(n.midi + 12), dur, time, 0.35)
    }
  }
  if (chords) {
    const chord = chords[Math.floor(step / 16)]
    // While humming, the chords play quietly so they guide the voice without leaking into the mic much.
    if (step % 16 === 0 && (mode === 'rec-hum' || L?.chords)) {
      inst.pad.triggerAttackRelease(chordMidis(chord).map(freq), '1m', time, mode === 'rec-hum' ? 0.4 : 1)
    }
    if (L?.bass) {
      const bar = Math.floor(step / 16) * 16
      const barHasKick = drums.kick.slice(bar, bar + 16).some(Boolean)
      if (barHasKick ? drums.kick[step] : step % 8 === 0) inst.bass.triggerAttackRelease(freq(bassMidi(chord)), '8n', time)
    }
  }
  Tone.getDraw().schedule(() => onStep(step), time)
}

async function ensure() {
  await Tone.start()
  if (!inst) inst = build()
  if (!seq) {
    seq = new Tone.Sequence<number>(tick, Array.from({ length: STEPS }, (_, i) => i), '16n')
    seq.start(0)
  }
  Tone.getTransport().bpm.value = song.bpm
  await Promise.race([Tone.loaded(), new Promise((r) => setTimeout(r, 4000))])
}

export function setBpm(bpm: number) {
  song.bpm = bpm
  Tone.getTransport().bpm.value = bpm
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
export async function playSong(sections: Layers[], sectionCb: (i: number) => void): Promise<Blob | null> {
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
