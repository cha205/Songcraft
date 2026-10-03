import { Coach } from '../components/Guide'
import { Icon } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { PROGRESSIONS } from '../data/templates'
import type { Template, VibeId } from '../data/templates'

type Props = {
  vibe: VibeId
  template: Template
  chords: string[]
  onChords: (c: string[]) => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  onDone: () => void
}

const isMinor = (c: string) => c.endsWith('m')

export function ChordsStep(p: Props) {
  const options = [
    { chords: p.template.chords, why: p.template.chordsWhy, from: p.template.ref?.title ?? '' },
    ...PROGRESSIONS[p.vibe].map((o) => ({ ...o, from: '' })),
  ]
  const bar = p.playing && p.step >= 0 ? Math.floor(p.step / 16) : -1
  const same = (a: string[], b: string[]) => a.join() === b.join()
  return (
    <section className="step">
      <StepHead icon="keys" title="Choose the chords">
        Chords are groups of notes that set the feeling of a song. Your song uses four, one for each bar of the beat.
      </StepHead>

      <div className="card stage-card">
        <Coach icon="keys">Press play to hear these chords with your beat. Pick another set below if you want a different feel.</Coach>
        <div className="chord-row">
          {p.chords.map((c, i) => (
            <div key={i} className={`chord${isMinor(c) ? ' minor' : ' major'}${bar === i ? ' now' : ''}`}>
              <span className="chord-bar">Bar {i + 1}</span>
              <b>{c}</b>
              <span className="chord-mood">
                <Icon name={isMinor(c) ? 'sad' : 'happy'} size={22} /> {isMinor(c) ? 'Darker' : 'Brighter'}
              </span>
            </div>
          ))}
        </div>
        <div className="big-actions">
          {p.playing ? (
            <button className="btn navy xl" onClick={p.onStop}>
              <Icon name="stop" size={30} /> Stop
            </button>
          ) : (
            <button className="btn green xl" onClick={p.onPlay}>
              <Icon name="play" size={30} /> Play chords with my beat
            </button>
          )}
        </div>
        <p className="note">
          <Icon name="bulb" size={22} /> Songmaker adds a bass line for you. It follows the chords and your kick drum.
        </p>

        <span className="mini-label">Other chords for this mood</span>
        <div className="prog-list">
          {options.map((o, i) => (
            <button key={i} className={`prog-card${same(o.chords, p.chords) ? ' on' : ''}`} onClick={() => p.onChords(o.chords)}>
              <span className="prog-chords">
                {o.chords.map((c, j) => (
                  <span key={j} className={`mini-chord${isMinor(c) ? ' minor' : ' major'}`}>{c}</span>
                ))}
              </span>
              <span className="prog-why">{o.why}</span>
              {o.from && <span className="pill">From {o.from}</span>}
            </button>
          ))}
        </div>
        <div className="stage-foot end">
          <button className="btn green lg" onClick={p.onDone}>
            <Icon name="star" size={26} /> Use these chords
          </button>
        </div>
      </div>
    </section>
  )
}
