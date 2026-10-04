import { TEMPO_NOTES, TEMPO_ZONES, tempoZone } from '../data/genres'
import type { Genre } from '../data/genres'
import { Icon } from './Icon'

const MIN = 60
const MAX = 160
const COLOR = { in: '#35c27a', near: '#ffc83d', far: '#ff6b6b' }

/** Tempo slider coloured for the chosen style: green inside its usual range, yellow close to it, red far from it. */
export function TempoSlider({ genre, bpm, onBpm }: { genre: Genre; bpm: number; onBpm: (v: number) => void }) {
  const stops: string[] = []
  let prev = ''
  for (let b = MIN; b <= MAX; b++) {
    const c = COLOR[tempoZone(genre.id, b)]
    const at = ((b - MIN) / (MAX - MIN)) * 100
    if (c !== prev) {
      if (prev) stops.push(`${prev} ${at}%`)
      stops.push(`${c} ${at}%`)
      prev = c
    }
  }
  stops.push(`${prev} 100%`)
  const zones = TEMPO_ZONES[genre.id]
  const zone = tempoZone(genre.id, bpm)
  const nearest = zones.reduce((best, z) => (Math.abs((z[0] + z[1]) / 2 - bpm) < Math.abs((best[0] + best[1]) / 2 - bpm) ? z : best))
  const dir = bpm < nearest[0] ? 'slow' : 'fast'
  const label = zone === 'in' ? `In the ${genre.name} zone` : zone === 'near' ? `A little ${dir} for ${genre.name}` : `Very ${dir} for ${genre.name}`
  return (
    <div className="tempo">
      <div className="tempo-head">
        <Icon name="metronome" size={34} />
        <b>Tempo</b>
        <span className={`tempo-chip z-${zone}`}>
          {bpm} BPM · {label}
        </span>
      </div>
      <div className="tempo-track" style={{ background: `linear-gradient(90deg, ${stops.join(', ')})` }}>
        <input type="range" min={MIN} max={MAX} value={bpm} onChange={(e) => onBpm(+e.target.value)} aria-label="Tempo in beats per minute" />
      </div>
      <div className="tempo-scale">
        <span>{MIN} slow</span>
        <span>{(MIN + MAX) / 2}</span>
        <span>{MAX} fast</span>
      </div>
      <p>
        BPM means beats per minute. {TEMPO_NOTES[genre.id]} Green is the usual range, yellow is close, and red will sound unusual for {genre.name}, which can also be a
        bold choice.
      </p>
    </div>
  )
}
