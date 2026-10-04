import { useState } from 'react'
import type { Note } from '../audio/analysis'
import { Coach, GeminiCoach, MicButton, StageTabs } from '../components/Guide'
import { Icon } from '../components/Icon'
import { PianoRoll } from '../components/PianoRoll'
import { StepHead } from '../components/StepHead'
import { LEADS } from '../data/genres'
import type { LeadId } from '../data/genres'

type Stage = 'listen' | 'record' | 'review'

type Props = {
  part: 'verse' | 'chorus'
  exampleTip: string
  notes: Note[]
  example: Note[]
  myNotes: Note[] | null
  onEdit: (n: Note[]) => void
  onChoice: (c: 'example' | 'mine') => void
  instrument: LeadId
  onInstrument: (i: LeadId) => void
  step: number
  playing: boolean
  onPlay: () => void
  onStop: () => void
  busy: boolean
  onRecord: () => Promise<boolean>
  onCoach: () => Promise<{ good: string; tip: string; model: string }>
  info: string
  hasRaw: boolean
  onRaw: () => void
  onDone: () => void
}

const STAGES: { id: Stage; label: string }[] = [
  { id: 'listen', label: 'Listen' },
  { id: 'record', label: 'Record' },
  { id: 'review', label: 'Review' },
]

export function TuneStep(p: Props) {
  const [stage, setStage] = useState<Stage>(p.myNotes ? 'review' : 'listen')
  const go = (s: Stage) => {
    p.onStop()
    p.onChoice(s === 'review' ? 'mine' : 'example')
    setStage(s)
  }
  const record = async () => {
    if (await p.onRecord()) setStage('review')
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
    <div className="inst-row" role="group" aria-label="Instrument">
      {LEADS.map((i) => (
        <button key={i.id} className={`inst${p.instrument === i.id ? ' on' : ''}`} onClick={() => p.onInstrument(i.id)}>
          <Icon name={i.icon} size={40} />
          <span>{i.name}</span>
        </button>
      ))}
    </div>
  )

  return (
    <section className="step">
      <StepHead icon="mic" title={p.part === 'chorus' ? 'Hum the chorus melody' : 'Hum the melody'}>
        The melody is the part of a song people sing along to. You hum it, and Songcraft plays it on a real instrument such as piano,
        flute or violin, on the beat and in key.
      </StepHead>

      <div className="card stage-card">
        <StageTabs stages={STAGES} current={stage} onPick={go} enabled={(s) => s !== 'review' || !!p.myNotes} />

        {stage === 'listen' && (
          <>
            <Coach icon="headphones">Here is an example melody. Press play to hear it with your beat and chords.</Coach>
            <div className="big-actions top">
              {playBtn('Play the example')}
              {instrumentPicker}
            </div>
            <PianoRoll notes={p.example} step={p.playing ? p.step : -1} fit />
            <p className="note">
              <Icon name="bulb" size={22} /> {p.exampleTip}
            </p>
            <div className="stage-foot">
              <button className="link-btn" onClick={() => { p.onChoice('example'); p.onDone() }}>
                Skip recording and use this melody
              </button>
              <button className="btn red lg" onClick={() => go('record')}>
                <Icon name="mic" size={26} /> I'm ready to hum
              </button>
            </div>
          </>
        )}

        {stage === 'record' && (
          <>
            <Coach icon="mic">Press the microphone. After four clicks, hum any tune for four bars. It does not need to be perfect.</Coach>
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
            {p.info && <p className="notice">{p.info}</p>}
          </>
        )}

        {stage === 'review' && p.myNotes && (
          <>
            <Coach icon="sparkle">Songcraft turned your humming into notes. Play it back, pick an instrument, then keep it or try again.</Coach>
            {p.info && <p className="notice good">{p.info}</p>}
            <GeminiCoach key={p.info} onCoach={p.onCoach} />
            <div className="big-actions top">
              {playBtn('Play my melody')}
              {instrumentPicker}
            </div>
            <PianoRoll notes={p.notes} step={p.playing ? p.step : -1} onChange={p.onEdit} />
            <p className="fine">You can also click the grid to add or remove notes.</p>
            <div className="stage-foot">
              <div className="actions">
                <button className="btn white" onClick={() => go('record')}>
                  <Icon name="record" size={24} /> Try again
                </button>
                {p.hasRaw && (
                  <button className="btn white" onClick={p.onRaw}>
                    <Icon name="wave" size={24} /> Hear my recording
                  </button>
                )}
              </div>
              <button className="btn green lg" onClick={() => { p.onChoice('mine'); p.onDone() }}>
                <Icon name="star" size={26} /> Use my melody
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
