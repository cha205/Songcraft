import { useEffect, useMemo, useRef, useState } from 'react'
import { beatboxToHits, hitsToGrid, humToNotes } from './audio/analysis'
import type { Drum, DrumGrid, Note } from './audio/analysis'
import { countWords } from './audio/compare'
import { ALL, duck, play, playRaw, playSong, preload, record, setBpm, setStepListener, setSwing, song, startListening, stop } from './audio/engine'
import type { Layers, Listening, Recording } from './audio/engine'
import { askProducer, coachTake, makeCover, planSong, writeLyrics } from './ai'
import type { Blueprint, Coaching, ProducerChanges, ProducerReply } from './ai'
import { Dock } from './components/Dock'
import { HowItWorks } from './components/HowItWorks'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'
import { PartBar } from './components/PartBar'
import { Producer } from './components/Producer'
import type { ProducerMsg } from './components/Producer'
import { RecordOverlay } from './components/RecordOverlay'
import { ShareCard } from './components/ShareCard'
import { decodeSong, encodeSong } from './data/share'
import type { SharedPart } from './data/share'
import { sectionsFor } from './data/sections'
import type { PartId, Section, SongLength } from './data/sections'
import { BASSES, CHORD_INSTS, EXAMPLE_CHORUS, EXAMPLE_TUNES, EXTRAS, FEELING_INFO, HATS, KICKS, KITS, LEADS, SNARES, chorusLesson, genreById, gridFrom, option } from './data/genres'
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

/** The song settings the producer can change, saved before each change so it can be undone. */
type Snapshot = {
  genreId: GenreId | null
  feeling: Feeling
  bpm: number
  swing: number
  kit: KitId
  parts: Record<PartId, Part>
  fill: boolean
  chordInst: ChordInstId
  bass: BassId
  lead: LeadId
  extras: ExtraId[]
  topic: string
}
const nameOf = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? id
// Which layer each producer change is heard in, so a change made before that layer plays can say where to hear it.
const LAYER_OF: Partial<Record<keyof ProducerChanges, keyof Layers>> = { chords: 'chords', feeling: 'chords', genre: 'chords', chordInst: 'chords', bass: 'bass', lead: 'melody', extras: 'extras' }
const FIRST_STEP_WITH: Record<keyof Layers, number> = { drums: 1, chords: 2, bass: 2, melody: 3, extras: 5, double: 5 }
const SUGGESTIONS: string[][] = [
  [],
  ['Make the beat busier', 'Slow it down a little', 'Why is the snare on 2 and 4?'],
  ['Make it sadder', 'Play the chords on guitar', 'What makes a chord sound sad?'],
  ['Play my melody on flute', 'Give it more energy', 'How do I make a catchy melody?'],
  ['Make the song about my dog', 'What should a chorus say?', 'Make it happier'],
  ['Add strings and a soft pad', 'Turn it into a rap song', 'What does an intro do?'],
  ['Make the chorus hit harder', 'What should I try next?', 'Give it more swing'],
]

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
  const [prodOpen, setProdOpen] = useState(false)
  const [prodBusy, setProdBusy] = useState<'listening' | 'thinking' | null>(null)
  const [msgs, setMsgs] = useState<ProducerMsg[]>([])
  const [speak, setSpeak] = useState(true)
  const [cover, setCover] = useState<{ key: string; image: string; model: string } | null>(null)
  const [coverBusy, setCoverBusy] = useState(false)
  const mic = useRef<Listening | null>(null)
  const micTimer = useRef(0)
  const undos = useRef(new Map<number, Snapshot>())
  const msgId = useRef(0)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharedView, setSharedView] = useState(false)

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
  // Opened from a shared link: rebuild the song from the link and go straight to the player.
  useEffect(() => {
    const code = location.hash.startsWith('#song=') ? location.hash.slice(6) : ''
    if (!code) return
    decodeSong(code)
      .then((s) => {
        const part = (p: SharedPart, kind: PartId): Part => ({
          lesson: kind === 'verse' ? { kick: 'heartbeat', snare: 'backbeat', hat: 'eighth' } : { kick: 'heartbeat', snare: 'backbeat', hat: 'sixteenth' },
          custom: p.grid,
          chords: p.chords.length === 4 ? p.chords : ['C', 'G', 'Am', 'F'],
          myNotes: p.notes,
          tuneChoice: 'mine',
          lyrics: p.lyrics,
        })
        setGenreId(s.genre)
        setFeeling(s.feeling)
        setLength(s.length)
        setBpmState(s.bpm)
        setSwingState(s.swing)
        setKit(s.kit)
        setFill(s.fill)
        setChordInst(s.chordInst)
        setBass(s.bass)
        setLead(s.lead)
        setExtras(s.extras)
        setSongTitle(s.title)
        setTopic(s.topic)
        setParts({ verse: part(s.parts.verse, 'verse'), chorus: part(s.parts.chorus, 'chorus') })
        setChorusStarted(true)
        setEditing(s.length === 'chorus' ? 'chorus' : 'verse')
        const base = sectionsFor(s.length, s.bpm)
        setCustomSections(s.sections && s.sections.length === base.length ? base.map((sec, i) => ({ ...sec, layers: s.sections![i] })) : null)
        setSharedView(true)
        setStepIdx(6)
      })
      .catch(() => history.replaceState(null, '', location.pathname))
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
    if (i === 6 && cover?.key !== coverKey) void paintCover()
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

  async function draftLyrics(topicNow = topic) {
    if (!genre) return
    setLyricBusy(true)
    setLyricError('')
    try {
      const perBar = [0, 1, 2, 3].map((b) => Math.max(3, curNotes.filter((n) => n.start >= b * 16 && n.start < b * 16 + 16).length))
      const res = await writeLyrics({ genre: genre.name, feeling, topic: topicNow, title: songTitle, syllables: perBar, part: editing })
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

  // ---------------------------------------------------------------- album cover painted by Gemini
  const coverKey = `${songTitle}|${genreId}|${feeling}|${topic}|${parts.verse.lyrics.join()}|${parts.chorus.lyrics.join()}`
  async function paintCover() {
    if (!genre || coverBusy) return
    const key = coverKey
    setCoverBusy(true)
    try {
      const lyrics = [...(length !== 'chorus' ? parts.verse.lyrics : []), ...(length !== 'verse' ? parts.chorus.lyrics : [])]
      const res = await makeCover({ title: songTitle, genre: genre.name, feeling, topic, lyrics })
      setCover({ key, image: res.image, model: res.model })
    } catch {
      // The genre artwork stays as the cover.
    } finally {
      setCoverBusy(false)
    }
  }

  // ---------------------------------------------------------------- the producer you talk to
  const snapshot = (): Snapshot => ({ genreId, feeling, bpm, swing, kit, parts, fill, chordInst, bass, lead, extras, topic })
  function restore(s: Snapshot) {
    setGenreId(s.genreId)
    setFeeling(s.feeling)
    setBpmState(s.bpm)
    setSwingState(s.swing)
    setKit(s.kit)
    setParts(s.parts)
    setFill(s.fill)
    setChordInst(s.chordInst)
    setBass(s.bass)
    setLead(s.lead)
    setExtras(s.extras)
    setTopic(s.topic)
  }
  const producerState = () => {
    const part = (p: Part) => ({ ...p.lesson, ownBeat: !!p.custom, chords: p.chords, ownMelody: p.tuneChoice === 'mine', lyrics: p.lyrics.filter(Boolean) })
    return { genre: genreId, feeling, bpm, swing, kit, fill, songLength: length, workingOn: editing, verse: part(parts.verse), chorus: part(parts.chorus), chordInst, bass, lead, extras, topic, title: songTitle }
  }

  /** Apply the producer's changes to the song and return a plain list of what changed. */
  function applyProducer(r: ProducerReply): string[] {
    const c = r.changes
    const done: string[] = []
    const f = c.feeling ?? feeling
    const gid = c.genre ?? genreId ?? 'pop'
    const g = genreById(gid)
    const newGenre = gid !== genreId
    const next = { verse: { ...parts.verse }, chorus: { ...parts.chorus } }
    // A new style or feeling brings its own chords (and a new style its drums), unless Gemini chose them.
    if (newGenre || f !== feeling) {
      const sets = g.chords[f]
      next.verse.chords = sets[0].chords
      next.chorus.chords = (sets[1] ?? sets[0]).chords
    }
    if (newGenre) {
      next.verse = { ...next.verse, lesson: g.drums[f], custom: null }
      next.chorus = { ...next.chorus, lesson: chorusLesson(g.drums[f]), custom: null }
      setGenreId(gid)
      done.push(`Style: ${g.name}`)
    }
    if (f !== feeling) {
      setFeeling(f)
      done.push(`Feeling: ${FEELING_INFO[f].name}`)
    }
    const targets: PartId[] = r.part === 'both' ? ['verse', 'chorus'] : [r.part || editing]
    for (const id of targets) {
      const p = next[id]
      if (c.kick || c.snare || c.hat) {
        next[id] = { ...p, lesson: { kick: c.kick ?? p.lesson.kick, snare: c.snare ?? p.lesson.snare, hat: c.hat ?? p.lesson.hat }, custom: null }
        const which = targets.length > 1 ? '' : ` (${id})`
        if (c.kick) done.push(`Kick${which}: ${option(KICKS, c.kick).name}`)
        if (c.snare) done.push(`Snare${which}: ${option(SNARES, c.snare).name}`)
        if (c.hat) done.push(`Hi-hat${which}: ${option(HATS, c.hat).name}`)
      }
      if (c.chords) {
        next[id] = { ...next[id], chords: c.chords }
        done.push(`Chords (${id}): ${c.chords.join(' ')}`)
      }
    }
    setParts(next)
    const bpmNow = c.bpm ?? (newGenre ? g.bpm[f] : bpm)
    if (bpmNow !== bpm) {
      setBpmState(bpmNow)
      done.push(`Tempo: ${bpm} to ${bpmNow} BPM`)
    }
    const swingNow = c.swing ?? (newGenre ? g.swing : swing)
    if (swingNow !== swing) {
      setSwingState(swingNow)
      done.push(`Swing: ${swingNow < 0.05 ? 'straight' : swingNow < 0.25 ? 'a little' : 'lots'}`)
    }
    const set = <T extends string>(now: T, want: T | undefined, fallback: T, apply: (v: T) => void, label: string, list: { id: string; name: string }[]) => {
      const v = want ?? (newGenre ? fallback : now)
      if (v !== now) {
        apply(v)
        done.push(`${label}: ${nameOf(list, v)}`)
      }
    }
    set(kit, c.kit, g.kit[f], setKit, 'Drum kit', KITS)
    set(chordInst, c.chordInst, g.chordInst, setChordInst, 'Chords played on', CHORD_INSTS)
    set(bass, c.bass, g.bass, setBass, 'Bass', BASSES)
    set(lead, c.lead, g.lead, setLead, 'Melody played on', LEADS)
    if (c.extras && c.extras.join() !== extras.join()) {
      setExtras(c.extras)
      done.push(c.extras.length ? `Added instruments: ${c.extras.map((e) => nameOf(EXTRAS, e)).join(', ')}` : 'Added instruments: none')
    }
    if (c.fill !== undefined && c.fill !== fill) {
      setFill(c.fill)
      done.push(`Drum fill: ${c.fill ? 'on' : 'off'}`)
    }
    if (c.topic && c.topic !== topic) {
      setTopic(c.topic)
      done.push(`Lyrics about: ${c.topic}`)
    }
    return done
  }

  function say(text: string) {
    if (!speak || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voices = synth.getVoices().filter((v) => v.lang.startsWith('en'))
    u.voice = voices.find((v) => /natural|google us english|samantha|aria|jenny/i.test(v.name)) ?? voices[0] ?? null
    u.rate = 1.04
    u.onstart = () => duck(true)
    u.onend = u.onerror = () => duck(false)
    synth.speak(u)
  }

  async function talkToProducer(input: { text?: string; rec?: { samples: Float32Array; sampleRate: number } }) {
    const youId = ++msgId.current
    setMsgs((m) => [...m, { id: youId, from: 'you', text: input.text ?? 'Sending your voice to Gemini' }])
    setProdBusy('thinking')
    try {
      const r = await askProducer({ text: input.text, samples: input.rec?.samples, sampleRate: input.rec?.sampleRate, state: producerState(), step: STEP_NAMES[stepIdx] })
      if (input.rec) setMsgs((m) => m.map((x) => (x.id === youId ? { ...x, text: r.heard ? `"${r.heard}"` : 'Gemini could not make that out.' } : x)))
      const before = snapshot()
      const changes = applyProducer(r)
      const id = ++msgId.current
      const layers = LAYERS_BY_STEP[stepIdx]
      const later = (Object.keys(r.changes) as (keyof ProducerChanges)[])
        .map((k) => LAYER_OF[k])
        .filter((l): l is keyof Layers => !!l && !layers[l])
        .map((l) => FIRST_STEP_WITH[l])
      const hint = changes.length && later.length && !r.goTo ? `You will hear this from the ${STEP_NAMES[Math.min(...later)]} step.` : undefined
      if (changes.length) undos.current = new Map([[id, before]])
      // Only the latest change can be undone, so older Undo buttons go away.
      setMsgs((m) => [...m.map((x) => (x.undo === 'ready' ? { ...x, undo: undefined } : x)), { id, from: 'gemini', text: r.reply, changes, hint, undo: changes.length ? 'ready' : undefined }])
      say(r.reply)
      const target = r.goTo ? STEP_NAMES.indexOf(r.goTo) : -1
      if (target > 0 && target !== stepIdx) goTo(target)
      else if (changes.length && stepIdx >= 1 && stepIdx <= 5 && !playing && !songPlaying) void startPlay()
      if (r.changes.topic && stepIdx === 4) void draftLyrics(r.changes.topic)
    } catch (e) {
      setMsgs((m) => [...m, { id: ++msgId.current, from: 'gemini', text: (e as Error).message, error: true }])
    } finally {
      setProdBusy(null)
    }
  }

  async function onMic() {
    const live = mic.current
    if (live) {
      mic.current = null
      clearTimeout(micTimer.current)
      const rec = await live.stop()
      setProdBusy(null)
      if (rec.samples.length < rec.sampleRate * 0.5) {
        setMsgs((m) => [...m, { id: ++msgId.current, from: 'gemini', text: 'That was very short. Tap the mic, say what you want, then tap it again.', error: true }])
        return
      }
      await talkToProducer({ rec })
      return
    }
    try {
      window.speechSynthesis?.cancel()
      mic.current = await startListening()
      setProdBusy('listening')
      micTimer.current = window.setTimeout(onMic, 12000)
    } catch (e) {
      setMsgs((m) => [...m, { id: ++msgId.current, from: 'gemini', text: `I cannot hear you (${(e as Error).message}). You can type instead.`, error: true }])
    }
  }

  function undoProducer(id: number) {
    const s = undos.current.get(id)
    if (!s) return
    restore(s)
    undos.current.delete(id)
    setMsgs((m) => m.map((x) => (x.id === id ? { ...x, undo: 'done' } : x)))
  }

  async function openShare() {
    if (!genreId) return
    const shared = (p: Part, notes: typeof verseNotes, grid: typeof verseGrid): SharedPart => ({ grid, notes, chords: p.chords, lyrics: p.lyrics })
    const code = await encodeSong({
      genre: genreId,
      feeling,
      length,
      bpm,
      swing,
      kit,
      fill,
      chordInst,
      bass,
      lead,
      extras,
      title: songTitle,
      topic,
      parts: { verse: shared(parts.verse, verseNotes, verseGrid), chorus: shared(parts.chorus, chorusNotes, chorusGrid) },
      sections: customSections ? customSections.map((x) => x.layers) : null,
    })
    setShareUrl(`${location.origin}/#song=${code}`)
  }

  function restart() {
    halt()
    setSharedView(false)
    if (location.hash) history.replaceState(null, '', location.pathname)
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
            cover={cover?.image ?? null}
            coverBusy={coverBusy}
            coverStale={!!cover && cover.key !== coverKey}
            onNewCover={paintCover}
            onShare={openShare}
            shared={sharedView}
          />
        )}
      </main>

      {stepIdx > 0 && <Dock parts={dockParts} nextLabel={nextLabel} onBack={() => goTo(stepIdx - 1)} onNext={next} disabled={!!busy} />}

      {genre && stepIdx > 0 && !busy && (
        <Producer
          open={prodOpen}
          onOpen={setProdOpen}
          messages={msgs}
          busy={prodBusy}
          level={() => mic.current?.level() ?? 0}
          onMic={onMic}
          onText={(text) => talkToProducer({ text })}
          onUndo={undoProducer}
          suggestions={SUGGESTIONS[stepIdx]}
          speak={speak}
          onSpeak={setSpeak}
        />
      )}
      {howOpen && <HowItWorks onClose={() => setHowOpen(false)} />}
      {shareUrl && <ShareCard url={shareUrl} title={songTitle} onClose={() => setShareUrl(null)} />}
      <RecordOverlay busy={busy} count={count} step={playStep} />
    </div>
  )
}
