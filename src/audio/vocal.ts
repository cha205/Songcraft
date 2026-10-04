// Clean up a sung take before it goes into the song. No browser APIs, so it is unit-testable.
// 1. Noise gate: the quiet parts between phrases (room hiss, breathing, fan noise) fade to silence.
// 2. Normalize: the loudest moment is brought to -1 dBFS, so every take starts at the same level.

const FRAME = 480 // 10 ms at 48 kHz

export function cleanVocal(samples: Float32Array, sampleRate: number): Float32Array {
  const frame = Math.max(64, Math.round((FRAME * sampleRate) / 48000))
  const frames = Math.ceil(samples.length / frame)
  const rms = new Float32Array(frames)
  for (let f = 0; f < frames; f++) {
    let sum = 0
    const end = Math.min(samples.length, (f + 1) * frame)
    for (let i = f * frame; i < end; i++) sum += samples[i] * samples[i]
    rms[f] = Math.sqrt(sum / Math.max(1, end - f * frame))
  }
  const sorted = Float32Array.from(rms).sort()
  const floor = sorted[Math.floor(frames * 0.1)] ?? 0
  const loud = sorted[Math.floor(frames * 0.95)] ?? 0
  // Open the gate a little above the room noise, but never above a tenth of the singing level.
  const threshold = Math.min(Math.max(floor * 3, 0.004), loud * 0.1 || 0.004)

  // Gate gain per frame with a fast attack and a slower release, so word endings are not cut off.
  const gain = new Float32Array(frames)
  let g = 0
  let hold = 0
  for (let f = 0; f < frames; f++) {
    if (rms[f] > threshold) hold = 15
    const target = hold > 0 ? 1 : 0
    if (hold > 0) hold--
    g += (target - g) * (target > g ? 0.6 : 0.12)
    gain[f] = g
  }

  const out = new Float32Array(samples.length)
  let peak = 0
  for (let i = 0; i < samples.length; i++) {
    const f = i / frame
    const a = Math.min(frames - 1, Math.floor(f))
    const b = Math.min(frames - 1, a + 1)
    const v = samples[i] * (gain[a] + (gain[b] - gain[a]) * (f - a))
    out[i] = v
    peak = Math.max(peak, Math.abs(v))
  }
  if (peak > 1e-4) {
    const k = 0.89 / peak
    for (let i = 0; i < out.length; i++) out[i] *= k
  }
  return out
}
