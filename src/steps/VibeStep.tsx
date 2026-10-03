import { TEMPLATES, VIBES } from '../data/templates'
import type { VibeId } from '../data/templates'

type Props = { vibe: VibeId | null; onPick: (v: VibeId) => void }

export function VibeStep({ vibe, onPick }: Props) {
  return (
    <section className="step">
      <h2>What kind of song do you want to make?</h2>
      <p className="lead">
        Every producer starts with a feeling. The feeling decides how fast the song is, which chords it uses, and how busy the drums
        are. Pick one and we will show you how famous songs pull it off.
      </p>
      <div className="vibes">
        {VIBES.map((v) => {
          const refs = TEMPLATES.filter((t) => t.vibe === v.id && t.ref).map((t) => t.ref!.title)
          return (
            <button key={v.id} className={`vibe vibe-${v.id}${vibe === v.id ? ' picked' : ''}`} onClick={() => onPick(v.id)}>
              <span className="vibe-name">{v.name}</span>
              <span className="vibe-tag">{v.tagline}</span>
              <span className="vibe-bpm">{v.bpmText}</span>
              <ul>
                {v.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {refs.length > 0 && <span className="vibe-refs">Learn from: {refs.join(', ')}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
