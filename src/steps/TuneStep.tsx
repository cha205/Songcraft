import { useEffect, useState } from 'react'
import type { Note } from '../audio/analysis'
import { previewNote } from '../audio/engine'
import type { MelodyTips } from '../ai'
import { Coach, GeminiCoach, MicButton, StageTabs } from '../components/Guide'
import { Icon } from '../components/Icon'
import { PianoRoll } from '../components/PianoRoll'
import { StepHead } from '../components/StepHead'
import { EXAMPLE_CHORUS, EXAMPLE_TUNES, LEADS } from '../data/genres'
import type { Feeling, Genre, LeadId } from '../data/genres'
import { cursorOf, melodyFromChords, nextNotes } from '../data/melody'

type Stage = 'build' | 'hum' | 'tune'

type Props = {
  part: 'verse' | 'chorus'
  genre: Genre
  feeling: Feeling
  chords: string[]
  bpm: number
  notes: Note[]
  onEdit: (n: Note[]) => void
  instrument: LeadId
  onInstrument: (i: LeadId) => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  busy: boolean
  onRecord: () => Promise<boolean>
  onUpload: (file: File) => Promise<boolean>
  onCoach: () => Promise<{ good: string; tip: string; model: string }>
  onTips: () => Promise<MelodyTips>
  info: string
  hasRaw: boolean
  onRaw: () => void
  onDone: () => void
}

const STAGES: { id: Stage; label: string }[] = [
  { id: 'hum', label: 'Hum it' },
  { id: 'build', label: 'Build' },
  { id: 'tune', label: 'Fine-tune' },
]
const LENGTHS = [
  { len: 2, name: 'Half a beat' },
  { len: 4, name: '1 beat' },
  { len: 8, name: '2 beats' },
  { len: 16, name: 'A whole bar' },
]

export function TuneStep(p: Props) {
  const [stage, setStage] = useState<Stage>('hum')
  const [dragging, setDragging] = useState(false)
  const [len, setLen] = useState(4)
  const [before, setBefore] = useState<Note[] | null>(null)
  const [tips, setTips] = useState<MelodyTips | null>(null)
  const [tipsBusy, setTipsBusy] = useState(false)
  const [tipsError, setTipsError] = useState('')
  // A rest moves the next-note position forward without adding a note.
  const [gap, setGap] = useState(0)
  const at = Math.max(cursorOf(p.notes), gap)
  const room = 64 - at
  const useLen = Math.min(len, room)
  const ideas = room > 0 ? nextNotes(p.notes, p.chords, useLen, p.feeling) : []
  const sorted = (n: Note[]) => [...n].sort((a, b) => a.start - b.start)

  const go = (s: Stage) => {
    p.onStop()
    setStage(s)
  }
  const add = (midi: number) => {
    p.onEdit(sorted([...p.notes, { start: at, len: useLen, midi }]))
    previewNote(midi, useLen / 4)
  }
  const rest = () => setGap(at + useLen)
  const undo = () => {
    if (gap > cursorOf(p.notes)) return setGap(0)
    const last = p.notes.reduce<Note | null>((a, b) => (!a || b.start > a.start ? b : a), null)
    if (last) p.onEdit(p.notes.filter((n) => n !== last))
  }
  const load = (n: Note[]) => {
    setGap(0)
    setBefore(p.notes)
    p.onEdit(n)
    if (!p.playing) p.onPlay()
  }
  // Drop a recording anywhere on this step. Without this, a missed drop would make the browser open the file.
  const { onUpload } = p
  useEffect(() => {
    const over = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
      setDragging(true)
    }
    const leave = (e: DragEvent) => {
      if (!e.relatedTarget) setDragging(false)
    }
    const drop = async (e: DragEvent) => {
      if (!e.dataTransfer?.files.length) return
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files[0]
      if (await onUpload(f)) setStage('tune')
    }
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [onUpload])
  const record = async () => {
    if (await p.onRecord()) setStage('tune')
  }
  const askTips = async () => {
    setTipsBusy(true)
    setTipsError('')
    try {
      setTips(await p.onTips())
    } catch (e) {
      setTipsError((e as Error).message)
    } finally {
      setTipsBusy(false)
    }
  }
  const applyTip = (i: number) => {
    const t = tips?.tips[i]
    const list = sorted(p.notes)
    const target = t ? list[t.note] : null
    if (!t || !target) return
    p.onEdit(list.map((n) => (n === target ? { ...n, midi: t.midi ?? n.midi, len: t.len ?? n.len } : n)))
    if (t.midi) previewNote(t.midi)
    setTips({ ...tips!, tips: tips!.tips.filter((_, j) => j !== i) })
  }

  const playBtn = (label: string) =>
    p.playing ? (
      <button className="btn navy xl" onClick={p.onStop}>
        <Icon name="stop" size={30} /> Stop
      </button>
    ) : (
      <button className="btn green xl" onClick={p.onPlay}>
        <Icon name="play" size={30} /> {label}
      </button>
    )
  const instrumentPicker = (
    <>
      <span className="mini-label">Play the melody on</span>
      <div className="inst-row wrap" role="group" aria-label="Instrument">
        {[...LEADS].sort((a, b) => Number(b.fits.includes(p.genre.id)) - Number(a.fits.includes(p.genre.id))).map((i) => (
          <button key={i.id} className={`inst${p.instrument === i.id ? ' on' : ''}`} onClick={() => p.onInstrument(i.id)}>
            <Icon name={i.icon} size={40} />
            <span>{i.name}</span>
            {i.fits.includes(p.genre.id) && <small className="fit-tag">Fits {p.genre.name}</small>}
          </button>
        ))}
      </div>
    </>
  )
  const bar = Math.floor(at / 16) + 1
  const beat = Math.floor((at % 16) / 4) + 1
  const examples = [
    { id: 'story', name: 'Tells a story', why: EXAMPLE_TUNES[p.feeling].tip, notes: EXAMPLE_TUNES[p.feeling].notes },
    { id: 'hook', name: 'Catchy hook', why: EXAMPLE_CHORUS[p.feeling].tip, notes: EXAMPLE_CHORUS[p.feeling].notes },
    { id: 'chords', name: 'Built from your chords', why: 'Uses the notes of your own chords on a simple rhythm, so it always fits.', notes: melodyFromChords(p.chords, p.part === 'chorus') },
  ]

  return (
    <section className="step">
      <StepHead icon="mic" title={p.part === 'chorus' ? 'Make the chorus melody' : 'Make the melody'}>
        The melody is the part people sing along to. Build it note by note with suggestions, hum it, or start from an example and
        change it until it is yours.
      </StepHead>

      <div className="card stage-card">
        <StageTabs stages={STAGES} current={stage} onPick={go} enabled={() => true} />

        {stage === 'build' && (
          <>
            <Coach icon="note">
              Pick how long the next note lasts, then pick a note. The best fit for your chords is first, and every idea plays when you tap it. Press play to hear the
              whole melody with your beat.
            </Coach>
            <div className="big-actions top">{playBtn('Play my melody')}</div>
            <PianoRoll notes={p.notes} step={p.playing ? p.step : -1} onChange={p.onEdit} />
            <div className="note-builder">
              {room > 0 ? (
                <>
                  <div className="nb-head">
                    <b>Next note</b>
                    <span>
                      Bar {bar}, beat {beat} · over the {p.chords[bar - 1]} chord
                    </span>
                  </div>
                  <div className="nb-lengths" role="radiogroup" aria-label="Note length">
                    {LENGTHS.map((l) => (
                      <button key={l.len} role="radio" aria-checked={len === l.len} className={len === l.len ? 'on' : ''} onClick={() => setLen(l.len)} disabled={l.len > room}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                  <div className="idea-list notes">
                    {ideas.map((x) => (
                      <button key={x.midi} className={`idea${x.best ? ' best' : ''}`} onClick={() => add(x.midi)}>
                        <b className="note-b">{x.name}</b>
                        <span>
                          {x.best && <i className="best-tag">Best fit</i>}
                          {x.why}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="nb-done">Your melody fills all four bars. Play it, fine-tune it, or take notes away to change the ending.</p>
              )}
              <div className="actions">
                {room > 0 && (
                  <button className="btn white" onClick={rest}>
                    Add a rest (silence)
                  </button>
                )}
                <button className="btn white" onClick={undo} disabled={!p.notes.length && !gap}>
                  Undo last note
                </button>
                <button className="btn white" onClick={() => load([])} disabled={!p.notes.length}>
                  Clear
                </button>
              </div>
            </div>

            <div className="examples">
              <span className="mini-label">Need a starting point? Pull up an example, then change it</span>
              <div className="example-list">
                {examples.map((e) => (
                  <button key={e.id} className="example-card" onClick={() => load(e.notes)}>
                    <b>{e.name}</b>
                    <small>{e.why}</small>
                  </button>
                ))}
              </div>
              {before && (
                <button className="link-btn" onClick={() => { p.onEdit(before); setBefore(null) }}>
                  Back to my own notes
                </button>
              )}
            </div>
            {instrumentPicker}
            <div className="stage-foot">
              <button className="link-btn" onClick={() => go('hum')}>
                Rather hum it?
              </button>
              <button className="btn green lg" onClick={() => go('tune')} disabled={!p.notes.length}>
                <Icon name="knob" size={26} /> Next: fine-tune
              </button>
            </div>
          </>
        )}

        {stage === 'hum' && (
          <>
            <Coach icon="mic">
              Press the microphone, wait for four clicks, and hum along to your beat for four bars. Or drop a recording of your hum anywhere on this page: any length,
              Songcraft fits it to your beat.
            </Coach>
            <div className="record-layout">
              <MicButton busy={p.busy} onClick={record} label="Press to record" />
              <div className="record-side">
                <span className="mini-label">Tips for a clean take</span>
                <ul className="tips">
                  <li>
                    <Icon name="headphones" size={24} /> Wear headphones so the microphone only hears you.
                  </li>
                  <li>
                    <Icon name="note" size={24} /> Sing "doo" or "la" rather than humming with your mouth closed.
                  </li>
                  <li>
                    <Icon name="metronome" size={24} /> Your beat and chords play while you record. Follow them.
                  </li>
                </ul>
              </div>
            </div>
            <label className={`upload-hum${dragging ? ' over' : ''}`}>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f && (await p.onUpload(f))) setStage('tune')
                }}
              />
              <Icon name="wave" size={28} />
              <span>
                <b>{dragging ? 'Drop it here' : 'Or drop a recording of your hum here'}</b>
                <small>mp3, wav or m4a, any length. Songcraft trims it, fits it to whole bars of your beat and snaps every note in time.</small>
              </span>
            </label>
            {p.info && <p className="notice">{p.info}</p>}
          </>
        )}

        {stage === 'tune' && (
          <>
            <Coach icon="knob">Polish your melody: tap the grid to add or remove notes, and ask Gemini for ideas. You decide which ideas to use.</Coach>
            {p.info && <p className="notice good">{p.info}</p>}
            <div className="big-actions top">{playBtn('Play my melody')}</div>
            <PianoRoll notes={p.notes} step={p.playing ? p.step : -1} onChange={p.onEdit} />
            <div className="melody-tips">
              {!tips && (
                <button className="btn violet" onClick={askTips} disabled={tipsBusy || !p.notes.length}>
                  <Icon name="bulb" size={26} /> {tipsBusy ? 'Gemini is looking at your melody' : 'How can I make this melody better?'}
                </button>
              )}
              {tipsError && <p className="notice">{tipsError}</p>}
              {tips && (
                <div className="coach-result">
                  <span className="coach-badge">
                    <Icon name="bulb" size={30} /> Gemini's ideas
                  </span>
                  <p>
                    <b>What works:</b> {tips.good}
                  </p>
                  {tips.tips.map((t, i) => (
                    <div key={i} className="tip-row">
                      <p>{t.why}</p>
                      <button className="btn white" onClick={() => applyTip(i)}>
                        Try it
                      </button>
                    </div>
                  ))}
                  <button className="link-btn" onClick={askTips} disabled={tipsBusy}>
                    {tipsBusy ? 'Looking again' : 'Ask again'}
                  </button>
                </div>
              )}
            </div>
            {p.hasRaw && <GeminiCoach key={p.info} onCoach={p.onCoach} />}
            {instrumentPicker}
            <div className="stage-foot">
              <div className="actions">
                <button className="btn white" onClick={() => go('build')}>
                  Back to building
                </button>
                {p.hasRaw && (
                  <button className="btn white" onClick={p.onRaw}>
                    <Icon name="wave" size={24} /> Hear my humming
                  </button>
                )}
              </div>
              <button className="btn green lg" onClick={p.onDone}>
                <Icon name="star" size={26} /> Use my melody
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
