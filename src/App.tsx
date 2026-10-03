import { useEffect, useMemo, useState } from 'react'
import { beatboxToHits, emptyDrums, hitsToGrid, humToNotes } from './audio/analysis'
import type { Drum, DrumGrid, Note } from './audio/analysis'
import { ALL, play, playRaw, playSong, record, setBpm, setStepListener, song, stop } from './audio/engine'
import type { Instrument, Layers, Recording } from './audio/engine'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'
import { RecordOverlay } from './components/RecordOverlay'
import { TrackPanel } from './components/TrackPanel'
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

const STEP_NAMES = ['Mood', 'Drums', 'Chords', 'Melody', 'Lyrics', 'Song']
const STEP_ICONS: IconName[] = ['sparkle', 'kick', 'keys', 'mic', 'notebook', 'vinyl']
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
  const [songTitle, setSongTitle] = useState('')

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
      setSongTitle('')
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
        setDrumInfo('No sounds detected. Move closer to the microphone and try again.')
      } else {
        setMyDrums(hitsToGrid(hits))
        setDrumChoice('mine')
        setDrumInfo(`Detected ${hits.length} sounds: ${n('kick')} kick, ${n('snare')} snare, and ${n('hat')} hi-hat. Songmaker aligned each one to the nearest sixteenth note.`)
        await startPlay()
      }
    } catch (e) {
      setDrumInfo(`Microphone unavailable: ${(e as Error).message}`)
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
        setHumInfo('No melody detected. Try singing "doo" instead of humming with your mouth closed.')
      } else {
        setMyNotes(res.notes)
        setTuneChoice('mine')
        setHumInfo(
          `Detected ${res.notes.length} notes in roughly ${res.hummedKey} major. ` +
            (res.shift ? 'Songmaker moved the melody to C so it matches the chords.' : 'That already matches the chords.'),
        )
        await startPlay()
      }
    } catch (e) {
      setHumInfo(`Microphone unavailable: ${(e as Error).message}`)
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

  const stepProps = { step: playStep, playing, onPlay: startPlay, onStop: halt }

  return (
    <div className={`app theme-${vibe ?? 'none'}${stepIdx === 0 ? ' is-landing' : ''}`}>
      <div className="backdrop" aria-hidden>
        <i className="blob b1" />
        <i className="blob b2" />
        <i className="blob b3" />
        <div className="staff" />
      </div>

      <header className="topbar">
        <button className="logo" onClick={() => goTo(0)} disabled={!!busy}>
          <span className="logo-mark">
            <Icon name="vinyl" size={34} className={playing || songPlaying ? 'spin' : ''} />
          </span>
          <span className="logo-text">
            <span className="logo-main">songmaker</span>
            <span className="logo-sub">Make music with your voice</span>
          </span>
        </button>
        <nav className="stepper" aria-label="Steps">
          {STEP_NAMES.map((name, i) => (
            <button
              key={name}
              className={`stage${i === stepIdx ? ' current' : ''}${i < stepIdx ? ' done' : ''}`}
              disabled={!canGo(i) || !!busy}
              onClick={() => goTo(i)}
              aria-current={i === stepIdx ? 'step' : undefined}
            >
              <span className="stage-dot">{i + 1}</span>
              <span className="stage-name">{name}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className={`workspace${stepIdx > 0 ? ' with-panel' : ''}`}>
        <main className="main">
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
              {...stepProps}
              busy={!!busy}
              onRecord={recordDrums}
              info={drumInfo}
              hasRaw={!!raw.drums}
              onRaw={() => raw.drums && playRaw(raw.drums.samples)}
              click={click}
              onClick={setClick}
            />
          )}

          {stepIdx === 2 && vibe && template && <ChordsStep vibe={vibe} template={template} chords={chords} onChords={setChords} {...stepProps} />}

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
              {...stepProps}
              busy={!!busy}
              onRecord={recordHum}
              info={humInfo}
              hasRaw={!!raw.hum}
              onRaw={() => raw.hum && playRaw(raw.hum.samples)}
            />
          )}

          {stepIdx === 4 && vibe && <LyricsStep vibe={vibe} notes={notes} lyrics={lyrics} onLyrics={setLyrics} {...stepProps} />}

          {stepIdx === 5 && vibeObj && template && (
            <SongStep
              vibe={vibeObj}
              template={template}
              chords={chords}
              lyrics={lyrics}
              title={songTitle}
              onTitle={setSongTitle}
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
              <button className="btn white lg" disabled={!!busy} onClick={() => goTo(stepIdx - 1)}>
                Back
              </button>
              {stepIdx < STEP_NAMES.length - 1 && (
                <button className="btn violet lg" disabled={!!busy} onClick={() => goTo(stepIdx + 1)}>
                  Next: {STEP_NAMES[stepIdx + 1]}
                  <Icon name={STEP_ICONS[stepIdx + 1]} size={28} />
                </button>
              )}
            </div>
          )}
        </main>

        {stepIdx > 0 && vibeObj && template && (
          <TrackPanel
            vibe={vibeObj}
            template={template}
            drums={drums}
            drumsMine={drumChoice === 'mine' && !!myDrums}
            chords={chords}
            notes={notes}
            melodyMine={tuneChoice === 'mine' && !!myNotes}
            lyrics={lyrics}
            stepIdx={stepIdx}
            playStep={playing || songPlaying ? playStep : -1}
            onGo={goTo}
          />
        )}
      </div>

      <footer className="foot">
        Songmaker, built at StormHacks 2026. Tempo and chord details come from published sources. Example melodies are original.
      </footer>

      <RecordOverlay busy={busy} count={count} step={playStep} />
    </div>
  )
}
