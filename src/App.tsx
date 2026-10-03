import { useEffect, useMemo, useState } from 'react'
import { BARS, DRUMS, STEPS, beatboxToHits, emptyDrums, hitsToGrid, humToNotes, noteName, pickChords } from './audio/analysis'
import type { Drum, DrumGrid, Note } from './audio/analysis'
import { play, playRaw, record, setBpm as engineBpm, setStepListener, song, stop } from './audio/engine'
import type { Instrument, Recording } from './audio/engine'
import './App.css'

const DRUM_LABEL: Record<Drum, { name: string; say: string }> = {
  kick: { name: 'Kick', say: 'say BOOM' },
  snare: { name: 'Snare', say: 'say PFF or K' },
  hat: { name: 'Hi-hat', say: 'say TSS' },
}

// Piano-roll rows: the C major notes from C6 down to C4.
const ROWS = [84, 83, 81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60]

const EXAMPLE_DRUMS = (): DrumGrid => {
  const g = emptyDrums()
  for (let s = 0; s < STEPS; s++) {
    const b = s % 16
    g.kick[s] = b === 0 || b === 6 || b === 8
    g.snare[s] = b === 4 || b === 12
    g.hat[s] = b % 2 === 0
  }
  return g
}
const EXAMPLE_NOTES: Note[] = [
  [0, 2, 64], [2, 2, 67], [4, 4, 69], [8, 2, 67], [10, 2, 64], [12, 4, 62],
  [16, 2, 60], [18, 2, 62], [20, 4, 64], [24, 4, 67], [28, 4, 69],
  [32, 2, 69], [34, 2, 72], [36, 4, 74], [40, 2, 72], [42, 2, 69], [44, 4, 67],
  [48, 2, 64], [50, 2, 67], [52, 4, 62], [56, 8, 60],
].map(([start, len, midi]) => ({ start, len, midi }))

export default function App() {
  const [bpm, setBpm] = useState(90)
  const [drums, setDrums] = useState<DrumGrid>(emptyDrums)
  const [notes, setNotes] = useState<Note[]>([])
  const [autoChords, setAutoChords] = useState(true)
  const [instrument, setInstrument] = useState<Instrument>('piano')
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(-1)
  const [busy, setBusy] = useState<'drums' | 'hum' | null>(null)
  const [count, setCount] = useState('')
  const [click, setClick] = useState(false)
  const [drumInfo, setDrumInfo] = useState('')
  const [humInfo, setHumInfo] = useState('')
  const [raw, setRaw] = useState<{ drums?: Recording; hum?: Recording }>({})

  const chords = useMemo(() => (autoChords && notes.length ? pickChords(notes) : null), [autoChords, notes])

  useEffect(() => {
    setStepListener(setStep)
  }, [])
  useEffect(() => {
    Object.assign(song, { drums, notes, chords, instrument })
  }, [drums, notes, chords, instrument])
  useEffect(() => engineBpm(bpm), [bpm])

  const startPlay = async () => {
    await play()
    setPlaying(true)
  }
  const stopPlay = () => {
    stop()
    setPlaying(false)
  }

  async function recordDrums() {
    setBusy('drums')
    setPlaying(false)
    setDrumInfo('')
    try {
      const rec = await record('drums', { click, onCount: setCount })
      setRaw((r) => ({ ...r, drums: rec }))
      const hits = beatboxToHits(rec.samples, rec.sampleRate, bpm, rec.preroll)
      console.table(hits)
      setDrums(hitsToGrid(hits))
      const n = (d: Drum) => hits.filter((h) => h.drum === d).length
      setDrumInfo(
        hits.length
          ? `Heard ${hits.length} sounds: ${n('kick')} kick, ${n('snare')} snare, ${n('hat')} hi-hat. Snapped to the nearest 16th note.`
          : 'Heard nothing. Get closer to the mic and go louder.',
      )
      if (hits.length) await startPlay()
    } catch (e) {
      setDrumInfo(`Mic problem: ${(e as Error).message}`)
    } finally {
      setBusy(null)
      setCount('')
    }
  }

  async function recordHum() {
    setBusy('hum')
    setPlaying(false)
    setHumInfo('')
    try {
      const rec = await record('hum', { click, onCount: setCount })
      setRaw((r) => ({ ...r, hum: rec }))
      const res = humToNotes(rec.samples, rec.sampleRate, bpm, rec.preroll)
      setNotes(res.notes)
      setHumInfo(
        res.notes.length
          ? `Found ${res.notes.length} notes. You hummed in about ${res.hummedKey} major` +
              (res.shift ? `, moved to C major so the chords fit.` : ', already C major.')
          : 'No tune found. Hum louder, "doo doo" works better than a closed-mouth hum.',
      )
      if (res.notes.length) await startPlay()
    } catch (e) {
      setHumInfo(`Mic problem: ${(e as Error).message}`)
    } finally {
      setBusy(null)
      setCount('')
    }
  }

  const toggleDrum = (d: Drum, s: number) => setDrums((g) => ({ ...g, [d]: g[d].map((v, i) => (i === s ? !v : v)) }))
  const noteAt = (midi: number, s: number) => notes.find((n) => n.midi === midi && s >= n.start && s < n.start + n.len)
  const addNote = (midi: number, s: number) =>
    setNotes((ns) => [...ns, { start: s, len: Math.min(2, STEPS - s), midi }].sort((a, b) => a.start - b.start))
  const removeNote = (n: Note) => setNotes((ns) => ns.filter((x) => x !== n))

  const cellClass = (s: number) => `cell${s % 4 === 0 ? ' beat' : ''}${s % 16 === 0 ? ' bar' : ''}${s === step ? ' now' : ''}`

  return (
    <div className="app">
      <header>
        <div>
          <h1>Songmaker</h1>
          <p className="tag">Prototype: mouth sounds in, music out.</p>
        </div>
        <div className="transport">
          <label className="bpm">
            Speed <b>{bpm} BPM</b>
            <input type="range" min={60} max={160} value={bpm} disabled={!!busy} onChange={(e) => setBpm(+e.target.value)} />
          </label>
          {playing ? (
            <button className="btn primary" onClick={stopPlay}>Stop</button>
          ) : (
            <button className="btn primary" onClick={startPlay} disabled={!!busy}>Play loop</button>
          )}
        </div>
      </header>

      <ol className="how">
        <li><b>1. Beatbox the drums.</b> We find each sound, decide if it was a BOOM, PFF or TSS, and snap it to the beat.</li>
        <li><b>2. Hum the tune.</b> We measure your pitch 90 times a second, snap it to the beat and into a key, and play it on a real instrument.</li>
        <li><b>3. Chords and bass appear.</b> We pick chords that fit your tune and a bassline that follows your kick.</li>
      </ol>

      <div className="toolbar">
        <button className="btn" disabled={!!busy} onClick={() => { setDrums(EXAMPLE_DRUMS()); setNotes(EXAMPLE_NOTES); setDrumInfo('Example beat loaded.'); setHumInfo('Example tune loaded.') }}>
          Load an example
        </button>
        <button className="btn" disabled={!!busy} onClick={() => { stopPlay(); setDrums(emptyDrums()); setNotes([]); setDrumInfo(''); setHumInfo(''); setRaw({}) }}>
          Clear all
        </button>
        <label className="check">
          <input type="checkbox" checked={click} onChange={(e) => setClick(e.target.checked)} />
          Keep the metronome on while recording (use headphones)
        </label>
      </div>

      <section className="track drums">
        <div className="track-head">
          <h2>Drums</h2>
          <div className="actions">
            <button className="btn rec" disabled={!!busy} onClick={recordDrums}>{busy === 'drums' ? 'Recording...' : 'Record beatbox'}</button>
            <button className="btn" disabled={!!busy || !raw.drums} onClick={() => raw.drums && playRaw(raw.drums.samples)}>Hear my raw take</button>
          </div>
        </div>
        <p className="info">{drumInfo || `${BARS} bars. After a 4-click count-in, beatbox along to the flashing beat.`}</p>
        <div className="grid-wrap">
          <div className="grid drum-grid">
            {DRUMS.map((d) => (
              <div className="row" key={d}>
                <div className="row-label"><b>{DRUM_LABEL[d].name}</b><span>{DRUM_LABEL[d].say}</span></div>
                {drums[d].map((on, s) => (
                  <button key={s} className={`${cellClass(s)}${on ? ` on ${d}` : ''}`} onClick={() => toggleDrum(d, s)} aria-label={`${d} step ${s + 1}`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="track melody">
        <div className="track-head">
          <h2>Tune</h2>
          <div className="actions">
            <select value={instrument} onChange={(e) => setInstrument(e.target.value as Instrument)}>
              <option value="piano">Piano</option>
              <option value="synth">Synth</option>
              <option value="bells">Bells</option>
            </select>
            <button className="btn rec" disabled={!!busy} onClick={recordHum}>{busy === 'hum' ? 'Recording...' : 'Record hum'}</button>
            <button className="btn" disabled={!!busy || !raw.hum} onClick={() => raw.hum && playRaw(raw.hum.samples)}>Hear my raw take</button>
          </div>
        </div>
        <p className="info">{humInfo || 'Hum or sing "doo doo doo" over the beat. Click the grid to add or remove notes.'}</p>
        <div className="grid-wrap">
          <div className="grid roll">
            {ROWS.map((midi) => (
              <div className={`row${midi % 12 === 0 ? ' c-row' : ''}`} key={midi}>
                <div className="row-label key"><b>{noteName(midi)}</b></div>
                {Array.from({ length: STEPS }, (_, s) => {
                  const n = noteAt(midi, s)
                  const head = n && n.start === s
                  return (
                    <button
                      key={s}
                      className={`${cellClass(s)}${n ? ' on note' : ''}${head ? ' head' : ''}${n && s === n.start + n.len - 1 ? ' tail' : ''}`}
                      onClick={() => (n ? removeNote(n) : addNote(midi, s))}
                      aria-label={`${noteName(midi)} step ${s + 1}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="track chords">
        <div className="track-head">
          <h2>Chords + bass</h2>
          <label className="check">
            <input type="checkbox" checked={autoChords} onChange={(e) => setAutoChords(e.target.checked)} />
            Add automatically
          </label>
        </div>
        <div className="chord-row">
          {Array.from({ length: BARS }, (_, b) => (
            <div key={b} className={`chord${step >= b * 16 && step < b * 16 + 16 ? ' now' : ''}`}>
              <span>Bar {b + 1}</span>
              <b>{chords ? chords[b] : '-'}</b>
            </div>
          ))}
        </div>
      </section>

      {busy && count && (
        <div className="overlay" aria-live="assertive">
          <div className={`count${count.startsWith('rec') ? ' live' : ''}`}>
            {count.startsWith('rec') ? (
              <>
                <span className="dot" />
                <b>{busy === 'drums' ? 'Beatbox now' : 'Hum now'}</b>
                <small>Bar {count.slice(4)} of {BARS}</small>
                <div className="pulse">{[0, 1, 2, 3].map((i) => <i key={i} className={step >= 0 && Math.floor(step / 4) % 4 === i ? 'lit' : ''} />)}</div>
              </>
            ) : (
              <>
                <b className="big">{count}</b>
                <small>Get ready</small>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
