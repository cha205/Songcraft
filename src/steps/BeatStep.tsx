import type { DrumGrid as Grid } from '../audio/analysis'
import { DRUMS } from '../audio/analysis'
import { SAY, beatTips, compareBeats, countWords } from '../audio/compare'
import { DrumGrid } from '../components/DrumGrid'
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

export function BeatStep(p: Props) {
  const target = templateGrid(p.template)
  const result = p.myDrums ? compareBeats(target, p.myDrums) : null
  const tips = result ? beatTips(result) : []
  const options = TEMPLATES.filter((t) => t.vibe === p.vibe)
  const ref = p.template.ref
  return (
    <section className="step">
      <h2>Step 1: the beat</h2>
      <p className="lead">
        Producers usually start with drums. Pick a beat from a famous song, study how it is built, then make it yourself with your
        mouth.
      </p>

      <div className="options">
        {options.map((t) => (
          <button key={t.id} className={`option${t.id === p.template.id ? ' picked' : ''}`} onClick={() => p.onTemplate(t.id)}>
            <b>{t.name}</b>
            <span>{t.ref ? `${t.ref.signature ? 'The beat from' : 'In the style of'} ${t.ref.title}, ${t.ref.artist}` : 'A classic producer pattern'}</span>
            <span className="pill">{t.bpm} BPM</span>
          </button>
        ))}
      </div>

      <div className="study">
        <div className="panel">
          <div className="panel-head">
            <h3>Study it</h3>
            <div className="actions">
              {p.playing && p.choice === 'template' ? (
                <button className="btn primary" onClick={p.onStop}>Stop</button>
              ) : (
                <button className="btn primary" disabled={p.busy} onClick={() => { p.onChoice('template'); p.onPlay() }}>Play the beat</button>
              )}
              {ref && (
                <a className="btn" href={youtubeSearch(ref.title, ref.artist)} target="_blank" rel="noreferrer">
                  Hear the real song
                </a>
              )}
            </div>
          </div>
          <div className="facts">
            <div className="fact big">
              <b>{p.template.bpm}</b>
              <span>BPM: beats per minute. {p.template.bpm < 90 ? 'Slow, about one step per beat.' : p.template.bpm < 110 ? 'Medium, a relaxed walk.' : 'Fast, a brisk walk or a dance.'}</span>
            </div>
            {DRUMS.map((d) => (
              <div className="fact" key={d}>
                <b>{SAY[d]}</b>
                <span>on {countWords(p.template.pattern[d])}</span>
              </div>
            ))}
          </div>
          <DrumGrid grid={target} bars={1} step={p.choice === 'template' && p.playing ? p.step : -1} />
          <ul className="tips">
            {p.template.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {ref && <p className="fine">Tempo from published sources. Drum pattern simplified for learning.</p>}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Your turn</h3>
            <div className="actions">
              <button className="btn rec" disabled={p.busy} onClick={p.onRecord}>{p.busy ? 'Recording...' : p.myDrums ? 'Try again' : 'Record beatbox'}</button>
              {p.hasRaw && <button className="btn" disabled={p.busy} onClick={p.onRaw}>Hear my raw take</button>}
            </div>
          </div>
          <p className="info">
            {p.info || `After 4 clicks, beatbox the beat for 4 bars at ${p.template.bpm} BPM. Watch the dots to stay on time.`}
          </p>
          <label className="check">
            <input type="checkbox" checked={p.click} onChange={(e) => p.onClick(e.target.checked)} />
            Keep the metronome on while recording (use headphones)
          </label>
          {result && p.myDrums && (
            <>
              <div className="score">
                <div className={`score-num${result.score >= 80 ? ' good' : result.score >= 50 ? ' ok' : ''}`}>{result.score}%</div>
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
                <button className={`btn${p.choice === 'mine' ? ' primary' : ''}`} onClick={() => { p.onChoice('mine'); p.onPlay() }}>My beat</button>
                <button className={`btn${p.choice === 'template' ? ' primary' : ''}`} onClick={() => { p.onChoice('template'); p.onPlay() }}>The template</button>
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
