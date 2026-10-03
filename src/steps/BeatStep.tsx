import type { Drum, DrumGrid as Grid } from '../audio/analysis'
import { DRUMS } from '../audio/analysis'
import { SAY, beatTips, compareBeats, countWords } from '../audio/compare'
import { DrumGrid } from '../components/DrumGrid'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { TEMPLATES, templateGrid, youtubeSearch } from '../data/templates'
import type { Template, VibeId } from '../data/templates'

type Props = {
  vibe: VibeId
  template: Template
  onTemplate: (id: string) => void
  myDrums: Grid | null
  onMyDrums: (g: Grid) => void
  choice: 'template' | 'mine'
  onChoice: (c: 'template' | 'mine') => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  busy: boolean
  onRecord: () => void
  info: string
  hasRaw: boolean
  onRaw: () => void
  click: boolean
  onClick: (v: boolean) => void
}

const DRUM_ICON: Record<Drum, IconName> = { kick: 'kick', snare: 'snare', hat: 'hihat' }
const DRUM_TITLE: Record<Drum, string> = { kick: 'Kick drum', snare: 'Snare drum', hat: 'Hi-hat' }

export function BeatStep(p: Props) {
  const target = templateGrid(p.template)
  const result = p.myDrums ? compareBeats(target, p.myDrums) : null
  const tips = result ? beatTips(result) : []
  const options = TEMPLATES.filter((t) => t.vibe === p.vibe)
  const ref = p.template.ref
  const speed = p.template.bpm < 90 ? 'Slow tempo, about one step per beat.' : p.template.bpm < 110 ? 'Medium tempo, like a relaxed walk.' : 'Fast tempo, like a brisk walk.'
  return (
    <section className="step">
      <StepHead n={1} icon="kick" title="Build the beat">
        Most producers start with the drums. Study the pattern from a well-known song, then recreate it by beatboxing. Songmaker
        detects each sound and replaces it with a real drum.
      </StepHead>

      <div className="options">
        {options.map((t) => (
          <button key={t.id} className={`option${t.id === p.template.id ? ' picked' : ''}`} onClick={() => p.onTemplate(t.id)}>
            <Icon name="vinyl" size={44} className={t.id === p.template.id ? 'spin' : ''} />
            <span className="option-text">
              <b>{t.name}</b>
              <span>{t.ref ? `${t.ref.signature ? 'The beat from' : 'In the style of'} ${t.ref.title} by ${t.ref.artist}` : 'A classic producer pattern'}</span>
            </span>
            <span className="chip">{t.bpm} BPM</span>
          </button>
        ))}
      </div>

      <div className="study">
        <div className="card pad">
          <span className="card-tab tab-sky">
            <Icon name="headphones" /> Learn
          </span>
          <div className="card-head">
            <span className="card-title">{p.template.name}</span>
            <div className="actions">
              {p.playing && p.choice === 'template' ? (
                <button className="btn ink" onClick={p.onStop}>
                  <Icon name="stop" size={24} /> Stop
                </button>
              ) : (
                <button className="btn mint" disabled={p.busy} onClick={() => { p.onChoice('template'); p.onPlay() }}>
                  <Icon name="play" size={24} /> Play pattern
                </button>
              )}
              {ref && (
                <a className="btn white" href={youtubeSearch(ref.title, ref.artist)} target="_blank" rel="noreferrer">
                  Listen to the original
                </a>
              )}
            </div>
          </div>
          <div className="stat-tiles">
            <div className="stat-tile tile-brand">
              <Icon name="metronome" size={34} />
              <b>{p.template.bpm}</b>
              <span>BPM</span>
            </div>
            {DRUMS.map((d) => (
              <div className={`stat-tile tile-${d}`} key={d}>
                <Icon name={DRUM_ICON[d]} size={34} />
                <b className="sm">{DRUM_TITLE[d]}</b>
                <span>On {countWords(p.template.pattern[d])}</span>
              </div>
            ))}
          </div>
          <p className="speed">
            <b>{p.template.bpm} beats per minute.</b> {speed}
          </p>
          <DrumGrid grid={target} bars={1} step={p.choice === 'template' && p.playing ? p.step : -1} />
          <ul className="tips">
            {p.template.tips.map((t) => (
              <li key={t}>
                <Icon name="bulb" size={22} /> {t}
              </li>
            ))}
          </ul>
          {ref && <p className="fine">Tempo from published sources. The drum pattern is simplified for learning.</p>}
        </div>

        <div className="card pad">
          <span className="card-tab tab-brand">
            <Icon name="mic" /> Record
          </span>
          <div className="card-head">
            <span className="card-title">Beatbox the pattern</span>
            <div className="actions">
              <button className="btn brand" disabled={p.busy} onClick={p.onRecord}>
                <Icon name="record" size={24} /> {p.busy ? 'Recording' : p.myDrums ? 'Record again' : 'Record'}
              </button>
              {p.hasRaw && (
                <button className="btn white" disabled={p.busy} onClick={p.onRaw}>
                  <Icon name="wave" size={24} /> Play my recording
                </button>
              )}
            </div>
          </div>
          <p className="info">
            {p.info || `After a four-beat count-in, beatbox the pattern for four bars at ${p.template.bpm} BPM.`}
          </p>
          <label className="check">
            <input type="checkbox" checked={p.click} onChange={(e) => p.onClick(e.target.checked)} />
            Play the metronome while recording (use headphones)
          </label>
          {!result && (
            <>
              <p className="say-intro">Use these three sounds:</p>
              <div className="say-row">
                {DRUMS.map((d) => (
                  <div key={d} className={`say say-${d}`}>
                    <Icon name={DRUM_ICON[d]} size={52} />
                    <b>"{SAY[d].toLowerCase()}"</b>
                    <span>{DRUM_TITLE[d]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {result && p.myDrums && (
            <>
              <div className="score">
                <div className={`score-badge${result.score >= 80 ? ' good' : result.score >= 50 ? ' ok' : ''}`}>
                  <b>{result.score}%</b>
                  <span>Accuracy</span>
                </div>
                <ul>
                  {tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="legend">
                <span className="lg hit">On beat</span>
                <span className="lg near">Slightly off</span>
                <span className="lg missed">Missed</span>
                <span className="lg extra">Extra</span>
              </div>
              <DrumGrid grid={p.myDrums} bars={4} step={p.choice === 'mine' && p.playing ? p.step : -1} marks={result.marks} />
              <div className="choose">
                <span>Use in song</span>
                <div className="seg">
                  <button className={p.choice === 'mine' ? 'on' : ''} onClick={() => { p.onChoice('mine'); p.onPlay() }}>My recording</button>
                  <button className={p.choice === 'template' ? 'on' : ''} onClick={() => { p.onChoice('template'); p.onPlay() }}>Original pattern</button>
                </div>
              </div>
              <details className="edit">
                <summary>Edit the pattern</summary>
                <DrumGrid
                  grid={p.myDrums}
                  bars={4}
                  step={-1}
                  onToggle={(d, s) => p.onMyDrums({ ...p.myDrums!, [d]: p.myDrums![d].map((v, i) => (i === s ? !v : v)) })}
                />
              </details>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
