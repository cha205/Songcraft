import { Coach } from '../components/Guide'
import { Icon } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { BASSES, CHORD_INSTS, FEELING_INFO } from '../data/genres'
import type { BassId, ChordInstId, Feeling, Genre } from '../data/genres'

type Props = {
  genre: Genre
  feeling: Feeling
  chords: string[]
  onChords: (c: string[]) => void
  chordInst: ChordInstId
  onChordInst: (c: ChordInstId) => void
  bass: BassId
  onBass: (b: BassId) => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  onDone: () => void
}

const isMinor = (c: string) => c.endsWith('m')

export function ChordsStep(p: Props) {
  const other: Feeling = p.feeling === 'bright' ? 'dark' : 'bright'
  const options = [
    ...p.genre.chords[p.feeling].map((o, i) => ({ ...o, tag: i === 0 ? `Fits ${p.genre.name}` : '' })),
    ...p.genre.chords[other].map((o) => ({ ...o, tag: `${FEELING_INFO[other].name} version` })),
  ]
  const bar = p.playing && p.step >= 0 ? Math.floor(p.step / 16) : -1
  const same = (a: string[], b: string[]) => a.join() === b.join()
  return (
    <section className="step">
      <StepHead icon="keys" title="Choose the chords and bass">
        Chords are groups of notes played together. They decide whether a song sounds happy or sad. The bass plays the lowest note of
        each chord and ties it to the drums.
      </StepHead>

      <div className="card stage-card">
        <Coach icon="keys">Press play, then try the other chord sets. Listen for how the bright and dark versions change the mood.</Coach>
        <div className="chord-row">
          {p.chords.map((c, i) => (
            <div key={i} className={`chord${isMinor(c) ? ' minor' : ' major'}${bar === i ? ' now' : ''}`}>
              <span className="chord-bar">Bar {i + 1}</span>
              <b>{c}</b>
              <span className="chord-mood">
                <Icon name={isMinor(c) ? 'dark' : 'bright'} size={22} /> {isMinor(c) ? 'Minor, darker' : 'Major, brighter'}
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
              <Icon name="play" size={30} /> Play with my beat
            </button>
          )}
        </div>

        <span className="mini-label">Chord sets</span>
        <div className="prog-list">
          {options.map((o, i) => (
            <button key={i} className={`prog-card${same(o.chords, p.chords) ? ' on' : ''}`} onClick={() => p.onChords(o.chords)}>
              <span className="prog-chords">
                {o.chords.map((c, j) => (
                  <span key={j} className={`mini-chord${isMinor(c) ? ' minor' : ' major'}`}>{c}</span>
                ))}
              </span>
              <span className="prog-why">{o.why}</span>
              {o.tag && <span className="pill">{o.tag}</span>}
            </button>
          ))}
        </div>

        <div className="two-col">
          <div>
            <span className="mini-label">Play the chords on</span>
            <div className="inst-row">
              {CHORD_INSTS.map((c) => (
                <button key={c.id} className={`inst${p.chordInst === c.id ? ' on' : ''}`} onClick={() => p.onChordInst(c.id)}>
                  <Icon name={c.icon} size={44} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mini-label">Bass style</span>
            <div className="bass-list">
              {BASSES.map((b) => (
                <button key={b.id} className={`bass-opt${p.bass === b.id ? ' on' : ''}`} onClick={() => p.onBass(b.id)}>
                  <Icon name={b.id === 'sub' ? 'subwoofer' : 'bassguitar'} size={36} />
                  <span>
                    <b>{b.name}</b>
                    <small>{b.why}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="stage-foot end">
          <button className="btn green lg" onClick={p.onDone}>
            <Icon name="check" size={26} /> Use these chords
          </button>
        </div>
      </div>
    </section>
  )
}
