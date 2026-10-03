import type { Note } from '../audio/analysis'
import type { Instrument } from '../audio/engine'
import { Icon } from '../components/Icon'
import { PianoRoll } from '../components/PianoRoll'
import { StepHead } from '../components/StepHead'
import { EXAMPLE_TUNES } from '../data/templates'
import type { VibeId } from '../data/templates'

type Props = {
  vibe: VibeId
  notes: Note[]
  onEdit: (n: Note[]) => void
  hasMine: boolean
  choice: 'example' | 'mine'
  onChoice: (c: 'example' | 'mine') => void
  instrument: Instrument
  onInstrument: (i: Instrument) => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  busy: boolean
  onRecord: () => void
  info: string
  hasRaw: boolean
  onRaw: () => void
}

const INSTRUMENTS: { id: Instrument; label: string }[] = [
  { id: 'piano', label: 'Piano' },
  { id: 'synth', label: 'Synth' },
  { id: 'bells', label: 'Bells' },
]

export function TuneStep(p: Props) {
  return (
    <section className="step">
      <StepHead n={3} icon="mic" title="Record the melody">
        The melody is the part of a song you hum along to. {EXAMPLE_TUNES[p.vibe].tip} Hum your own over the drums and chords, and
        Songmaker converts your voice into notes that stay on the beat and in key.
      </StepHead>
      <div className="card pad">
        <span className="card-tab tab-pink">
          <Icon name={p.choice === 'mine' ? 'mic' : 'clef'} /> {p.choice === 'mine' ? 'Your melody' : 'Example melody'}
        </span>
        <div className="card-head">
          <div className="seg" role="group" aria-label="Instrument">
            {INSTRUMENTS.map((i) => (
              <button key={i.id} className={p.instrument === i.id ? 'on' : ''} onClick={() => p.onInstrument(i.id)}>
                {i.label}
              </button>
            ))}
          </div>
          <div className="actions">
            {p.playing ? (
              <button className="btn ink" onClick={p.onStop}>
                <Icon name="stop" size={24} /> Stop
              </button>
            ) : (
              <button className="btn mint" disabled={p.busy} onClick={p.onPlay}>
                <Icon name="play" size={24} /> Play
              </button>
            )}
            <button className="btn brand" disabled={p.busy} onClick={p.onRecord}>
              <Icon name="record" size={24} /> {p.busy ? 'Recording' : p.hasMine ? 'Record again' : 'Record'}
            </button>
            {p.hasRaw && (
              <button className="btn white" disabled={p.busy} onClick={p.onRaw}>
                <Icon name="wave" size={24} /> Play my recording
              </button>
            )}
          </div>
        </div>
        <p className="info">{p.info || 'After the count-in, hum or sing "doo" for four bars. Headphones give the best results.'}</p>
        {p.hasMine && (
          <div className="choose">
            <span>Use in song</span>
            <div className="seg">
              <button className={p.choice === 'mine' ? 'on' : ''} onClick={() => p.onChoice('mine')}>My melody</button>
              <button className={p.choice === 'example' ? 'on' : ''} onClick={() => p.onChoice('example')}>Example</button>
            </div>
          </div>
        )}
        <PianoRoll notes={p.notes} step={p.playing ? p.step : -1} onChange={p.onEdit} />
        <p className="fine">Select a cell to add or remove a note. Each column is a sixteenth note, and the gaps mark the bar lines.</p>
      </div>
    </section>
  )
}
