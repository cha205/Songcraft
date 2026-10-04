import { useState } from 'react'
import type { Drum, DrumGrid as Grid } from '../audio/analysis'
import { DRUMS } from '../audio/analysis'
import { SAY, beatTips, compareBeats } from '../audio/compare'
import { BeatClock } from '../components/BeatClock'
import { DrumGrid } from '../components/DrumGrid'
import { Coach, MicButton, StageTabs } from '../components/Guide'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { HATS, KICKS, KITS, SNARES, beatStory, option } from '../data/genres'
import type { Feeling, Genre, KitId, LayerOption } from '../data/genres'

type Stage = 'learn' | 'record' | 'tune'
export type Lesson = { kick: string; snare: string; hat: string }

type Props = {
  genre: Genre
  feeling: Feeling
  bpm: number
  onBpm: (v: number) => void
  swing: number
  onSwing: (v: number) => void
  kit: KitId
  onKit: (k: KitId) => void
  lesson: Lesson
  onLesson: (l: Lesson) => void
  beat: Grid
  onCustom: (g: Grid | null) => void
  chorusOn: boolean
  onChorusOn: (v: boolean) => void
  fill: boolean
  onFill: (v: boolean) => void
  part: 'verse' | 'chorus'
  onPart: (p: 'verse' | 'chorus') => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  busy: boolean
  onRecord: () => Promise<Grid | null>
  info: string
  hasRaw: boolean
  onRaw: () => void
  click: boolean
  onClick: (v: boolean) => void
  onDone: () => void
}

const STAGES: { id: Stage; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'record', label: 'Record' },
  { id: 'tune', label: 'Fine-tune' },
]
const DRUM_ICON: Record<Drum, IconName> = { kick: 'kick', snare: 'snare', hat: 'hihat' }
const LAYERS: { key: keyof Lesson; title: string; role: string; icon: IconName; options: LayerOption[] }[] = [
  { key: 'kick', title: 'Kick', role: 'The heartbeat. Low and deep.', icon: 'kick', options: KICKS },
  { key: 'snare', title: 'Snare', role: 'The clap. Sharp and loud.', icon: 'snare', options: SNARES },
  { key: 'hat', title: 'Hi-hat', role: 'The clock that keeps time.', icon: 'hihat', options: HATS },
]

export function DrumsStep(p: Props) {
  const [stage, setStage] = useState<Stage>('learn')
  const [take, setTake] = useState<Grid | null>(null)
  const recommended = p.genre.drums[p.feeling]
  const go = (s: Stage) => {
    p.onStop()
    setStage(s)
  }
  const record = async () => {
    const g = await p.onRecord()
    if (g) setTake(g)
  }
  const result = take ? compareBeats(p.beat, take) : null
  const playBtn = (label: string) =>
    p.playing ? (
      <button className="btn navy xl" onClick={p.onStop}>
        <Icon name="stop" size={30} /> Stop
      </button>
    ) : (
      <button className="btn green xl" onClick={p.onPlay}>
        <Icon name="play" size={30} /> {label}
      </button>
    )

  return (
    <section className="step">
      <StepHead icon="drumkit" title="Build the beat">
        Every song stands on a beat made of three drums. Build yours one drum at a time and hear how each choice changes the feel.
      </StepHead>

      <div className="card stage-card">
        <StageTabs stages={STAGES} current={stage} onPick={go} enabled={() => true} />

        {stage === 'learn' && (
          <>
            <Coach icon="learn">Pick a pattern for each drum, from 1 to 3. Press play and switch options while it plays to hear the difference.</Coach>
            <div className="lesson">
              <div className="lesson-clock">
                <BeatClock grid={p.beat} step={p.playing ? p.step : -1} bpm={p.bpm} />
                {playBtn('Play my beat')}
              </div>
              <div className="lesson-layers">
                {LAYERS.map((L, i) => {
                  const sel = option(L.options, p.lesson[L.key])
                  return (
                    <div key={L.key} className={`layer-row l-${L.key}`}>
                      <div className="layer-head">
                        <span className="layer-num">{i + 1}</span>
                        <Icon name={L.icon} size={40} />
                        <span>
                          <b>{L.title}</b>
                          <small>{L.role}</small>
                        </span>
                      </div>
                      <div className="layer-options">
                        {L.options.map((o) => (
                          <button key={o.id} className={`opt${o.id === sel.id ? ' on' : ''}`} onClick={() => p.onLesson({ ...p.lesson, [L.key]: o.id })}>
                            {o.name}
                            {o.id === recommended[L.key] && <span className="fit">Fits {p.genre.name}</span>}
                          </button>
                        ))}
                      </div>
                      <p className="layer-why">{sel.why}</p>
                    </div>
                  )
                })}
                <div className="story">
                  <Icon name="bulb" size={30} />
                  <p>
                    <b>Why it sounds like this:</b> {beatStory(p.bpm, p.lesson.kick, p.lesson.snare, p.lesson.hat)}
                  </p>
                </div>
              </div>
            </div>
            <div className="stage-foot">
              <button className="link-btn" onClick={() => go('tune')}>
                Skip recording and fine-tune
              </button>
              <button className="btn red lg" onClick={() => go('record')}>
                <Icon name="mic" size={26} /> Next: perform it with your voice
              </button>
            </div>
          </>
        )}

        {stage === 'record' && (
          <>
            <Coach icon="mic">Now perform the beat you built. Press the microphone, wait for four clicks, then beatbox it for four bars.</Coach>
            {!result && (
              <div className="record-layout">
                <MicButton busy={p.busy} onClick={record} label="Press to record" />
                <div className="record-side">
                  <span className="mini-label">Your three sounds</span>
                  <div className="say-row">
                    {DRUMS.map((d) => (
                      <div key={d} className={`say say-${d}`}>
                        <Icon name={DRUM_ICON[d]} size={48} />
                        <b>"{SAY[d].toLowerCase()}"</b>
                        <span>{d === 'kick' ? 'Kick' : d === 'snare' ? 'Snare' : 'Hi-hat'}</span>
                      </div>
                    ))}
                  </div>
                  <span className="mini-label">The beat you built</span>
                  <DrumGrid grid={p.beat} bars={1} step={-1} />
                  <label className="check">
                    <input type="checkbox" checked={p.click} onChange={(e) => p.onClick(e.target.checked)} />
                    Keep the click track on while recording (wear headphones)
                  </label>
                </div>
              </div>
            )}
            {result && take && (
              <>
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
                <DrumGrid grid={take} bars={4} step={-1} marks={result.marks} />
              </>
            )}
            {p.info && <p className="notice">{p.info}</p>}
            <div className="stage-foot">
              <div className="actions">
                {result && (
                  <button className="btn white" onClick={() => setTake(null)}>
                    <Icon name="record" size={24} /> Try again
                  </button>
                )}
                {p.hasRaw && result && (
                  <button className="btn white" onClick={p.onRaw}>
                    <Icon name="wave" size={24} /> Hear my recording
                  </button>
                )}
                {result && take && (
                  <button className="btn white" onClick={() => p.onCustom(take)}>
                    Use my performance instead
                  </button>
                )}
              </div>
              <button className="btn green lg" onClick={() => go('tune')}>
                <Icon name="knob" size={26} /> Next: fine-tune
              </button>
            </div>
          </>
        )}

        {stage === 'tune' && (
          <>
            <Coach icon="knob">Polish your beat. Change the speed, the feel and the drum sounds, and give the chorus extra energy.</Coach>
            <div className="big-actions top">
              {playBtn(p.part === 'chorus' ? 'Play chorus beat' : 'Play verse beat')}
              <div className="seg" role="group" aria-label="Song part">
                <button className={p.part === 'verse' ? 'on' : ''} onClick={() => p.onPart('verse')}>Verse</button>
                <button className={p.part === 'chorus' ? 'on' : ''} onClick={() => p.onPart('chorus')}>Chorus</button>
              </div>
            </div>
            <div className="tune-grid">
              <div className="tune-card">
                <div className="tune-head">
                  <Icon name="metronome" size={34} />
                  <b>Tempo</b>
                  <span className="tune-val">{p.bpm} BPM</span>
                </div>
                <input type="range" min={60} max={160} value={p.bpm} onChange={(e) => p.onBpm(+e.target.value)} aria-label="Tempo" />
                <p>Beats per minute. Typical for {p.genre.name}: {p.genre.facts[0]}.</p>
              </div>
              <div className="tune-card">
                <div className="tune-head">
                  <Icon name="swing" size={34} />
                  <b>Swing</b>
                  <span className="tune-val">{p.swing < 0.05 ? 'Straight' : p.swing < 0.25 ? 'A little' : 'Lots'}</span>
                </div>
                <input type="range" min={0} max={0.5} step={0.05} value={p.swing} onChange={(e) => p.onSwing(+e.target.value)} aria-label="Swing" />
                <p>Swing delays every other note slightly, so the beat feels loose and human. Lo-fi and hip-hop use a lot of it.</p>
              </div>
              <div className="tune-card wide">
                <div className="tune-head">
                  <Icon name="drummachine" size={34} />
                  <b>Drum sounds</b>
                </div>
                <div className="chips">
                  {KITS.map((k) => (
                    <button key={k.id} className={`chip-btn${p.kit === k.id ? ' on' : ''}`} onClick={() => p.onKit(k.id)}>
                      {k.name}
                    </button>
                  ))}
                </div>
                <p>The same pattern sounds completely different on another kit. Producers choose sounds as carefully as rhythms.</p>
              </div>
              <label className="tune-card toggle">
                <input type="checkbox" checked={p.chorusOn} onChange={(e) => p.onChorusOn(e.target.checked)} />
                <Icon name="loop" size={34} />
                <span>
                  <b>Bigger chorus</b>
                  <small>The chorus gets busier hi-hats, so it feels bigger than the verse.</small>
                </span>
              </label>
              <label className="tune-card toggle">
                <input type="checkbox" checked={p.fill} onChange={(e) => p.onFill(e.target.checked)} />
                <Icon name="snare" size={34} />
                <span>
                  <b>Drum fill</b>
                  <small>A quick snare roll at the end of each section leads into the next one.</small>
                </span>
              </label>
            </div>
            <details className="edit">
              <summary>Edit every step by hand (for experienced producers)</summary>
              <DrumGrid grid={p.beat} bars={4} step={p.playing && p.part === 'verse' ? p.step : -1} onToggle={(d, s) => p.onCustom({ ...p.beat, [d]: p.beat[d].map((v, i) => (i === s ? !v : v)) })} />
            </details>
            <div className="stage-foot end">
              <button className="btn green lg" onClick={p.onDone}>
                <Icon name="check" size={26} /> Use this beat
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
