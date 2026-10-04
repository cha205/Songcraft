import { useState } from 'react'
import type { DrumGrid as Grid } from '../audio/analysis'
import { BeatClock } from '../components/BeatClock'
import { FamousBeats } from '../components/FamousBeats'
import { DrumGrid } from '../components/DrumGrid'
import { Coach, StageTabs } from '../components/Guide'
import { Icon } from '../components/Icon'
import type { IconName } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { TempoSlider } from '../components/TempoSlider'
import { FAMOUS_BEATS, SHOW_FAMOUS_BEATS, famousGrid } from '../data/famousBeats'
import { DRUM_FITS, HATS, KICKS, KITS, SNARES, beatStory, option } from '../data/genres'
import type { Feeling, Genre, KitId, LayerOption } from '../data/genres'

type Stage = 'learn' | 'tune'
export type Lesson = { kick: string; snare: string; hat: string }

type Props = {
  part: 'verse' | 'chorus'
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
  custom: Grid | null
  onCustom: (g: Grid | null) => void
  fill: boolean
  onFill: (v: boolean) => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  onDone: () => void
}

const STAGES: { id: Stage; label: string }[] = [
  { id: 'learn', label: 'Build' },
  { id: 'tune', label: 'Fine-tune' },
]
const LAYERS: { key: keyof Lesson; title: string; role: string; icon: IconName; options: LayerOption[]; basic: number }[] = [
  { key: 'kick', title: 'Kick', role: 'The heartbeat. Low and deep.', icon: 'kick', options: KICKS, basic: 6 },
  { key: 'snare', title: 'Snare', role: 'The clap. Sharp and loud.', icon: 'snare', options: SNARES, basic: 4 },
  { key: 'hat', title: 'Hi-hat', role: 'The clock that keeps time.', icon: 'hihat', options: HATS, basic: 5 },
]

export function DrumsStep(p: Props) {
  const [stage, setStage] = useState<Stage>('learn')
  // A famous beat being tried, and the user's own beat, tempo and kit to go back to.
  const [tried, setTried] = useState<{ id: string; custom: Grid | null; bpm: number; kit: KitId } | null>(null)
  const tryBeat = (id: string) => {
    const b = FAMOUS_BEATS.find((x) => x.id === id)
    if (!b) return
    setTried({ id, custom: tried ? tried.custom : p.custom, bpm: tried ? tried.bpm : p.bpm, kit: tried ? tried.kit : p.kit })
    p.onCustom(famousGrid(b))
    if (!p.playing) p.onPlay()
  }
  const backToMine = () => {
    if (!tried) return
    p.onCustom(tried.custom)
    p.onBpm(tried.bpm)
    p.onKit(tried.kit)
    setTried(null)
  }
  const recommended = p.genre.drums[p.feeling]
  // The original patterns show first; the newer ones (including None) sit behind "More patterns" so each row stays tidy.
  const [more, setMore] = useState<Record<string, boolean>>({})
  const go = (s: Stage) => {
    p.onStop()
    setStage(s)
  }
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
      <StepHead icon="drumkit" title={p.part === 'chorus' ? 'Build the chorus beat' : 'Build the beat'}>
        {p.part === 'chorus'
          ? 'Your chorus beat starts as a copy of your verse beat with busier hi-hats. Make it bigger and hear the difference.'
          : 'Every song stands on a beat made of three drums. Build yours one drum at a time and hear how each choice changes the feel.'}
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
                  const extra = L.options.slice(L.basic)
                  const open = more[L.key] || extra.some((o) => o.id === sel.id)
                  const shown = open ? L.options : L.options.slice(0, L.basic)
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
                        {shown.map((o) => (
                          <button key={o.id} className={`opt${o.id === sel.id ? ' on' : ''}`} onClick={() => p.onLesson({ ...p.lesson, [L.key]: o.id })}>
                            {o.name}
                            {(o.id === recommended[L.key] || DRUM_FITS[p.genre.id][L.key].includes(o.id)) && <span className="fit">Fits {p.genre.name}</span>}
                          </button>
                        ))}
                        {extra.length > 0 && !extra.some((o) => o.id === sel.id) && (
                          <button className="more-opts" onClick={() => setMore({ ...more, [L.key]: !open })}>
                            {open ? 'Fewer' : 'More patterns'}
                          </button>
                        )}
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
            <div className="tempo-row">
              <TempoSlider genre={p.genre} bpm={p.bpm} onBpm={p.onBpm} />
            </div>
            {SHOW_FAMOUS_BEATS && (
              <FamousBeats
                genre={p.genre.id}
                tried={tried?.id ?? null}
                bpm={p.bpm}
                playing={p.playing}
                onPlay={p.onPlay}
                onStop={p.onStop}
                onTry={(b) => tryBeat(b.id)}
                onTempo={(b) => {
                  p.onBpm(b.bpm)
                  p.onKit(b.kit)
                }}
                onBack={backToMine}
              />
            )}
            <div className="stage-foot">
              <button className="link-btn" onClick={p.onDone}>
                Happy with it? Skip to chords
              </button>
              <button className="btn green lg" onClick={() => go('tune')}>
                <Icon name="knob" size={26} /> Next: fine-tune
              </button>
            </div>
          </>
        )}

        {stage === 'tune' && (
          <>
            <Coach icon="knob">Polish your beat: tap squares to move hits, then change the speed, the swing and the drum sounds.</Coach>
            <div className="big-actions top">{playBtn(p.part === 'chorus' ? 'Play the chorus beat' : 'Play the beat')}</div>
            <div className="tune-grid">
              <div className="tune-card">
                <TempoSlider genre={p.genre} bpm={p.bpm} onBpm={p.onBpm} />
              </div>
              <div className="tune-card">
                <div className="tune-head">
                  <Icon name="swing" size={34} />
                  <b>Swing</b>
                  <span className="tune-val">{p.swing < 0.05 ? 'Straight' : p.swing < 0.25 ? 'A little' : 'Lots'}</span>
                </div>
                <input type="range" min={0} max={0.5} step={0.05} value={p.swing} onChange={(e) => p.onSwing(+e.target.value)} aria-label="Swing" />
                <p>Swing delays every second eighth note, so the beat bounces instead of marching. Listen to the hi-hat: straight is tick-tick-tick, lots is a lazy ta-da ta-da. Lo-fi and hip-hop use a lot of it.</p>
              </div>
              <div className="tune-card wide">
                <div className="tune-head">
                  <Icon name="drummachine" size={34} />
                  <b>Drum sounds</b>
                </div>
                <div className="chips">
                  {[...KITS].sort((a, b) => Number(b.fits.includes(p.genre.id)) - Number(a.fits.includes(p.genre.id))).map((k) => (
                    <button key={k.id} className={`chip-btn${p.kit === k.id ? ' on' : ''}`} onClick={() => p.onKit(k.id)}>
                      {k.name}
                      {k.fits.includes(p.genre.id) && <span className="fit">Fits {p.genre.name}</span>}
                    </button>
                  ))}
                </div>
                <p>The same pattern sounds completely different on another kit. Producers choose sounds as carefully as rhythms.</p>
              </div>
              <label className="tune-card toggle">
                <input type="checkbox" checked={p.fill} onChange={(e) => p.onFill(e.target.checked)} />
                <Icon name="snare" size={34} />
                <span>
                  <b>Drum fill</b>
                  <small>A quick snare roll at the end of each section leads into the next one.</small>
                </span>
              </label>
            </div>
            <div className="edit open">
              <span className="mini-label">Edit every step: tap a square to add or remove a hit</span>
              <DrumGrid grid={p.beat} bars={4} step={p.playing ? p.step : -1} onToggle={(d, s) => p.onCustom({ ...p.beat, [d]: p.beat[d].map((v, i) => (i === s ? !v : v)) })} />
            </div>
            <div className="stage-foot end">
              <button className="btn green lg" onClick={p.onDone}>
                <Icon name="check" size={26} /> Use this {p.part === 'chorus' ? 'chorus beat' : 'beat'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
