import { useEffect, useMemo, useState } from 'react'
import { beatboxToHits, hitsToGrid, humToNotes } from './audio/analysis'
import type { Drum, DrumGrid, Note } from './audio/analysis'
import { countWords } from './audio/compare'
import { ALL, play, playRaw, playSong, preload, record, setBpm, setStepListener, setSwing, song, stop } from './audio/engine'
import type { Layers, Recording } from './audio/engine'
import { coachTake, planSong, writeLyrics } from './ai'
import type { Blueprint, Coaching } from './ai'
import { Dock } from './components/Dock'
import { HowItWorks } from './components/HowItWorks'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'
import { PartBar } from './components/PartBar'
import { RecordOverlay } from './components/RecordOverlay'
import { sectionsFor } from './data/sections'
import type { PartId, Section, SongLength } from './data/sections'
import { EXAMPLE_CHORUS, EXAMPLE_TUNES, FEELING_INFO, HATS, KICKS, SNARES, chorusLesson, genreById, gridFrom, option } from './data/genres'
import type { BassId, ChordInstId, ExtraId, Feeling, GenreId, KitId, LeadId } from './data/genres'
import { ArrangeStep } from './steps/ArrangeStep'
import { ChordsStep } from './steps/ChordsStep'
import { DrumsStep } from './steps/DrumsStep'
import type { Lesson } from './steps/DrumsStep'
import { LyricsStep } from './steps/LyricsStep'
import { SongStep } from './steps/SongStep'
import { StartStep } from './steps/StartStep'
import { TuneStep } from './steps/TuneStep'
import './App.css'

const STEP_NAMES = ['Style', 'Drums', 'Chords', 'Melody', 'Lyrics', 'Arrange', 'Song']
const STEP_ICONS: IconName[] = ['sparkle', 'drumkit', 'keys', 'mic', 'notebook', 'timeline', 'vinyl']
const NONE: Layers = { drums: false, chords: false, bass: false, melody: false, extras: false }
// What you hear on each step: drums alone while learning the beat, then the layers stack up.
const LAYERS_BY_STEP: Layers[] = [
  NONE,
  { ...NONE, drums: true },
  { ...NONE, drums: true, chords: true, bass: true },
  { ...NONE, drums: true, chords: true, bass: true, melody: true },
  { ...NONE, drums: true, chords: true, bass: true, melody: true },
  ALL,
  ALL,
]
const BLANK_LYRICS = ['', '', '', '']

/** Everything that belongs to one core loop. The verse and the chorus each have their own. */
type Part = { lesson: Lesson; custom: DrumGrid | null; chords: string[]; myNotes: Note[] | null; tuneChoice: 'example' | 'mine'; lyrics: string[] }
const emptyPart = (lesson: Lesson, chords: string[]): Part => ({ lesson, custom: null, chords, myNotes: null, tuneChoice: 'example', lyrics: BLANK_LYRICS })

export default function App() {
  const [stepIdx, setStepIdx] = useState(0)
  const [genreId, setGenreId] = useState<GenreId | null>(null)
  const [feeling, setFeeling] = useState<Feeling>('bright')
  const [length, setLength] = useState<SongLength>('full')
  const [bpm, setBpmState] = useState(100)
  const [swing, setSwingState] = useState(0)
  const [kit, setKit] = useState<KitId>('acoustic')
  const [parts, setParts] = useState<Record<PartId, Part>>({
    verse: emptyPart({ kick: 'heartbeat', snare: 'backbeat', hat: 'eighth' }, ['C', 'G', 'Am', 'F']),
    chorus: emptyPart({ kick: 'heartbeat', snare: 'backbeat', hat: 'sixteenth' }, ['F', 'G', 'C', 'Am']),
  })
  const [editing, setEditing] = useState<PartId>('verse')
  const [chorusStarted, setChorusStarted] = useState(false)
  const [fill, setFill] = useState(false)
  const [chordInst, setChordInst] = useState<ChordInstId>('pad')
  const [bass, setBass] = useState<BassId>('roots')
  const [lead, setLead] = useState<LeadId>('piano')
  const [extras, setExtras] = useState<ExtraId[]>([])
  // null = use the default sections for the chosen length; set once the user edits the arrangement.
  const [customSections, setCustomSections] = useState<Section[] | null>(null)
  const [topic, setTopic] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [plans, setPlans] = useState<Blueprint[] | null>(null)
  const [planModel, setPlanModel] = useState('')
  const [planPick, setPlanPick] = useState(-1)
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
  const [howOpen, setHowOpen] = useState(false)

  const genre = genreId ? genreById(genreId) : null
  const sections = customSections ?? sectionsFor(length, bpm)
  const cur = parts[editing]
  const updatePart = (patch: Partial<Part>, id: PartId = editing) => setParts((ps) => ({ ...ps, [id]: { ...ps[id], ...patch } }))
  const gridOf = (p: Part) => p.custom ?? gridFrom(p.lesson.kick, p.lesson.snare, p.lesson.hat)
  const verseGrid = useMemo(() => gridOf(parts.verse), [parts.verse])
  const chorusGrid = useMemo(() => gridOf(parts.chorus), [parts.chorus])
  const verseNotes = useMemo(() => (parts.verse.tuneChoice === 'mine' && parts.verse.myNotes ? parts.verse.myNotes : EXAMPLE_TUNES[feeling].notes), [parts.verse, feeling])
  const chorusNotes = useMemo(() => (parts.chorus.tuneChoice === 'mine' && parts.chorus.myNotes ? parts.chorus.myNotes : EXAMPLE_CHORUS[feeling].notes), [parts.chorus, feeling])
  const curGrid = editing === 'chorus' ? chorusGrid : verseGrid
  const curNotes = editing === 'chorus' ? chorusNotes : verseNotes
  const example = editing === 'chorus' ? EXAMPLE_CHORUS[feeling] : EXAMPLE_TUNES[feeling]

  useEffect(() => {
    setStepListener(setPlayStep)
  }, [])
  useEffect(() => {
    Object.assign(song, {
      verse: verseGrid,
      chorus: chorusGrid,
      verseNotes,
      chorusNotes,
      verseChords: stepIdx >= 2 ? parts.verse.chords : null,
      chorusChords: stepIdx >= 2 ? parts.chorus.chords : null,
      part: editing,
      fill,
      lead,
      chordInst,
      bass,
      kit,
      extras: stepIdx >= 5 ? extras : [],
      layers: LAYERS_BY_STEP[stepIdx],
    })
  }, [verseGrid, chorusGrid, verseNotes, chorusNotes, parts, editing, fill, lead, chordInst, bass, kit, extras, stepIdx])
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

  /** Load a style's defaults for both core loops. Clears anything made for the previous style. */
  function applyStyle(id: GenreId, f: Feeling) {
    const g = genreById(id)
    halt()
    setGenreId(id)
    setFeeling(f)
    setBpmState(g.bpm[f])
    setSwingState(g.swing)
    setKit(g.kit[f])
    const sets = g.chords[f]
    setParts({ verse: emptyPart(g.drums[f], sets[0].chords), chorus: emptyPart(chorusLesson(g.drums[f]), (sets[1] ?? sets[0]).chords) })
    setEditing(length === 'chorus' ? 'chorus' : 'verse')
    setChorusStarted(length === 'chorus')
    setChordInst(g.chordInst)
    setBass(g.bass)
    setLead(g.lead)
    setExtras(g.extras)
    setCustomSections(null)
    setWavUrl(null)
    setRaw({})
    setDrumInfo('')
    setHumInfo('')
    setLyricTip('')
  }

  function chooseLength(l: SongLength) {
    setLength(l)
    setEditing(l === 'chorus' ? 'chorus' : 'verse')
    setChorusStarted(l === 'chorus')
    setCustomSections(null)
  }

  function applyPlan(i: number) {
    const bp = plans?.[i]
    if (!bp) return
    applyStyle(bp.genre, bp.feeling)
    setPlanPick(i)
    setBpmState(bp.bpm)
    setKit(bp.kit)
    const sets = genreById(bp.genre).chords[bp.feeling]
    const lesson = { kick: bp.kick, snare: bp.snare, hat: bp.hat }
    const chorusChords = sets.find((s) => s.chords.join() !== bp.chords.join())?.chords ?? sets[0].chords
    setParts({ verse: emptyPart(lesson, bp.chords), chorus: emptyPart(chorusLesson(lesson), chorusChords) })
    setChordInst(bp.chordInst)
    setBass(bp.bass)
    setLead(bp.lead)
    setExtras(bp.extras)
    setTopic(bp.topic)
    setSongTitle(bp.title)
  }

  async function describe(text: string) {
    setAiBusy(true)
    setAiError('')
    setPlans(null)
    setPlanPick(-1)
    try {
      const res = await planSong(text)
      setPlans(res.plans)
      setPlanModel(res.model)
    } catch (e) {
      setAiError(`${(e as Error).message} You can still pick a style yourself below.`)
    } finally {
      setAiBusy(false)
    }
  }

  /** Move from the finished verse to the chorus. The chorus starts from the verse's beat, made busier. */
  function startChorus() {
    if (!chorusStarted) {
      updatePart({ lesson: chorusLesson(parts.verse.lesson), custom: null }, 'chorus')
      setChorusStarted(true)
    }
    setEditing('chorus')
    goTo(1)
  }

  async function draftLyrics() {
    if (!genre) return
    setLyricBusy(true)
    setLyricError('')
    try {
      const perBar = [0, 1, 2, 3].map((b) => Math.max(3, curNotes.filter((n) => n.start >= b * 16 && n.start < b * 16 + 16).length))
      const res = await writeLyrics({ genre: genre.name, feeling, topic, title: songTitle, syllables: perBar, part: editing })
      updatePart({ lyrics: res.lines })
      setLyricTip(res.tip)
    } catch (e) {
      setLyricError((e as Error).message)
    } finally {
      setLyricBusy(false)
    }
  }

  async function coach(kind: 'beat' | 'melody'): Promise<Coaching> {
    const rec = kind === 'beat' ? raw.drums : raw.hum
    if (!rec || !genre) throw new Error('Record a take first.')
    const l = cur.lesson
    const target = `kick on ${countWords(option(KICKS, l.kick).steps)}; snare on ${countWords(option(SNARES, l.snare).steps)}; hi-hat on ${countWords(option(HATS, l.hat).steps)}`
    return coachTake({ kind, samples: rec.samples, sampleRate: rec.sampleRate, bpm, genre: genre.name, feeling, target })
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
      updatePart({ myNotes: res.notes, tuneChoice: 'mine' })
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
    setPlans(null)
    setPlanPick(-1)
    setWavUrl(null)
    setSongTitle('')
    setTopic('')
    setStepIdx(0)
  }

  const canGo = (i: number) => i === 0 || !!genre
  const stepProps = { step: playStep, playing, onPlay: startPlay, onStop: halt }
  // After the verse's lyrics, a full song loops back to build the chorus before arranging.
  const verseThenChorus = length === 'full' && editing === 'verse'
  const next = () => (stepIdx === 4 && verseThenChorus ? startChorus() : goTo(stepIdx + 1))
  const nextLabel = stepIdx >= 6 ? null : stepIdx === 4 && verseThenChorus ? 'Next: make the chorus' : `Next: ${STEP_NAMES[stepIdx + 1]}`
  const partLabel = editing === 'chorus' ? 'chorus' : 'verse'
  const dockParts = [1, 2, 3, 4, 5, 6].map((s) => ({
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
        <button className="how-btn" onClick={() => setHowOpen(true)}>
          <Icon name="learn" size={28} /> How it works
        </button>
      </header>

      <main className="page">
        {stepIdx >= 1 && stepIdx <= 4 && genre && (
          <PartBar
            style={`${FEELING_INFO[feeling].name} ${genre.name} · ${bpm} BPM`}
            length={length}
            editing={editing}
            chorusReady={chorusStarted}
            onPick={(p) => {
              halt()
              setEditing(p)
            }}
          />
        )}

        {stepIdx === 0 && (
          <StartStep
            genre={genreId}
            feeling={feeling}
            length={length}
            onGenre={(g) => {
              applyStyle(g, feeling)
              setPlanPick(-1)
            }}
            onFeeling={(f) => (genreId ? applyStyle(genreId, f) : setFeeling(f))}
            onLength={chooseLength}
            onStart={() => goTo(1)}
            onDescribe={describe}
            aiBusy={aiBusy}
            aiError={aiError}
            plans={plans}
            planModel={planModel}
            planPick={planPick}
            onPickPlan={applyPlan}
          />
        )}

        {stepIdx === 1 && genre && (
          <DrumsStep
            key={editing}
            part={partLabel}
            genre={genre}
            feeling={feeling}
            bpm={bpm}
            onBpm={setBpmState}
            swing={swing}
            onSwing={setSwingState}
            kit={kit}
            onKit={setKit}
            lesson={cur.lesson}
            onLesson={(l) => updatePart({ lesson: l, custom: null })}
            beat={curGrid}
            onCustom={(g) => updatePart({ custom: g })}
            fill={fill}
            onFill={setFill}
            {...stepProps}
            busy={!!busy}
            onRecord={recordDrums}
            onCoach={() => coach('beat')}
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
            key={editing}
            part={partLabel}
            genre={genre}
            feeling={feeling}
            chords={cur.chords}
            onChords={(c) => updatePart({ chords: c })}
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
            key={editing}
            part={partLabel}
            notes={curNotes}
            example={example.notes}
            exampleTip={example.tip}
            myNotes={cur.myNotes}
            onEdit={(n) => updatePart({ myNotes: n, tuneChoice: 'mine' })}
            onChoice={(c) => updatePart({ tuneChoice: c })}
            instrument={lead}
            onInstrument={setLead}
            {...stepProps}
            busy={!!busy}
            onRecord={recordHum}
            onCoach={() => coach('melody')}
            info={humInfo}
            hasRaw={!!raw.hum}
            onRaw={() => raw.hum && playRaw(raw.hum.samples)}
            onDone={next}
          />
        )}

        {stepIdx === 4 && genre && (
          <LyricsStep
            key={editing}
            part={partLabel}
            feeling={feeling}
            notes={curNotes}
            lyrics={cur.lyrics}
            onLyrics={(l) => updatePart({ lyrics: l })}
            topic={topic}
            onTopic={setTopic}
            onWrite={draftLyrics}
            aiBusy={lyricBusy}
            aiError={lyricError}
            aiTip={lyricTip}
            {...stepProps}
            doneLabel={verseThenChorus ? 'Next: make the chorus' : 'Finish this part'}
            onDone={next}
          />
        )}

        {stepIdx === 5 && genre && (
          <ArrangeStep
            extras={extras}
            onExtras={setExtras}
            sections={sections}
            onSections={setCustomSections}
            current={songPlaying ? section : -1}
            songPlaying={songPlaying}
            playing={playing || songPlaying}
            onPlay={startPlay}
            onPlaySong={playWholeSong}
            onStop={halt}
            onDone={next}
          />
        )}

        {stepIdx === 6 && genre && (
          <SongStep
            genre={genre}
            feeling={feeling}
            bpm={bpm}
            length={length}
            verseChords={parts.verse.chords}
            chorusChords={parts.chorus.chords}
            lead={lead}
            extras={extras}
            lyrics={{ verse: parts.verse.lyrics, chorus: parts.chorus.lyrics }}
            sections={sections}
            title={songTitle}
            onTitle={setSongTitle}
            section={section}
            step={songPlaying ? playStep : -1}
            songPlaying={songPlaying}
            onPlaySong={playWholeSong}
            onStop={halt}
            wavUrl={wavUrl}
            onRestart={restart}
          />
        )}
      </main>

      {stepIdx > 0 && <Dock parts={dockParts} nextLabel={nextLabel} onBack={() => goTo(stepIdx - 1)} onNext={next} disabled={!!busy} />}

      {howOpen && <HowItWorks onClose={() => setHowOpen(false)} />}
      <RecordOverlay busy={busy} count={count} step={playStep} />
    </div>
  )
}
