import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { SECTIONS } from '../data/sections'
import type { Template, Vibe } from '../data/templates'

type Props = {
  vibe: Vibe
  template: Template
  chords: string[]
  lyrics: string[]
  title: string
  onTitle: (t: string) => void
  section: number
  step: number
  songPlaying: boolean
  onPlaySong: () => void
  onStop: () => void
  wavUrl: string | null
  usedMine: { beat: boolean; tune: boolean }
  onRestart: () => void
}

const LAYER_ICONS: [keyof (typeof SECTIONS)[number]['layers'], IconName, string][] = [
  ['drums', 'kick', 'Drums'],
  ['bass', 'speaker', 'Bass'],
  ['chords', 'keys', 'Chords'],
  ['melody', 'notes', 'Melody'],
  ['double', 'sparkle', 'Bells'],
]

export function SongStep(p: Props) {
  const bar = p.step >= 0 ? Math.floor(p.step / 16) : -1
  const sec = p.section >= 0 ? SECTIONS[p.section] : null
  const line = sec?.layers.melody && bar >= 0 ? p.lyrics[bar] : ''
  const fileName = `${(p.title || 'my-song').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.wav`
  return (
    <section className="step">
      <StepHead n={5} icon="vinyl" title="Your song is ready">
        Producers often build a full song from a single loop by adding and removing parts. Songmaker arranged your four bars into a
        complete song structure.
      </StepHead>

      <div className="release">
        <div className={`cover vibe-${p.vibe.id}${p.songPlaying ? ' playing' : ''}`} style={{ backgroundImage: `url(/assets/scenes/scene_${p.vibe.id}.webp)` }}>
          <div className="cover-shade" />
          <span className="cover-brand">
            <Icon name="vinyl" size={22} /> Songmaker
          </span>
          <div className="cover-text">
            <input className="cover-title" value={p.title} placeholder="Name your song" maxLength={40} onChange={(e) => p.onTitle(e.target.value)} aria-label="Song title" />
            <span className="cover-meta">
              {p.vibe.name} · {p.template.bpm} BPM · {p.chords.join(' ')}
            </span>
          </div>
          <div className="cover-disc">
            <Icon name="vinyl" size={150} />
          </div>
        </div>

        <div className="card pad player-card">
          <span className="card-tab tab-brand">
            <Icon name="play" /> Playback
          </span>
          <div className={`karaoke${line ? ' on' : ''}`}>{line || (p.songPlaying ? ' ' : 'Lyrics appear here during playback.')}</div>
          <div className="actions center">
            {p.songPlaying ? (
              <button className="btn ink xl" onClick={p.onStop}>
                <Icon name="stop" size={30} /> Stop
              </button>
            ) : (
              <button className="btn brand xl" onClick={p.onPlaySong}>
                <Icon name="play" size={30} /> {p.wavUrl ? 'Play again' : 'Play song'}
              </button>
            )}
            {p.wavUrl && (
              <a className="btn sun xl" href={p.wavUrl} download={fileName}>
                <Icon name="download" size={30} /> Download
              </a>
            )}
          </div>
          {p.wavUrl && <audio controls src={p.wavUrl} className="player" />}
          {!p.wavUrl && <p className="fine center-text">Play the song once to create a WAV file you can download.</p>}
        </div>
      </div>

      <h2 className="sub">Song structure</h2>
      <div className="sections">
        {SECTIONS.map((s, i) => (
          <div key={i} className={`section${p.section === i ? ' now' : ''}`}>
            <span className="section-num">{i + 1}</span>
            <b>{s.name}</b>
            <div className="layer-icons">
              {LAYER_ICONS.filter(([k]) => s.layers[k]).map(([k, icon, label]) => (
                <span key={k} title={label}>
                  <Icon name={icon} size={26} />
                </span>
              ))}
            </div>
            <small>{s.why}</small>
          </div>
        ))}
      </div>

      <div className="card pad recap">
        <span className="card-tab tab-sun">
          <Icon name="trophy" /> Summary
        </span>
        <div className="recap-grid">
          <div className="recap-item">
            <Icon name="kick" size={40} />
            <b>Drums</b>
            <span>{p.usedMine.beat ? 'Your recording' : 'Original pattern'}, based on {p.template.ref ? p.template.ref.title : p.template.name}</span>
          </div>
          <div className="recap-item">
            <Icon name="keys" size={40} />
            <b>Chords</b>
            <span>{p.chords.join(' · ')}</span>
          </div>
          <div className="recap-item">
            <Icon name="mic" size={40} />
            <b>Melody</b>
            <span>{p.usedMine.tune ? 'Your recording' : 'Example melody'}</span>
          </div>
          <div className="recap-item">
            <Icon name="notebook" size={40} />
            <b>Lyrics</b>
            <span>{p.lyrics.filter(Boolean).length ? `${p.lyrics.filter(Boolean).length} of 4 lines` : 'None'}</span>
          </div>
        </div>
        <button className="btn white" onClick={p.onRestart}>
          <Icon name="sparkle" size={24} /> Start a new song
        </button>
      </div>
    </section>
  )
}
