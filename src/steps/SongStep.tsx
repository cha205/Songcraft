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
  ['drums', 'kick', 'drums'],
  ['bass', 'speaker', 'bass'],
  ['chords', 'keys', 'chords'],
  ['melody', 'notes', 'tune'],
  ['double', 'sparkle', 'bells'],
]

export function SongStep(p: Props) {
  const bar = p.step >= 0 ? Math.floor(p.step / 16) : -1
  const sec = p.section >= 0 ? SECTIONS[p.section] : null
  const line = sec?.layers.melody && bar >= 0 ? p.lyrics[bar] : ''
  return (
    <section className="step">
      <StepHead n={5} icon="vinyl" title="Your song">
        The producer secret: a whole song is usually one loop with parts added and taken away. We turned your 4 bars into a full
        song.
      </StepHead>
      <div className="card pad song-card" style={{ ['--tab' as string]: 'var(--accent)', ['--tab-d' as string]: 'var(--accent-d)' }}>
        <span className="card-tab">
          <Icon name={p.vibe.id} /> {p.vibe.name} song, {p.template.bpm} BPM
        </span>
        <div className="card-head">
          <div className={`turntable${p.songPlaying ? ' playing' : ''}`}>
            <Icon name="vinyl" size={88} />
          </div>
          <div className={`karaoke${line ? ' on' : ''}`}>{line || (p.songPlaying ? '...' : 'Your lyrics show up here while the song plays.')}</div>
          <div className="actions">
            {p.songPlaying ? (
              <button className="btn navy lg" onClick={p.onStop}>
                <Icon name="stop" size={28} /> Stop
              </button>
            ) : (
              <button className="btn green lg" onClick={p.onPlaySong}>
                <Icon name="play" size={28} /> {p.wavUrl ? 'Play again' : 'Play my song'}
              </button>
            )}
            {p.wavUrl && (
              <a className="btn yellow lg" href={p.wavUrl} download="my-song.wav">
                <Icon name="download" size={28} /> Download
              </a>
            )}
          </div>
        </div>
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
        {p.wavUrl && <audio controls src={p.wavUrl} className="player" />}
      </div>

      <div className="card pad recap" style={{ ['--tab' as string]: 'var(--yellow)', ['--tab-d' as string]: 'var(--yellow-d)' }}>
        <span className="card-tab dark">
          <Icon name="trophy" /> What you made
        </span>
        <div className="recap-grid">
          <div className="recap-item">
            <Icon name="kick" size={40} />
            <b>Beat</b>
            <span>{p.usedMine.beat ? 'Your own beatbox' : 'The template'}, learned from {p.template.ref ? p.template.ref.title : p.template.name}</span>
          </div>
          <div className="recap-item">
            <Icon name="keys" size={40} />
            <b>Chords</b>
            <span>{p.chords.join(' - ')}</span>
          </div>
          <div className="recap-item">
            <Icon name="mic" size={40} />
            <b>Tune</b>
            <span>{p.usedMine.tune ? 'Hummed by you' : 'The example tune'}</span>
          </div>
          <div className="recap-item">
            <Icon name="notebook" size={40} />
            <b>Lyrics</b>
            <span>{p.lyrics.filter(Boolean).length ? `${p.lyrics.filter(Boolean).length} lines` : 'None yet'}</span>
          </div>
        </div>
        <button className="btn white" onClick={p.onRestart}>
          <Icon name="sparkle" size={24} /> Make another song
        </button>
      </div>
    </section>
  )
}
