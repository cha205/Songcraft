import type { ReactNode } from 'react'
import { STEPS, bassMidi } from '../audio/analysis'
import type { DrumGrid, Note } from '../audio/analysis'
import type { Template, Vibe } from '../data/templates'
import { Icon } from './Icon'
import type { IconName } from './Icon'

type Props = {
  vibe: Vibe
  template: Template
  drums: DrumGrid
  drumsMine: boolean
  chords: string[]
  notes: Note[]
  melodyMine: boolean
  lyrics: string[]
  stepIdx: number
  playStep: number
  onGo: (step: number) => void
}

type LaneState = 'done' | 'current' | 'upcoming'

/** A live mini timeline of the song. Each lane fills in as the user finishes that part. */
export function TrackPanel(p: Props) {
  const state = (laneStep: number): LaneState => (p.stepIdx > laneStep ? 'done' : p.stepIdx === laneStep ? 'current' : 'upcoming')
  const head = p.playStep >= 0 ? (p.playStep + 0.5) / STEPS : -1
  const lyricCount = p.lyrics.filter(Boolean).length
  const doneCount = [1, 2, 2, 3, 4].filter((s) => p.stepIdx > s).length

  const lanes: { name: string; icon: IconName; step: number; detail: string; viz: ReactNode }[] = [
    {
      name: 'Drums',
      icon: 'kick',
      step: 1,
      detail: p.drumsMine ? 'Your recording' : `Pattern from ${p.template.ref?.title ?? p.template.name}`,
      viz: <DrumViz drums={p.drums} head={head} />,
    },
    { name: 'Chords', icon: 'keys', step: 2, detail: p.chords.join(' · '), viz: <ChordViz chords={p.chords} head={head} /> },
    { name: 'Bass', icon: 'speaker', step: 2, detail: 'Follows the chords', viz: <BassViz chords={p.chords} drums={p.drums} head={head} /> },
    { name: 'Melody', icon: 'notes', step: 3, detail: p.melodyMine ? 'Your recording' : 'Example melody', viz: <MelodyViz notes={p.notes} head={head} /> },
    { name: 'Lyrics', icon: 'notebook', step: 4, detail: `${lyricCount} of 4 lines`, viz: <LyricViz lyrics={p.lyrics} /> },
  ]

  return (
    <aside className="track-panel">
      <div className="tp-head">
        <div>
          <span className="eyebrow">Your track</span>
          <b className="tp-title">
            {p.vibe.name} song · {p.template.bpm} BPM
          </b>
        </div>
        <Icon name={p.vibe.id} size={40} />
      </div>
      <div className="tp-lanes">
        {lanes.map((l) => {
          const s = state(l.step)
          return (
            <button key={l.name} className={`lane ${s}`} onClick={() => p.onGo(l.step)}>
              <span className="lane-icon">
                <Icon name={l.icon} size={30} />
              </span>
              <span className="lane-body">
                <span className="lane-top">
                  <b>{l.name}</b>
                  <span className={`lane-status ${s}`}>
                    {s === 'done' ? (l.name === 'Lyrics' && lyricCount === 0 ? 'Skipped' : 'Done') : s === 'current' ? 'In progress' : 'Up next'}
                  </span>
                </span>
                <span className="lane-viz">{l.viz}</span>
                <span className="lane-detail">{l.detail}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="tp-foot">
        <div className="tp-progress">
          <i style={{ width: `${(doneCount / 5) * 100}%` }} />
        </div>
        <span>{doneCount} of 5 parts complete</span>
      </div>
    </aside>
  )
}

const Head = ({ head, h }: { head: number; h: number }) =>
  head >= 0 ? <line x1={head * 64} x2={head * 64} y1={0} y2={h} className="viz-head" /> : null

function DrumViz({ drums, head }: { drums: DrumGrid; head: number }) {
  const rows: [keyof DrumGrid, string][] = [['kick', 'var(--kick)'], ['snare', 'var(--snare)'], ['hat', 'var(--hat)']]
  return (
    <svg viewBox="0 0 64 12" preserveAspectRatio="none">
      {rows.map(([d, c], r) =>
        drums[d].map((on, s) => (on ? <rect key={`${d}${s}`} x={s + 0.1} y={r * 4 + 0.5} width={0.8} height={3} rx={0.3} fill={c} /> : null)),
      )}
      <Head head={head} h={12} />
    </svg>
  )
}

function ChordViz({ chords, head }: { chords: string[]; head: number }) {
  return (
    <svg viewBox="0 0 64 12" preserveAspectRatio="none">
      {chords.map((c, i) => (
        <rect key={i} x={i * 16 + 0.4} y={1} width={15.2} height={10} rx={2} fill={c.endsWith('m') ? 'var(--minor)' : 'var(--major)'} />
      ))}
      <Head head={head} h={12} />
    </svg>
  )
}

function BassViz({ chords, drums, head }: { chords: string[]; drums: DrumGrid; head: number }) {
  const blocks: { s: number; y: number }[] = []
  for (let s = 0; s < STEPS; s++) {
    const bar = Math.floor(s / 16) * 16
    const barHasKick = drums.kick.slice(bar, bar + 16).some(Boolean)
    if (barHasKick ? drums.kick[s] : s % 8 === 0) blocks.push({ s, y: 10 - ((bassMidi(chords[Math.floor(s / 16)]) - 36) / 11) * 8 })
  }
  return (
    <svg viewBox="0 0 64 12" preserveAspectRatio="none">
      {blocks.map((b) => (
        <rect key={b.s} x={b.s + 0.1} y={b.y - 1.5} width={1.8} height={3} rx={0.6} fill="var(--violet)" />
      ))}
      <Head head={head} h={12} />
    </svg>
  )
}

function MelodyViz({ notes, head }: { notes: Note[]; head: number }) {
  return (
    <svg viewBox="0 0 64 12" preserveAspectRatio="none">
      {notes.map((n, i) => (
        <rect key={i} x={n.start + 0.1} y={10.5 - ((n.midi - 60) / 24) * 10} width={n.len - 0.2} height={1.6} rx={0.6} fill="var(--brand)" />
      ))}
      <Head head={head} h={12} />
    </svg>
  )
}

function LyricViz({ lyrics }: { lyrics: string[] }) {
  return (
    <svg viewBox="0 0 64 12" preserveAspectRatio="none">
      {lyrics.map((l, i) =>
        l ? <rect key={i} x={i * 16 + 1} y={4} width={Math.min(14, 2 + l.length / 3)} height={4} rx={1.5} fill="var(--sun)" /> : null,
      )}
    </svg>
  )
}
