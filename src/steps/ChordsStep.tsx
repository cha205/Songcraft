import { useState } from 'react'
import { previewChord } from '../audio/engine'
import { Coach } from '../components/Guide'
import { Icon } from '../components/Icon'
import { StepHead } from '../components/StepHead'
import { BASSES, CHORD_INSTS, FEELING_INFO } from '../data/genres'
import type { BassId, ChordInstId, Feeling, Genre } from '../data/genres'
import { nextChords } from '../data/harmony'

type Props = {
  part: 'verse' | 'chorus'
  genre: Genre
  feeling: Feeling
  chords: string[]
  onChords: (c: string[]) => void
  chordInsts: ChordInstId[]
  onChordInsts: (c: ChordInstId[]) => void
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
  const [slot, setSlot] = useState(0)
  const other: Feeling = p.feeling === 'bright' ? 'dark' : 'bright'
  const options = [
    ...p.genre.chords[p.feeling].map((o, i) => ({ ...o, tag: i === 0 ? `Fits ${p.genre.name}` : '' })),
    ...p.genre.chords[other].map((o) => ({ ...o, tag: `${FEELING_INFO[other].name} version` })),
  ]
  const bar = p.playing && p.step >= 0 ? Math.floor(p.step / 16) : -1
  const same = (a: string[], b: string[]) => a.join() === b.join()
  const ideas = nextChords(p.chords, slot, p.genre.id, p.feeling)
  const pick = (chord: string) => {
    p.onChords(p.chords.map((c, i) => (i === slot ? chord : c)))
    // Stay on this bar so every idea can be tried; the user taps the next bar when they are happy.
    if (!p.playing) previewChord(chord)
  }
  const toggleInst = (id: ChordInstId) => p.onChordInsts(p.chordInsts.includes(id) ? p.chordInsts.filter((x) => x !== id) : [...p.chordInsts, id])

  return (
    <section className="step">
      <StepHead icon="keys" title={p.part === 'chorus' ? 'Choose the chorus chords' : 'Choose the chords and bass'}>
        Chords are groups of notes played together. They decide whether a song sounds happy or sad. The bass plays the lowest note of
        each chord and ties it to the drums.
      </StepHead>

      <div className="card stage-card">
        <Coach icon="keys">
          Build your progression one bar at a time. Tap a bar, then try the ideas below as often as you like: the best fit for {FEELING_INFO[p.feeling].name.toLowerCase()} {p.genre.name} is at
          the top. Press play to hear every choice with your beat.
        </Coach>
        <div className="chord-row">
          {p.chords.map((c, i) => (
            <button key={i} className={`chord${isMinor(c) ? ' minor' : ' major'}${bar === i ? ' now' : ''}${slot === i ? ' editing' : ''}`} onClick={() => setSlot(i)}>
              <span className="chord-bar">Bar {i + 1}</span>
              <b>{c}</b>
              <span className="chord-mood">
                <Icon name={isMinor(c) ? 'dark' : 'bright'} size={22} /> {isMinor(c) ? 'Minor, darker' : 'Major, brighter'}
              </span>
            </button>
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

        <div className="ideas">
          <span className="mini-label">
            {slot === 0 ? 'Ideas for the first chord' : `Ideas for bar ${slot + 1}, after ${p.chords[slot - 1]}`} · best first
          </span>
          <div className="idea-list">
            {ideas.map((x) => (
              <button key={x.chord} className={`idea${p.chords[slot] === x.chord ? ' on' : ''}${x.best ? ' best' : ''}`} onClick={() => pick(x.chord)}>
                <b className={isMinor(x.chord) ? 'minor' : 'major'}>{x.chord}</b>
                <span>
                  {x.best && <i className="best-tag">Best fit</i>}
                  {x.why}
                </span>
              </button>
            ))}
          </div>
        </div>

        <details className="ready-made">
          <summary>Or start from a ready-made progression</summary>
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
        </details>

        <span className="mini-label">Play the chords on · pick one or layer several</span>
        <div className="inst-row wrap">
          {CHORD_INSTS.map((c) => (
            <button key={c.id} className={`inst${p.chordInsts.includes(c.id) ? ' on' : ''}`} onClick={() => toggleInst(c.id)} title={c.why}>
              <Icon name={c.icon} size={44} />
              <span>{c.name}</span>
              {c.fits.includes(p.genre.id) && <small className="fit-tag">Fits {p.genre.name}</small>}
            </button>
          ))}
        </div>
        <p className="layer-why">
          {p.chordInsts.length === 0
            ? 'No chord instrument: only the bass and melody play. Fine for a stripped-back sound.'
            : CHORD_INSTS.filter((c) => p.chordInsts.includes(c.id))
                .map((c) => `${c.name}: ${c.why}`)
                .join(' ')}
        </p>

        <span className="mini-label">Bass style</span>
        <div className="bass-list grid">
          {BASSES.map((b) => (
            <button key={b.id} className={`bass-opt${p.bass === b.id ? ' on' : ''}`} onClick={() => p.onBass(b.id)}>
              <Icon name={b.id === 'sub' ? 'subwoofer' : 'bassguitar'} size={36} />
              <span>
                <b>
                  {b.name}
                  {b.fits.includes(p.genre.id) && <small className="fit-tag">Fits {p.genre.name}</small>}
                </b>
                <small>{b.why}</small>
              </span>
            </button>
          ))}
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
