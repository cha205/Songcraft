import type { Note } from '../audio/analysis'
import type { Instrument } from '../audio/engine'
import { PianoRoll } from '../components/PianoRoll'
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

export function TuneStep(p: Props) {
  return (
    <section className="step">
      <h2>Step 3: the tune</h2>
      <p className="lead">
        The tune (melody) is the part people hum in the shower. {EXAMPLE_TUNES[p.vibe].tip} Hum yours over the beat and chords, and we
        turn it into notes: snapped to the beat, and moved into the right key so it can never sound off.
      </p>
      <div className="panel">
        <div className="panel-head">
          <h3>{p.choice === 'mine' ? 'Your tune' : 'Example tune'}</h3>
          <div className="actions">
            <select value={p.instrument} onChange={(e) => p.onInstrument(e.target.value as Instrument)} aria-label="Instrument">
              <option value="piano">Piano</option>
              <option value="synth">Synth</option>
              <option value="bells">Bells</option>
            </select>
            {p.playing ? (
              <button className="btn primary" onClick={p.onStop}>Stop</button>
            ) : (
              <button className="btn primary" disabled={p.busy} onClick={p.onPlay}>Play everything</button>
            )}
            <button className="btn rec" disabled={p.busy} onClick={p.onRecord}>{p.busy ? 'Recording...' : p.hasMine ? 'Hum again' : 'Record hum'}</button>
            {p.hasRaw && <button className="btn" disabled={p.busy} onClick={p.onRaw}>Hear my raw take</button>}
          </div>
        </div>
        <p className="info">{p.info || 'Hum or sing "doo doo doo" for 4 bars after the count-in. Headphones help a lot.'}</p>
        {p.hasMine && (
          <div className="choose">
            <span>Use in my song:</span>
            <button className={`btn${p.choice === 'mine' ? ' primary' : ''}`} onClick={() => p.onChoice('mine')}>My tune</button>
            <button className={`btn${p.choice === 'example' ? ' primary' : ''}`} onClick={() => p.onChoice('example')}>The example</button>
          </div>
        )}
        <PianoRoll notes={p.notes} step={p.playing ? p.step : -1} onChange={p.onEdit} />
        <p className="fine">Click the grid to add or remove notes. Each column is a 16th of a bar; the thick gaps are bar lines.</p>
      </div>
    </section>
  )
}
