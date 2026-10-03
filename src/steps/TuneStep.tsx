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
      <StepHead n={3} icon="mic" title="The tune">
        The tune (melody) is the part people hum in the shower. {EXAMPLE_TUNES[p.vibe].tip} Hum yours over the beat and chords and we
        turn it into notes: snapped to the beat, and moved into the right key so it can never sound off.
      </StepHead>
      <div className="card pad" style={{ ['--tab' as string]: 'var(--pink)', ['--tab-d' as string]: 'var(--pink-d)' }}>
        <span className="card-tab">
          <Icon name={p.choice === 'mine' ? 'mic' : 'clef'} /> {p.choice === 'mine' ? 'Your tune' : 'Example tune'}
        </span>
        <div className="card-head">
          <div className="seg">
            {INSTRUMENTS.map((i) => (
              <button key={i.id} className={p.instrument === i.id ? 'on' : ''} onClick={() => p.onInstrument(i.id)}>
                {i.label}
              </button>
            ))}
          </div>
          <div className="actions">
            {p.playing ? (
              <button className="btn navy" onClick={p.onStop}>
                <Icon name="stop" size={24} /> Stop
              </button>
            ) : (
              <button className="btn green" disabled={p.busy} onClick={p.onPlay}>
                <Icon name="play" size={24} /> Play everything
              </button>
            )}
            <button className="btn red" disabled={p.busy} onClick={p.onRecord}>
              <Icon name="record" size={24} /> {p.busy ? 'Recording...' : p.hasMine ? 'Hum again' : 'Record hum'}
            </button>
            {p.hasRaw && (
              <button className="btn white" disabled={p.busy} onClick={p.onRaw}>
                <Icon name="wave" size={24} /> My raw take
              </button>
            )}
          </div>
        </div>
        <p className="info">{p.info || 'Hum or sing "doo doo doo" for 4 bars after the count-in. Headphones help a lot.'}</p>
        {p.hasMine && (
          <div className="choose">
            <span>Use in my song:</span>
            <div className="seg">
              <button className={p.choice === 'mine' ? 'on' : ''} onClick={() => p.onChoice('mine')}>My tune</button>
              <button className={p.choice === 'example' ? 'on' : ''} onClick={() => p.onChoice('example')}>The example</button>
            </div>
          </div>
        )}
        <PianoRoll notes={p.notes} step={p.playing ? p.step : -1} onChange={p.onEdit} />
        <p className="fine">Click the grid to add or remove notes. Each column is a 16th of a bar; the gaps are bar lines.</p>
      </div>
    </section>
  )
}
