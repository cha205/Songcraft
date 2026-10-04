import { useEffect, useMemo, useState } from 'react'
import { beatboxToHits, hitsToGrid, humToNotes } from './audio/analysis'
import type { Drum, DrumGrid, Note } from './audio/analysis'
import { ALL, play, playRaw, playSong, preload, record, setBpm, setStepListener, setSwing, song, stop } from './audio/engine'
import type { Layers, Recording } from './audio/engine'
import { planSong, writeLyrics } from './ai'
import { Dock } from './components/Dock'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'
import { RecordOverlay } from './components/RecordOverlay'
import { DEFAULT_SECTIONS } from './data/sections'
import type { Section } from './data/sections'
import { EXAMPLE_TUNES, FEELING_INFO, chorusOf, genreById, gridFrom } from './data/genres'
import type { BassId, ChordInstId, ExtraId, Feeling, GenreId, KitId, LeadId } from './data/genres'
import { ArrangeStep } from './steps/ArrangeStep'
import { ChordsStep } from './steps/ChordsStep'
import { DrumsStep } from './steps/DrumsStep'
import type { Lesson } from './steps/DrumsStep'
import { LyricsStep } from './steps/LyricsStep'
import { SongStep } from './steps/SongStep'
import { StartStep } from './steps/StartStep'
import type { Plan } from './steps/StartStep'
import { TuneStep } from './steps/TuneStep'
import './App.css'

const STEP_NAMES = ['Style', 'Drums', 'Chords', 'Melody', 'Arrange', 'Lyrics', 'Song']
const STEP_ICONS: IconName[] = ['sparkle', 'drumkit', 'keys', 'mic', 'timeline', 'notebook', 'vinyl']
const NONE: Layers = { drums: false, chords: false, bass: false, melody: false, extras: false }
// What you hear on each step: drums alone while learning the beat, then the layers stack up.
const LAYERS_BY_STEP: Layers[] = [
  NONE,
  { ...NONE, drums: true },
  { ...NONE, drums: true, chords: true, bass: true },
  { ...NONE, drums: true, chords: true, bass: true, melody: true },
  ALL,
  ALL,
  ALL,
]
const BLANK_LYRICS = ['', '', '', '']

export default function App() {
  const [stepIdx, setStepIdx] = useState(0)
  const [genreId, setGenreId] = useState<GenreId | null>(null)
  const [feeling, setFeeling] = useState<Feeling>('bright')
  const [bpm, setBpmState] = useState(100)
  const [swing, setSwingState] = useState(0)
  const [kit, setKit] = useState<KitId>('acoustic')
  const [lesson, setLesson] = useState<Lesson>({ kick: 'heartbeat', snare: 'backbeat', hat: 'eighth' })
  const [custom, setCustom] = useState<DrumGrid | null>(null)
  const [chorusOn, setChorusOn] = useState(true)
  const [fill, setFill] = useState(false)
  const [part, setPart] = useState<'verse' | 'chorus'>('verse')
  const [chords, setChords] = useState<string[]>(['C', 'G', 'Am', 'F'])
  const [chordInst, setChordInst] = useState<ChordInstId>('pad')
  const [bass, setBass] = useState<BassId>('roots')
  const [myNotes, setMyNotes] = useState<Note[] | null>(null)
  const [tuneChoice, setTuneChoice] = useState<'example' | 'mine'>('example')
  const [lead, setLead] = useState<LeadId>('piano')
  const [extras, setExtras] = useState<ExtraId[]>([])
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS)
  const [lyrics, setLyrics] = useState<string[]>(BLANK_LYRICS)
  const [topic, setTopic] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [lyricBusy, setLyricBusy] = useState(false)
  const [lyricError, setLyricError] = useState('')
  const [lyricTip, setLyricTip] = useState('')
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

  const genre = genreId ? genreById(genreId) : null
  const lessonGrid = useMemo(() => gridFrom(lesson.kick, lesson.snare, lesson.hat), [lesson])
  const verse = custom ?? lessonGrid
  const chorus = useMemo(() => (chorusOn ? chorusOf(verse) : verse), [chorusOn, verse])
  const notes = useMemo(() => (tuneChoice === 'mine' && myNotes ? myNotes : EXAMPLE_TUNES[feeling].notes), [feeling, tuneChoice, myNotes])

  useEffect(() => {
    setStepListener(setPlayStep)
  }, [])
  useEffect(() => {
    Object.assign(song, {
      verse,
      chorus,
      fill,
      part: stepIdx === 1 ? part : 'verse',
      notes,
      chords: stepIdx >= 2 ? chords : null,
      lead,
      chordInst,
      bass,
      kit,
      extras: stepIdx >= 4 ? extras : [],
      layers: LAYERS_BY_STEP[stepIdx],
    })
  }, [verse, chorus, fill, part, notes, chords, lead, chordInst, bass, kit, extras, stepIdx])
  useEffect(() => setBpm(bpm), [bpm])
  useEffect(() => setSwing(swing), [swing])
  useEffect(() => {
    if (genreId) preload({ kit, lead, chordInst, extras })
  }, [genreId, kit, lead, chordInst, extras])

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

  /** Load a style's defaults: tempo, drums, chords and instruments. Clears anything made for the previous style. */
  function applyStyle(id: GenreId, f: Feeling) {
    const g = genreById(id)
    halt()
    setGenreId(id)
    setFeeling(f)
    setBpmState(g.bpm[f])
    setSwingState(g.swing)
    setKit(g.kit[f])
    setLesson(g.drums[f])
    setCustom(null)
    setChords(g.chords[f][0].chords)
    setChordInst(g.chordInst)
    setBass(g.bass)
    setLead(g.lead)
    setExtras(g.extras)
    setSections(DEFAULT_SECTIONS)
    setMyNotes(null)
    setTuneChoice('example')
    setLyrics(BLANK_LYRICS)
    setWavUrl(null)
    setRaw({})
    setDrumInfo('')
    setHumInfo('')
  }

  async function describe(text: string) {
    setAiBusy(true)
    setAiError('')
    setPlan(null)
    try {
      const bp = await planSong(text)
      applyStyle(bp.genre, bp.feeling)
      setBpmState(bp.bpm)
      setKit(bp.kit)
      setLesson({ kick: bp.kick, snare: bp.snare, hat: bp.hat })
      setChords(bp.chords)
      setChordInst(bp.chordInst)
      setBass(bp.bass)
      setLead(bp.lead)
      setExtras(bp.extras)
      setTopic(bp.topic)
      setSongTitle(bp.title)
      setPlan({ title: bp.title, topic: bp.topic, reasons: bp.reasons, model: bp.model })
    } catch (e) {
      setAiError(`${(e as Error).message} You can still pick a style yourself below.`)
    } finally {
      setAiBusy(false)
    }
  }

  async function draftLyrics() {
    if (!genre) return
    setLyricBusy(true)
    setLyricError('')
    try {
      const perBar = [0, 1, 2, 3].map((b) => Math.max(3, notes.filter((n) => n.start >= b * 16 && n.start < b * 16 + 16).length))
      const res = await writeLyrics({ genre: genre.name, feeling, topic, title: songTitle, syllables: perBar })
      setLyrics(res.lines)
      setLyricTip(res.tip)
    } catch (e) {
      setLyricError((e as Error).message)
    } finally {
      setLyricBusy(false)
    }
  }

  async function recordDrums(): Promise<DrumGrid | null> {
    halt()
    setBusy('drums')
    setDrumInfo('')
    try {
      const rec = await record('drums', { click, onCount: setCount })
      setRaw((r) => ({ ...r, drums: rec }))
      const hits = beatboxToHits(rec.samples, rec.sampleRate, bpm, rec.preroll)
      console.table(hits)
      const n = (d: Drum) => hits.filter((h) => h.drum === d).length
      if (!hits.length) {
        setDrumInfo('No sounds detected. Move closer to the microphone and try again.')
        return null
      }
      setDrumInfo(`Songmaker heard ${hits.length} sounds: ${n('kick')} kick, ${n('snare')} snare, and ${n('hat')} hi-hat.`)
      return hitsToGrid(hits)
    } catch (e) {
      setDrumInfo(`Microphone unavailable: ${(e as Error).message}`)
      return null
    } finally {
      setBusy(null)
      setCount('')
    }
  }

  async function recordHum(): Promise<boolean> {
    halt()
    setBusy('hum')
    setHumInfo('')
    try {
      const rec = await record('hum', { click, onCount: setCount })
      setRaw((r) => ({ ...r, hum: rec }))
      const res = humToNotes(rec.samples, rec.sampleRate, bpm, rec.preroll)
      if (!res.notes.length) {
        setHumInfo('No melody detected. Try singing "doo" instead of humming with your mouth closed.')
        return false
      }
      setMyNotes(res.notes)
      setTuneChoice('mine')
      setHumInfo(
        `Songmaker found ${res.notes.length} notes. ` +
          (res.shift ? `You sang in roughly ${res.hummedKey} major, so it moved the melody to C to match your chords.` : 'Your melody already matches the chords.'),
      )
      await startPlay()
      return true
    } catch (e) {
      setHumInfo(`Microphone unavailable: ${(e as Error).message}`)
      return false
    } finally {
      setBusy(null)
      setCount('')
    }
  }

  async function playWholeSong() {
    halt()
    setSongPlaying(true)
    const wav = await playSong(
      sections.map((s) => ({ kind: s.kind, layers: s.layers })),
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
    setGenreId(null)
    setPlan(null)
    setWavUrl(null)
    setSongTitle('')
    setTopic('')
    setStepIdx(0)
  }

  const canGo = (i: number) => i === 0 || !!genre
  const stepProps = { step: playStep, playing, onPlay: startPlay, onStop: halt }
  const next = () => goTo(stepIdx + 1)
  const parts = [1, 2, 3, 4, 5, 6].map((s) => ({
    name: STEP_NAMES[s],
    icon: STEP_ICONS[s],
    state: (stepIdx > s ? 'done' : stepIdx === s ? 'current' : 'next') as 'done' | 'current' | 'next',
  }))

  return (
    <div className={`app g-${genreId ?? 'none'} f-${feeling}${stepIdx > 0 ? ' has-dock' : ''}`}>
      <div className="bg" aria-hidden />

      <header className="topbar">
        <button className="logo" onClick={() => goTo(0)} disabled={!!busy}>
          <Icon name="vinyl" size={42} className={playing || songPlaying ? 'spin' : ''} />
          <span className="logo-text">
            Song<span>maker</span>
          </span>
        </button>
        {genre && stepIdx > 0 && (
          <nav className="journey-nav" aria-label="Steps">
            {STEP_NAMES.map((name, i) => (
              <button
                key={name}
                className={`jn${i === stepIdx ? ' current' : ''}${i < stepIdx ? ' done' : ''}`}
                disabled={!canGo(i) || !!busy}
                onClick={() => goTo(i)}
                aria-current={i === stepIdx ? 'step' : undefined}
              >
                <Icon name={STEP_ICONS[i]} size={30} />
                <span>{name}</span>
              </button>
            ))}
          </nav>
        )}
        {genre && stepIdx > 0 && (
          <span className="now-chip">
            <Icon name={genre.icon} size={30} /> {FEELING_INFO[feeling].name} {genre.name} · {bpm} BPM
          </span>
        )}
      </header>

      <main className="page">
        {stepIdx === 0 && (
          <StartStep
            genre={genreId}
            feeling={feeling}
            onGenre={(g) => applyStyle(g, feeling)}
            onFeeling={(f) => (genreId ? applyStyle(genreId, f) : setFeeling(f))}
            onStart={() => goTo(1)}
            onDescribe={describe}
            aiBusy={aiBusy}
            aiError={aiError}
            plan={plan}
          />
        )}

        {stepIdx === 1 && genre && (
          <DrumsStep
            genre={genre}
            feeling={feeling}
            bpm={bpm}
            onBpm={setBpmState}
            swing={swing}
            onSwing={setSwingState}
            kit={kit}
            onKit={setKit}
            lesson={lesson}
            onLesson={(l) => {
              setLesson(l)
              setCustom(null)
            }}
            beat={verse}
            onCustom={setCustom}
            chorusOn={chorusOn}
            onChorusOn={setChorusOn}
            fill={fill}
            onFill={setFill}
            part={part}
            onPart={setPart}
            {...stepProps}
            busy={!!busy}
            onRecord={recordDrums}
            info={drumInfo}
            hasRaw={!!raw.drums}
            onRaw={() => raw.drums && playRaw(raw.drums.samples)}
            click={click}
            onClick={setClick}
            onDone={next}
          />
        )}

        {stepIdx === 2 && genre && (
          <ChordsStep
            genre={genre}
            feeling={feeling}
            chords={chords}
            onChords={setChords}
            chordInst={chordInst}
            onChordInst={setChordInst}
            bass={bass}
            onBass={setBass}
            {...stepProps}
            onDone={next}
          />
        )}

        {stepIdx === 3 && genre && (
          <TuneStep
            feeling={feeling}
            notes={notes}
            example={EXAMPLE_TUNES[feeling].notes}
            myNotes={myNotes}
            onEdit={(n) => {
              setMyNotes(n)
              setTuneChoice('mine')
            }}
            onChoice={setTuneChoice}
            instrument={lead}
            onInstrument={setLead}
            {...stepProps}
            busy={!!busy}
            onRecord={recordHum}
            info={humInfo}
            hasRaw={!!raw.hum}
            onRaw={() => raw.hum && playRaw(raw.hum.samples)}
            onDone={next}
          />
        )}

        {stepIdx === 4 && genre && (
          <ArrangeStep
            extras={extras}
            onExtras={setExtras}
            sections={sections}
            onSections={setSections}
            current={songPlaying ? section : -1}
            songPlaying={songPlaying}
            playing={playing || songPlaying}
            onPlay={startPlay}
            onPlaySong={playWholeSong}
            onStop={halt}
            onDone={next}
          />
        )}

        {stepIdx === 5 && genre && (
          <LyricsStep
            feeling={feeling}
            notes={notes}
            lyrics={lyrics}
            onLyrics={setLyrics}
            topic={topic}
            onTopic={setTopic}
            onWrite={draftLyrics}
            aiBusy={lyricBusy}
            aiError={lyricError}
            aiTip={lyricTip}
            {...stepProps}
            onDone={next}
          />
        )}

        {stepIdx === 6 && genre && (
          <SongStep
            genre={genre}
            feeling={feeling}
            bpm={bpm}
            chords={chords}
            lead={lead}
            extras={extras}
            lyrics={lyrics}
            sections={sections}
            title={songTitle}
            onTitle={setSongTitle}
            section={section}
            step={songPlaying ? playStep : -1}
            songPlaying={songPlaying}
            onPlaySong={playWholeSong}
            onStop={halt}
            wavUrl={wavUrl}
            usedMine={{ beat: !!custom, tune: tuneChoice === 'mine' && !!myNotes }}
            onRestart={restart}
          />
        )}
      </main>

      {stepIdx > 0 && (
        <Dock
          parts={parts}
          nextLabel={stepIdx < 6 ? `Next: ${STEP_NAMES[stepIdx + 1]}` : null}
          onBack={() => goTo(stepIdx - 1)}
          onNext={next}
          disabled={!!busy}
        />
      )}

      <RecordOverlay busy={busy} count={count} step={playStep} />
    </div>
  )
}

