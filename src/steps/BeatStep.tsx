import { useState } from 'react'
import type { Drum, DrumGrid as Grid } from '../audio/analysis'
import { DRUMS } from '../audio/analysis'
import { SAY, beatTips, compareBeats } from '../audio/compare'
import { DrumGrid } from '../components/DrumGrid'
import { Coach, MicButton, StageTabs } from '../components/Guide'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { TEMPLATES, templateGrid, youtubeSearch } from '../data/templates'
import type { Template, VibeId } from '../data/templates'

type Stage = 'listen' | 'record' | 'review'

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
  onRecord: () => Promise<boolean>
  info: string
  hasRaw: boolean
  onRaw: () => void
  click: boolean
  onClick: (v: boolean) => void
  onDone: () => void
}

const DRUM_ICON: Record<Drum, IconName> = { kick: 'kick', snare: 'snare', hat: 'hihat' }
const DRUM_TITLE: Record<Drum, string> = { kick: 'Kick drum', snare: 'Snare drum', hat: 'Hi-hat' }
const STAGES: { id: Stage; label: string }[] = [
  { id: 'listen', label: 'Listen' },
  { id: 'record', label: 'Record' },
  { id: 'review', label: 'Review' },
]

export function BeatStep(p: Props) {
  const [stage, setStage] = useState<Stage>(p.myDrums ? 'review' : 'listen')
  const target = templateGrid(p.template)
  const result = p.myDrums ? compareBeats(target, p.myDrums) : null
  const options = TEMPLATES.filter((t) => t.vibe === p.vibe)
  const ref = p.template.ref
  const go = (s: Stage) => {
    p.onStop()
    setStage(s)
  }
  const record = async () => {
    if (await p.onRecord()) setStage('review')
  }

  return (
    <section className="step">
      <StepHead icon="kick" title="Build the beat">
        Every song starts with a beat. You will learn one from a famous song, then make it yourself with your mouth.
      </StepHead>

      <div className="card stage-card">
        <StageTabs stages={STAGES} current={stage} onPick={go} enabled={(s) => s !== 'review' || !!p.myDrums} />

        {stage === 'listen' && (
          <>
            <Coach icon="headphones">Press play and listen. Count along slowly: 1, 2, 3, 4.</Coach>
            <div className="beat-pick">
              {options.map((t) => (
                <button key={t.id} className={`beat-option${t.id === p.template.id ? ' on' : ''}`} onClick={() => p.onTemplate(t.id)}>
                  <Icon name="vinyl" size={40} className={t.id === p.template.id && p.playing ? 'spin' : ''} />
                  <span>
                    <b>{t.ref ? t.ref.title : t.name}</b>
                    <small>{t.ref ? `${t.ref.artist} · ${t.bpm} BPM` : `Classic pattern · ${t.bpm} BPM`}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="hero-grid">
              <DrumGrid grid={target} bars={1} step={p.playing ? p.step : -1} />
            </div>
            <div className="big-actions">
              {p.playing ? (
                <button className="btn navy xl" onClick={p.onStop}>
                  <Icon name="stop" size={30} /> Stop
                </button>
              ) : (
                <button className="btn green xl" onClick={() => { p.onChoice('template'); p.onPlay() }}>
                  <Icon name="play" size={30} /> Play the beat
                </button>
              )}
              {ref && (
                <a className="btn white xl" href={youtubeSearch(ref.title, ref.artist)} target="_blank" rel="noreferrer">
                  <Icon name="headphones" size={30} /> Hear {ref.title}
                </a>
              )}
            </div>
            <ul className="tips">
              {p.template.tips.slice(0, 3).map((t) => (
                <li key={t}>
                  <Icon name="bulb" size={24} /> {t}
                </li>
              ))}
            </ul>
            <div className="stage-foot">
              <button className="link-btn" onClick={() => { p.onChoice('template'); p.onDone() }}>
                Skip recording and use this beat
              </button>
              <button className="btn red lg" onClick={() => go('record')}>
                <Icon name="mic" size={26} /> I'm ready to record
              </button>
            </div>
          </>
        )}

        {stage === 'record' && (
          <>
            <Coach icon="mic">Press the microphone. After four clicks, beatbox the beat for four bars.</Coach>
            <div className="record-layout">
              <MicButton busy={p.busy} onClick={record} label="Press to record" />
              <div className="record-side">
                <span className="mini-label">Your three sounds</span>
                <div className="say-row">
                  {DRUMS.map((d) => (
                    <div key={d} className={`say say-${d}`}>
                      <Icon name={DRUM_ICON[d]} size={48} />
                      <b>"{SAY[d].toLowerCase()}"</b>
                      <span>{DRUM_TITLE[d]}</span>
                    </div>
                  ))}
                </div>
                <span className="mini-label">The beat to copy</span>
                <DrumGrid grid={target} bars={1} step={-1} />
                <label className="check">
                  <input type="checkbox" checked={p.click} onChange={(e) => p.onClick(e.target.checked)} />
                  Keep the click track on while recording (wear headphones)
                </label>
              </div>
            </div>
            {p.info && <p className="notice">{p.info}</p>}
          </>
        )}

        {stage === 'review' && result && p.myDrums && (
          <>
            <Coach icon="trophy">Here is your beat next to the original. Keep it, or try again.</Coach>
            <div className="review-top">
              <div className={`score-ring${result.score >= 80 ? ' good' : result.score >= 50 ? ' ok' : ''}`} style={{ ['--p' as string]: `${result.score}` }}>
                <div>
                  <b>{result.score}%</b>
                  <span>match</span>
                </div>
              </div>
              <ul className="review-tips">
                {beatTips(result).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="legend">
              <span className="lg hit">On the beat</span>
              <span className="lg near">A little off</span>
              <span className="lg missed">Missed</span>
              <span className="lg extra">Extra</span>
            </div>
            <DrumGrid grid={p.myDrums} bars={4} step={p.playing && p.choice === 'mine' ? p.step : -1} marks={result.marks} />
            {p.info && <p className="notice">{p.info}</p>}
            <div className="stage-foot">
              <div className="actions">
                <button className="btn white" onClick={() => go('record')}>
                  <Icon name="record" size={24} /> Try again
                </button>
                {p.hasRaw && (
                  <button className="btn white" onClick={p.onRaw}>
                    <Icon name="wave" size={24} /> Hear my recording
                  </button>
                )}
                <button className="btn white" onClick={() => { p.onChoice('template'); p.onDone() }}>
                  Use the original
                </button>
              </div>
              <button className="btn green lg" onClick={() => { p.onChoice('mine'); p.onDone() }}>
                <Icon name="star" size={26} /> Use my beat
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
