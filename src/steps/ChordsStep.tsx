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
}

const isMinor = (c: string) => c.endsWith('m')

export function ChordsStep(p: Props) {
  const options = [
    { chords: p.template.chords, why: p.template.chordsWhy, from: p.template.ref?.title ?? p.template.name },
    ...PROGRESSIONS[p.vibe].map((o) => ({ ...o, from: '' })),
  ]
  const bar = p.playing && p.step >= 0 ? Math.floor(p.step / 16) : -1
  const same = (a: string[], b: string[]) => a.join() === b.join()
  return (
    <section className="step">
      <StepHead n={2} icon="keys" title="The chords">
        A chord is three notes played together. It sets the mood under everything else, and each box lasts one bar of your beat.
        <b> Major chords</b> sound bright. <b>Minor chords</b> (the ones with an m) sound sad or serious.
      </StepHead>

      <div className="card pad" style={{ ['--tab' as string]: 'var(--purple)', ['--tab-d' as string]: 'var(--purple-d)' }}>
        <span className="card-tab">
          <Icon name="keys" /> Your chords
        </span>
        <div className="card-head">
          <span className="card-title">{p.chords.join(' - ')}</span>
          {p.playing ? (
            <button className="btn navy" onClick={p.onStop}>
              <Icon name="stop" size={24} /> Stop
            </button>
          ) : (
            <button className="btn green" onClick={p.onPlay}>
              <Icon name="play" size={24} /> Play with my beat
            </button>
          )}
        </div>
        <div className="chord-row">
          {p.chords.map((c, i) => (
            <div key={i} className={`chord${isMinor(c) ? ' minor' : ' major'}${bar === i ? ' now' : ''}`}>
              <span className="chord-bar">Bar {i + 1}</span>
              <b>{c}</b>
              <span className="chord-mood">
                <Icon name={isMinor(c) ? 'sad' : 'happy'} size={20} /> {isMinor(c) ? 'minor, sad' : 'major, bright'}
              </span>
            </div>
          ))}
        </div>
        <p className="info">
          <Icon name="bulb" size={20} /> The bass automatically plays the lowest note of each chord, in time with your kick drum.
        </p>
      </div>

      <h3 className="sub">Try other chords for this vibe</h3>
      <div className="prog-list">
        {options.map((o, i) => (
          <button key={i} className={`prog-card${same(o.chords, p.chords) ? ' picked' : ''}`} onClick={() => p.onChords(o.chords)}>
            <span className="prog-chords">
              {o.chords.map((c, j) => (
                <span key={j} className={`mini-chord${isMinor(c) ? ' minor' : ' major'}`}>{c}</span>
              ))}
            </span>
            <span className="prog-why">{o.why}</span>
            {o.from && (
              <span className="chip">
                <Icon name="vinyl" size={18} /> From {o.from}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
