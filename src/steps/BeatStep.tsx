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

export function BeatStep(p: Props) {
  const target = templateGrid(p.template)
  const result = p.myDrums ? compareBeats(target, p.myDrums) : null
  const tips = result ? beatTips(result) : []
  const options = TEMPLATES.filter((t) => t.vibe === p.vibe)
  const ref = p.template.ref
  const speed = p.template.bpm < 90 ? 'Slow: about one step per beat.' : p.template.bpm < 110 ? 'Medium: a relaxed walk.' : 'Fast: a brisk walk or a dance.'
  return (
    <section className="step">
      <StepHead n={1} icon="kick" title="The beat">
        Producers usually start with drums. Pick a beat from a famous song, study how it is built, then make it yourself with your
        mouth.
      </StepHead>

      <div className="options">
        {options.map((t) => (
          <button key={t.id} className={`option${t.id === p.template.id ? ' picked' : ''}`} onClick={() => p.onTemplate(t.id)}>
            <Icon name="vinyl" size={44} className={t.id === p.template.id ? 'spin' : ''} />
            <span className="option-text">
              <b>{t.name}</b>
              <span>{t.ref ? `${t.ref.signature ? 'The beat from' : 'In the style of'} ${t.ref.title}, ${t.ref.artist}` : 'A classic producer pattern'}</span>
            </span>
            <span className="chip">{t.bpm} BPM</span>
          </button>
        ))}
      </div>

      <div className="study">
        <div className="card pad" style={{ ['--tab' as string]: 'var(--blue)', ['--tab-d' as string]: 'var(--blue-d)' }}>
          <span className="card-tab">
            <Icon name="headphones" /> Study it
          </span>
          <div className="card-head">
            <span className="card-title">{p.template.name}</span>
            <div className="actions">
              {p.playing && p.choice === 'template' ? (
                <button className="btn navy" onClick={p.onStop}>
                  <Icon name="stop" size={24} /> Stop
                </button>
              ) : (
                <button className="btn green" disabled={p.busy} onClick={() => { p.onChoice('template'); p.onPlay() }}>
                  <Icon name="play" size={24} /> Play the beat
                </button>
              )}
              {ref && (
                <a className="btn white" href={youtubeSearch(ref.title, ref.artist)} target="_blank" rel="noreferrer">
                  Hear the real song
                </a>
              )}
            </div>
          </div>
          <div className="skews">
            <div className="skew" style={{ ['--c' as string]: 'var(--accent)' }}>
              <div className="skew-in">
                <Icon name="metronome" size={34} />
                <span className="skew-value">{p.template.bpm}</span>
                <span className="skew-label">BPM</span>
              </div>
            </div>
            {DRUMS.map((d) => (
              <div className="skew" key={d} style={{ ['--c' as string]: `var(--${d})` }}>
                <div className="skew-in">
                  <Icon name={DRUM_ICON[d]} size={34} />
                  <span className="skew-value sm">{SAY[d]}</span>
                  <span className="skew-label">on {countWords(p.template.pattern[d])}</span>
                </div>
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
          {ref && <p className="fine">Tempo from published sources. Drum pattern simplified for learning.</p>}
        </div>

        <div className="card pad" style={{ ['--tab' as string]: 'var(--red)', ['--tab-d' as string]: 'var(--red-d)' }}>
          <span className="card-tab">
            <Icon name="mic" /> Your turn
          </span>
          <div className="card-head">
            <span className="card-title">Beatbox it</span>
            <div className="actions">
              <button className="btn red" disabled={p.busy} onClick={p.onRecord}>
                <Icon name="record" size={24} /> {p.busy ? 'Recording...' : p.myDrums ? 'Try again' : 'Record'}
              </button>
              {p.hasRaw && (
                <button className="btn white" disabled={p.busy} onClick={p.onRaw}>
                  <Icon name="wave" size={24} /> My raw take
                </button>
              )}
            </div>
          </div>
          <p className="info">
            {p.info || `After 4 clicks, beatbox the beat for 4 bars at ${p.template.bpm} BPM. Watch the dots to stay on time.`}
          </p>
          <label className="check">
            <input type="checkbox" checked={p.click} onChange={(e) => p.onClick(e.target.checked)} />
            <Icon name="metronome" size={20} /> Keep the metronome on while recording (use headphones)
          </label>
          {!result && (
            <div className="say-row">
              {DRUMS.map((d) => (
                <div key={d} className={`say say-${d}`}>
                  <Icon name={DRUM_ICON[d]} size={52} />
                  <b>{SAY[d]}</b>
                  <span>{d === 'kick' ? 'kick drum' : d === 'snare' ? 'snare drum' : 'hi-hat'}</span>
                </div>
              ))}
            </div>
          )}
          {result && p.myDrums && (
            <>
              <div className="score">
                <div className={`score-badge${result.score >= 80 ? ' good' : result.score >= 50 ? ' ok' : ''}`}>
                  <Icon name="trophy" size={40} />
                  <b>{result.score}%</b>
                  <span>match</span>
                </div>
                <ul>
                  {tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="legend">
                <span className="lg hit">right on</span>
                <span className="lg near">a bit off</span>
                <span className="lg missed">missed</span>
                <span className="lg extra">extra</span>
              </div>
              <DrumGrid grid={p.myDrums} bars={4} step={p.choice === 'mine' && p.playing ? p.step : -1} marks={result.marks} />
              <div className="choose">
                <span>Use in my song:</span>
                <div className="seg">
                  <button className={p.choice === 'mine' ? 'on' : ''} onClick={() => { p.onChoice('mine'); p.onPlay() }}>My beat</button>
                  <button className={p.choice === 'template' ? 'on' : ''} onClick={() => { p.onChoice('template'); p.onPlay() }}>The template</button>
                </div>
              </div>
              <details className="edit">
                <summary>Fix my beat by hand</summary>
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
