import { Coach } from '../components/Guide'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import type { LayerKey, PartId, Section, SongLength } from '../data/sections'
import { EXTRAS, FEELING_INFO, LEADS } from '../data/genres'
import type { ExtraId, Feeling, Genre, LeadId } from '../data/genres'

type Props = {
  genre: Genre
  feeling: Feeling
  bpm: number
  length: SongLength
  verseChords: string[]
  chorusChords: string[]
  lead: LeadId
  extras: ExtraId[]
  lyrics: Record<PartId, string[]>
  sections: Section[]
  title: string
  onTitle: (t: string) => void
  section: number
  step: number
  songPlaying: boolean
  onPlaySong: () => void
  onStop: () => void
  wavUrl: string | null
  onRestart: () => void
}

const LAYER_ICONS: [LayerKey, IconName, string][] = [
  ['drums', 'drumkit', 'Drums'],
  ['bass', 'bassguitar', 'Bass'],
  ['chords', 'keys', 'Chords'],
  ['melody', 'mic', 'Melody'],
  ['extras', 'layers', 'Added instruments'],
]

export function SongStep(p: Props) {
  const bar = p.step >= 0 ? Math.floor(p.step / 16) : -1
  const sec = p.section >= 0 ? p.sections[p.section] : null
  const line = sec?.layers.melody && bar >= 0 ? p.lyrics[sec.kind][bar] : ''
  const fileName = `${(p.title || 'my-song').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.wav`
  const leadName = LEADS.find((l) => l.id === p.lead)?.name ?? 'Piano'
  const seconds = Math.round((p.sections.length * 960) / p.bpm)
  const kind = p.length === 'full' ? 'song' : p.length
  return (
    <section className="step">
      <StepHead icon="vinyl" title={`Your ${kind} is ready`} />

      <div className="card stage-card">
        <Coach icon="vinyl">Give it a name and press play. Songmaker plays every section you arranged, then lets you download it.</Coach>
        <div className="release">
          <div className={`cover${p.songPlaying ? ' playing' : ''}`} style={{ backgroundImage: `url(/assets/scenes/genre_${p.genre.id}.webp)` }}>
            <div className="cover-shade" />
            <div className="cover-disc">
              <Icon name="vinyl" size={170} />
            </div>
            <div className="cover-text">
              <input className="cover-title" value={p.title} placeholder="Name your song" maxLength={40} onChange={(e) => p.onTitle(e.target.value)} aria-label="Song title" />
              <span className="cover-meta">
                {FEELING_INFO[p.feeling].name} {p.genre.name} · {p.bpm} BPM · {seconds} seconds
              </span>
            </div>
          </div>
          <div className="release-side">
            <div className={`karaoke${line ? ' on' : ''}`}>{line || (p.songPlaying ? ' ' : 'Your lyrics appear here while it plays.')}</div>
            <div className="big-actions col">
              {p.songPlaying ? (
                <button className="btn navy xl" onClick={p.onStop}>
                  <Icon name="stop" size={32} /> Stop
                </button>
              ) : (
                <button className="btn green xl" onClick={p.onPlaySong}>
                  <Icon name="play" size={32} /> {p.wavUrl ? 'Play again' : `Play my ${kind}`}
                </button>
              )}
              {p.wavUrl ? (
                <a className="btn yellow xl" href={p.wavUrl} download={fileName}>
                  <Icon name="download" size={32} /> Download
                </a>
              ) : (
                <p className="fine center">Play it once to save it as a file.</p>
              )}
            </div>
          </div>
        </div>

        <span className="mini-label">How it is built</span>
        <div className="sections">
          {p.sections.map((s, i) => (
            <div key={i} className={`section k-${s.kind}${p.section === i ? ' now' : ''}`}>
              <b>{s.name}</b>
              <div className="layer-icons">
                {LAYER_ICONS.filter(([k]) => s.layers[k] && (k !== 'extras' || p.extras.length > 0)).map(([k, icon, label]) => (
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
          {(p.length === 'full' || p.length === 'verse') && (
            <div className="recap-item">
              <Icon name="loop" size={40} />
              <b>Verse</b>
              <span>{p.verseChords.join(' · ')}</span>
            </div>
          )}
          {(p.length === 'full' || p.length === 'chorus') && (
            <div className="recap-item">
              <Icon name="star" size={40} />
              <b>Chorus</b>
              <span>{p.chorusChords.join(' · ')}</span>
            </div>
          )}
          <div className="recap-item">
            <Icon name="mic" size={40} />
            <b>Melody</b>
            <span>Played on {leadName.toLowerCase()}</span>
          </div>
          <div className="recap-item">
            <Icon name="layers" size={40} />
            <b>Instruments</b>
            <span>{p.extras.length ? p.extras.map((e) => EXTRAS.find((x) => x.id === e)?.name).join(', ') : 'None added'}</span>
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
