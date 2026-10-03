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
      <h2>Step 2: the chords</h2>
      <p className="lead">
        A chord is three notes played together. It sets the mood under everything else. Each box below lasts one bar of your beat.
        <b> Major chords</b> (C, F, G) sound bright. <b>Minor chords</b> (Am, Dm, Em) sound sad or serious.
      </p>

      <div className="panel">
        <div className="panel-head">
          <h3>Your chords</h3>
          {p.playing ? (
            <button className="btn primary" onClick={p.onStop}>Stop</button>
          ) : (
            <button className="btn primary" onClick={p.onPlay}>Play with my beat</button>
          )}
        </div>
        <div className="chord-row">
          {p.chords.map((c, i) => (
            <div key={i} className={`chord${isMinor(c) ? ' minor' : ' major'}${bar === i ? ' now' : ''}`}>
              <span>Bar {i + 1}</span>
              <b>{c}</b>
              <small>{isMinor(c) ? 'minor, sad' : 'major, bright'}</small>
            </div>
          ))}
        </div>
        <p className="info">The bass automatically plays the lowest note of each chord, in time with your kick drum.</p>
      </div>

      <h3 className="sub">Try other chords for this vibe</h3>
      <div className="options col">
        {options.map((o, i) => (
          <button key={i} className={`option wide${same(o.chords, p.chords) ? ' picked' : ''}`} onClick={() => p.onChords(o.chords)}>
            <b className="prog">{o.chords.join('  ·  ')}</b>
            <span>{o.why}</span>
            {o.from && <span className="pill">From {o.from}</span>}
          </button>
        ))}
      </div>
    </section>
  )
}
