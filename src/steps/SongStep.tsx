import { Coach } from '../components/Guide'
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
      <StepHead icon="vinyl" title="Your song is ready" />

      <div className="card stage-card">
        <Coach icon="vinyl">Give your song a name and press play. Songmaker builds a full song from your four bars.</Coach>
        <div className="release">
          <div className={`cover${p.songPlaying ? ' playing' : ''}`} style={{ backgroundImage: `url(/assets/scenes/scene_${p.vibe.id}.webp)` }}>
            <div className="cover-shade" />
            <div className="cover-disc">
              <Icon name="vinyl" size={170} />
            </div>
            <div className="cover-text">
              <input className="cover-title" value={p.title} placeholder="Name your song" maxLength={40} onChange={(e) => p.onTitle(e.target.value)} aria-label="Song title" />
              <span className="cover-meta">
                {p.vibe.name} · {p.template.bpm} BPM · Made with Songmaker
              </span>
            </div>
          </div>
          <div className="release-side">
            <div className={`karaoke${line ? ' on' : ''}`}>{line || (p.songPlaying ? ' ' : 'Your lyrics appear here while the song plays.')}</div>
            <div className="big-actions col">
              {p.songPlaying ? (
                <button className="btn navy xl" onClick={p.onStop}>
                  <Icon name="stop" size={32} /> Stop
                </button>
              ) : (
                <button className="btn green xl" onClick={p.onPlaySong}>
                  <Icon name="play" size={32} /> {p.wavUrl ? 'Play again' : 'Play my song'}
                </button>
              )}
              {p.wavUrl ? (
                <a className="btn yellow xl" href={p.wavUrl} download={fileName}>
                  <Icon name="download" size={32} /> Download
                </a>
              ) : (
                <p className="fine center">Play the song once to save it as a file.</p>
              )}
            </div>
          </div>
        </div>

        <span className="mini-label">How your song is built</span>
        <div className="sections">
          {SECTIONS.map((s, i) => (
            <div key={i} className={`section${p.section === i ? ' now' : ''}`}>
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

        <div className="recap">
          <div className="recap-item">
            <Icon name="kick" size={40} />
            <b>Drums</b>
            <span>{p.usedMine.beat ? 'Your beatbox' : 'Original beat'}, from {p.template.ref ? p.template.ref.title : p.template.name}</span>
          </div>
          <div className="recap-item">
            <Icon name="keys" size={40} />
            <b>Chords</b>
            <span>{p.chords.join(' · ')}</span>
          </div>
          <div className="recap-item">
            <Icon name="mic" size={40} />
            <b>Melody</b>
            <span>{p.usedMine.tune ? 'Hummed by you' : 'Example melody'}</span>
          </div>
          <div className="recap-item">
            <Icon name="notebook" size={40} />
            <b>Lyrics</b>
            <span>{p.lyrics.filter(Boolean).length ? `${p.lyrics.filter(Boolean).length} of 4 lines` : 'None'}</span>
          </div>
        </div>
        <div className="stage-foot end">
          <button className="btn white" onClick={p.onRestart}>
            <Icon name="sparkle" size={24} /> Make another song
          </button>
        </div>
      </div>
    </section>
  )
}
