import { Icon } from '../components/Icon'
import { TEMPLATES, VIBES } from '../data/templates'
import type { VibeId } from '../data/templates'

type Props = { vibe: VibeId | null; onPick: (v: VibeId) => void }

const HOW = [
  { icon: 'headphones', title: 'Learn', text: 'See how a well-known song is built, one layer at a time.' },
  { icon: 'mic', title: 'Record', text: 'Beatbox the drums and hum the melody. Songmaker turns your voice into instruments.' },
  { icon: 'vinyl', title: 'Finish', text: 'Get a fully arranged song that you can play back and download.' },
] as const

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export function VibeStep({ vibe, onPick }: Props) {
  const refs = TEMPLATES.filter((t) => t.ref)
  return (
    <section className="landing">
      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow light">
            <Icon name="sparkle" size={20} /> Music production for beginners
          </span>
          <h1 className="hero-title">
            Make your first song with <span className="grad">just your voice.</span>
          </h1>
          <p className="hero-text">
            Choose a mood and study how a well-known song is built. Then beatbox and hum each part yourself. Songmaker turns your
            recordings into a complete track.
          </p>
          <div className="hero-cta">
            <button className="btn brand xl" onClick={() => scrollTo('moods')}>
              Start a song
            </button>
            <button className="btn glass xl" onClick={() => scrollTo('how')}>
              How it works
            </button>
          </div>
          <div className="hero-proof">
            <span><b>6</b> guided steps</span>
            <span><b>{refs.length}</b> songs to learn from</span>
            <span><b>0</b> instruments needed</span>
          </div>
        </div>
        <div className="hero-stage" aria-hidden>
          <div className="float-card fc-1">
            <Icon name="kick" size={36} />
            <span>
              <b>"Boom"</b>
              <small>Detected as kick drum</small>
            </span>
          </div>
          <div className="float-card fc-2">
            <Icon name="mic" size={36} />
            <span>
              <b>Humming</b>
              <small>Converted to piano, in C major</small>
            </span>
          </div>
          <div className="float-card fc-3">
            <Icon name="trophy" size={36} />
            <span>
              <b>92% accuracy</b>
              <small>Matches the original beat</small>
            </span>
          </div>
          <div className="eq">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${(i % 7) * 0.12}s` }} />
            ))}
          </div>
        </div>
      </div>

      <div className="marquee" aria-label="Songs you can learn from">
        <span className="marquee-label">
          <Icon name="headphones" size={22} /> Learn from
        </span>
        <div className="marquee-track">
          <div className="marquee-move">
            {[...refs, ...refs].map((t, i) => (
              <span key={i} className="marquee-item">
                <Icon name="vinyl" size={20} /> <b>{t.ref!.title}</b> {t.ref!.artist} · {t.bpm} BPM
              </span>
            ))}
          </div>
        </div>
      </div>

      <div id="how" className="how">
        {HOW.map((h, i) => (
          <div key={h.title} className="how-card">
            <span className="how-num">{i + 1}</span>
            <Icon name={h.icon} size={56} />
            <b>{h.title}</b>
            <p>{h.text}</p>
          </div>
        ))}
      </div>

      <div id="moods" className="section-head">
        <span className="eyebrow">Step 1</span>
        <h2>Choose a mood</h2>
        <p>The mood sets the tempo, the chords, and the drum style. Each one comes with songs to learn from.</p>
      </div>
      <div className="vibes">
        {VIBES.map((v, i) => {
          const songs = TEMPLATES.filter((t) => t.vibe === v.id && t.ref).map((t) => t.ref!.title)
          return (
            <button
              key={v.id}
              className={`vibe-card vibe-${v.id}${vibe === v.id ? ' picked' : ''}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => onPick(v.id)}
            >
              <div className="vibe-art" style={{ backgroundImage: `url(/assets/scenes/scene_${v.id}.webp)` }}>
                <span className="vibe-bpm">{v.bpmText}</span>
              </div>
              <div className="vibe-body">
                <span className="vibe-badge">
                  <Icon name={v.id} size={44} />
                </span>
                <div className="vibe-name">{v.name}</div>
                <div className="vibe-tag">{v.tagline}</div>
                <ul>
                  {v.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {songs.length > 0 && <div className="vibe-refs">Learn from {songs.join(' and ')}</div>}
                <span className="vibe-go">Choose {v.name.toLowerCase()}</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
