import { Icon } from '../components/Icon'
import { TEMPLATES, VIBES } from '../data/templates'
import type { VibeId } from '../data/templates'

type Props = { vibe: VibeId | null; onPick: (v: VibeId) => void }

export function VibeStep({ vibe, onPick }: Props) {
  return (
    <section className="step">
      <div className="card hero">
        <div className="hero-bg" />
        <div className="hero-in">
          <span className="hero-kicker">
            <Icon name="sparkle" size={22} /> Producer school for total beginners
          </span>
          <h2 className="hero-title">What song do you want to make?</h2>
          <p className="hero-text">
            Every producer starts with a feeling. The feeling decides how fast the song is, which chords it uses, and how busy the
            drums are. Pick one and we will show you how famous songs pull it off.
          </p>
        </div>
      </div>

      <div className="vibes">
        {VIBES.map((v, i) => {
          const refs = TEMPLATES.filter((t) => t.vibe === v.id && t.ref).map((t) => t.ref!.title)
          return (
            <button
              key={v.id}
              className={`vibe-card vibe-${v.id}${vibe === v.id ? ' picked' : ''}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => onPick(v.id)}
            >
              <div className="vibe-art" style={{ backgroundImage: `url(/assets/scenes/scene_${v.id}.webp)` }}>
                <span className="vibe-badge">
                  <Icon name={v.id} size={46} />
                </span>
              </div>
              <div className="vibe-body">
                <div className="vibe-name">{v.name}</div>
                <div className="vibe-tag">{v.tagline}</div>
                <span className="chip">
                  <Icon name="metronome" size={18} /> {v.bpmText}
                </span>
                <ul>
                  {v.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {refs.length > 0 && (
                  <div className="vibe-refs">
                    <Icon name="headphones" size={20} /> Learn from {refs.join(' & ')}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
