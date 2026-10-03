import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { TEMPLATES, VIBES } from '../data/templates'
import type { VibeId } from '../data/templates'

type Props = { vibe: VibeId | null; onPick: (v: VibeId) => void }

const VOICE: { from: IconName; to: IconName; you: string; we: string; color: string }[] = [
  { from: 'mic', to: 'kick', you: 'You say "boom, tss, pff"', we: 'Songmaker plays real drums', color: 'orange' },
  { from: 'mic', to: 'keys', you: 'You hum a tune', we: 'Songmaker plays it on piano', color: 'pink' },
  { from: 'notebook', to: 'vinyl', you: 'You write a few lines', we: 'They become your lyrics', color: 'violet' },
]

const JOURNEY: { icon: IconName; name: string; text: string }[] = [
  { icon: 'sparkle', name: 'Mood', text: 'Pick a feeling' },
  { icon: 'kick', name: 'Drums', text: 'Learn a beat, then beatbox it' },
  { icon: 'keys', name: 'Chords', text: 'Choose the harmony' },
  { icon: 'mic', name: 'Melody', text: 'Hum your own tune' },
  { icon: 'notebook', name: 'Lyrics', text: 'Add your words' },
  { icon: 'vinyl', name: 'Song', text: 'Play it and download it' },
]

const scrollToMoods = () => document.getElementById('moods')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export function VibeStep({ vibe, onPick }: Props) {
  return (
    <section className="landing">
      <div className="intro card">
        <div className="intro-copy">
          <h1 className="intro-title">Make a real song with your voice</h1>
          <p className="intro-text">
            You don't need instruments or any experience. Songmaker teaches each part of a song using hits you already know, then turns
            your humming and beatboxing into real instruments.
          </p>
          <button className="btn yellow xl" onClick={scrollToMoods}>
            Start my song
          </button>
        </div>
        <div className="intro-art" style={{ backgroundImage: 'url(/assets/scenes/hero.webp)' }} />
      </div>

      <h2 className="band-title">Your voice is the instrument</h2>
      <div className="voice">
        {VOICE.map((v) => (
          <div key={v.you} className={`voice-card c-${v.color}`}>
            <div className="voice-flow">
              <span className="voice-tile">
                <Icon name={v.from} size={52} />
              </span>
              <span className="flow-arrow" aria-hidden />
              <span className="voice-tile out">
                <Icon name={v.to} size={52} />
              </span>
            </div>
            <b>{v.you}</b>
            <span>{v.we}</span>
          </div>
        ))}
      </div>

      <h2 className="band-title">How you'll make it</h2>
      <div className="card journey">
        {JOURNEY.map((j, i) => (
          <div key={j.name} className="journey-stop">
            <span className="journey-node">
              <Icon name={j.icon} size={46} />
              <span className="journey-num">{i + 1}</span>
            </span>
            <b>{j.name}</b>
            <span>{j.text}</span>
          </div>
        ))}
      </div>

      <h2 id="moods" className="band-title">What kind of song do you want to make?</h2>
      <div className="vibes">
        {VIBES.map((v, i) => {
          const songs = TEMPLATES.filter((t) => t.vibe === v.id && t.ref).map((t) => t.ref!.title)
          return (
            <button
              key={v.id}
              className={`vibe-card vibe-${v.id}${vibe === v.id ? ' picked' : ''}`}
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => onPick(v.id)}
            >
              <div className="vibe-art" style={{ backgroundImage: `url(/assets/scenes/scene_${v.id}.webp)` }} />
              <div className="vibe-body">
                <span className="vibe-badge">
                  <Icon name={v.id} size={48} />
                </span>
                <div className="vibe-name">{v.name}</div>
                <div className="vibe-tag">{v.tagline}</div>
                <span className="vibe-bpm">{v.bpmText}</span>
                {songs.length > 0 && <div className="vibe-refs">Learn from {songs.join(' and ')}</div>}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
