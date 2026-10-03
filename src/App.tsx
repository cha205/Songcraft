import { useEffect, useMemo, useState } from 'react'
import { beatboxToHits, emptyDrums, hitsToGrid, humToNotes } from './audio/analysis'
import type { Drum, DrumGrid, Note } from './audio/analysis'
import { ALL, play, playRaw, playSong, record, setBpm, setStepListener, song, stop } from './audio/engine'
import type { Instrument, Layers, Recording } from './audio/engine'
import { RecordOverlay } from './components/RecordOverlay'
import { EXAMPLE_TUNES, TEMPLATES, VIBES, templateGrid } from './data/templates'
import type { VibeId } from './data/templates'
import { BeatStep } from './steps/BeatStep'
import { ChordsStep } from './steps/ChordsStep'
import { LyricsStep } from './steps/LyricsStep'
import { SECTIONS } from './data/sections'
import { SongStep } from './steps/SongStep'
import { TuneStep } from './steps/TuneStep'
import { VibeStep } from './steps/VibeStep'
import './App.css'

const STEP_NAMES = ['Vibe', 'Beat', 'Chords', 'Tune', 'Words', 'Song']
const NONE: Layers = { drums: false, chords: false, bass: false, melody: false }
// What you hear on each step: drums alone while learning the beat, then layers stack up.
const LAYERS_BY_STEP: Layers[] = [NONE, { ...NONE, drums: true }, { drums: true, chords: true, bass: true, melody: false }, ALL, ALL, ALL]
const BLANK_LYRICS = ['', '', '', '']

export default function App() {
  const [stepIdx, setStepIdx] = useState(0)
  const [vibe, setVibe] = useState<VibeId | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [myDrums, setMyDrums] = useState<DrumGrid | null>(null)
  const [drumChoice, setDrumChoice] = useState<'template' | 'mine'>('template')
  const [chords, setChords] = useState<string[]>([])
  const [myNotes, setMyNotes] = useState<Note[] | null>(null)
  const [tuneChoice, setTuneChoice] = useState<'example' | 'mine'>('example')
  const [instrument, setInstrument] = useState<Instrument>('piano')
  const [lyrics, setLyrics] = useState<string[]>(BLANK_LYRICS)
  const [playing, setPlaying] = useState(false)
  const [playStep, setPlayStep] = useState(-1)
  const [busy, setBusy] = useState<'drums' | 'hum' | null>(null)
  const [count, setCount] = useState('')
  const [click, setClick] = useState(false)
  const [raw, setRaw] = useState<{ drums?: Recording; hum?: Recording }>({})
  const [drumInfo, setDrumInfo] = useState('')
  const [humInfo, setHumInfo] = useState('')
  const [section, setSection] = useState(-1)
  const [songPlaying, setSongPlaying] = useState(false)
  const [wavUrl, setWavUrl] = useState<string | null>(null)

  const template = TEMPLATES.find((t) => t.id === templateId) ?? null
  const tplGrid = useMemo(() => (template ? templateGrid(template) : emptyDrums()), [template])
  const drums = drumChoice === 'mine' && myDrums ? myDrums : tplGrid
  const notes = useMemo(() => (vibe ? (tuneChoice === 'mine' && myNotes ? myNotes : EXAMPLE_TUNES[vibe].notes) : []), [vibe, tuneChoice, myNotes])

  useEffect(() => {
    setStepListener(setPlayStep)
  }, [])
  useEffect(() => {
    Object.assign(song, { drums, notes, chords: stepIdx >= 2 ? chords : null, instrument, layers: LAYERS_BY_STEP[stepIdx] })
  }, [drums, notes, chords, instrument, stepIdx])
  useEffect(() => {
    if (template) setBpm(template.bpm)
  }, [template])

  const halt = () => {
    stop()
    setPlaying(false)
    setSongPlaying(false)
  }
  const startPlay = async () => {
    await play()
    setPlaying(true)
  }
  const goTo = (i: number) => {
    halt()
    setStepIdx(i)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pickTemplate(id: string) {
    halt()
    const t = TEMPLATES.find((x) => x.id === id)!
    setTemplateId(id)
    setChords(t.chords)
  }

  function pickVibe(v: VibeId) {
    if (v !== vibe) {
      setVibe(v)
      pickTemplate(TEMPLATES.find((t) => t.vibe === v)!.id)
      setMyDrums(null)
      setDrumChoice('template')
      setMyNotes(null)
      setTuneChoice('example')
      setLyrics(BLANK_LYRICS)
      setWavUrl(null)
      setRaw({})
      setDrumInfo('')
      setHumInfo('')
    }
    goTo(1)
  }

  async function recordDrums() {
    if (!template) return
    halt()
    setBusy('drums')
    setDrumInfo('')
    try {
      const rec = await record('drums', { click, onCount: setCount })
      setRaw((r) => ({ ...r, drums: rec }))
      const hits = beatboxToHits(rec.samples, rec.sampleRate, template.bpm, rec.preroll)
      console.table(hits)
      const n = (d: Drum) => hits.filter((h) => h.drum === d).length
      if (!hits.length) {
        setDrumInfo('Heard nothing. Get closer to the mic and go louder.')
      } else {
        setMyDrums(hitsToGrid(hits))
        setDrumChoice('mine')
        setDrumInfo(`Heard ${hits.length} sounds: ${n('kick')} BOOM, ${n('snare')} PFF, ${n('hat')} TSS. Each one snapped to the nearest 16th note.`)
        await startPlay()
      }
    } catch (e) {
      setDrumInfo(`Mic problem: ${(e as Error).message}`)
    } finally {
      setBusy(null)
      setCount('')
    }
  }

  async function recordHum() {
    if (!template) return
    halt()
    setBusy('hum')
    setHumInfo('')
    try {
      const rec = await record('hum', { click, onCount: setCount })
      setRaw((r) => ({ ...r, hum: rec }))
      const res = humToNotes(rec.samples, rec.sampleRate, template.bpm, rec.preroll)
      if (!res.notes.length) {
        setHumInfo('No tune found. Hum louder; "doo doo" works better than a closed-mouth hum.')
      } else {
        setMyNotes(res.notes)
        setTuneChoice('mine')
        setHumInfo(
          `Found ${res.notes.length} notes. You hummed in about ${res.hummedKey} major` +
            (res.shift ? '; we moved it into C so it fits the chords.' : ', which already fits the chords.'),
        )
        await startPlay()
      }
    } catch (e) {
      setHumInfo(`Mic problem: ${(e as Error).message}`)
    } finally {
      setBusy(null)
      setCount('')
    }
  }

  async function playWholeSong() {
    halt()
    setSongPlaying(true)
    const wav = await playSong(
      SECTIONS.map((s) => s.layers),
      setSection,
    )
    setSongPlaying(false)
    if (wav) {
      if (wavUrl) URL.revokeObjectURL(wavUrl)
      setWavUrl(URL.createObjectURL(wav))
    }
  }

  function restart() {
    halt()
    setVibe(null)
    setTemplateId(null)
    setWavUrl(null)
    setStepIdx(0)
  }

  const vibeObj = VIBES.find((v) => v.id === vibe)
  const canGo = (i: number) => i === 0 || !!vibe

  return (
    <div className={`app${vibe ? ` theme-${vibe}` : ''}`}>
      <header>
        <div>
          <h1>Songmaker</h1>
          <p className="tag">Learn how hit songs are built. Then make your own with your voice.</p>
        </div>
        {vibeObj && template && (
          <div className="now-making">
            <span>Making a</span>
            <b>{vibeObj.name} song</b>
            <span>{template.bpm} BPM</span>
          </div>
        )}
      </header>

      <nav className="stepper" aria-label="Steps">
        {STEP_NAMES.map((name, i) => (
          <button key={name} className={`stage${i === stepIdx ? ' current' : ''}${i < stepIdx ? ' done' : ''}`} disabled={!canGo(i) || !!busy} onClick={() => goTo(i)}>
            <span className="stage-num">{i + 1}</span>
            {name}
          </button>
        ))}
      </nav>

      {stepIdx === 0 && <VibeStep vibe={vibe} onPick={pickVibe} />}

      {stepIdx === 1 && vibe && template && (
        <BeatStep
          vibe={vibe}
          template={template}
          onTemplate={pickTemplate}
          myDrums={myDrums}
          onMyDrums={setMyDrums}
          choice={drumChoice}
          onChoice={setDrumChoice}
          step={playStep}
          playing={playing}
          onPlay={startPlay}
          onStop={halt}
          busy={!!busy}
          onRecord={recordDrums}
          info={drumInfo}
          hasRaw={!!raw.drums}
          onRaw={() => raw.drums && playRaw(raw.drums.samples)}
          click={click}
          onClick={setClick}
        />
      )}

      {stepIdx === 2 && vibe && template && (
        <ChordsStep vibe={vibe} template={template} chords={chords} onChords={setChords} step={playStep} playing={playing} onPlay={startPlay} onStop={halt} />
      )}

      {stepIdx === 3 && vibe && (
        <TuneStep
          vibe={vibe}
          notes={notes}
          onEdit={(n) => {
            setMyNotes(n)
            setTuneChoice('mine')
          }}
          hasMine={!!myNotes}
          choice={tuneChoice}
          onChoice={setTuneChoice}
          instrument={instrument}
          onInstrument={setInstrument}
          step={playStep}
          playing={playing}
          onPlay={startPlay}
          onStop={halt}
          busy={!!busy}
          onRecord={recordHum}
          info={humInfo}
          hasRaw={!!raw.hum}
          onRaw={() => raw.hum && playRaw(raw.hum.samples)}
        />
      )}

      {stepIdx === 4 && vibe && (
        <LyricsStep vibe={vibe} notes={notes} lyrics={lyrics} onLyrics={setLyrics} step={playStep} playing={playing} onPlay={startPlay} onStop={halt} />
      )}

      {stepIdx === 5 && vibeObj && template && (
        <SongStep
          vibe={vibeObj}
          template={template}
          chords={chords}
          lyrics={lyrics}
          section={section}
          step={songPlaying ? playStep : -1}
          songPlaying={songPlaying}
          onPlaySong={playWholeSong}
          onStop={halt}
          wavUrl={wavUrl}
          usedMine={{ beat: drumChoice === 'mine' && !!myDrums, tune: tuneChoice === 'mine' && !!myNotes }}
          onRestart={restart}
        />
      )}

      {stepIdx > 0 && (
        <div className="nav">
          <button className="btn" disabled={!!busy} onClick={() => goTo(stepIdx - 1)}>
            Back
          </button>
          {stepIdx < STEP_NAMES.length - 1 && (
            <button className="btn primary" disabled={!!busy} onClick={() => goTo(stepIdx + 1)}>
              Next: {STEP_NAMES[stepIdx + 1]}
            </button>
          )}
        </div>
      )}

      <RecordOverlay busy={busy} count={count} step={playStep} />
    </div>
  )
}
