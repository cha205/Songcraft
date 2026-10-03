import { STEPS, noteName } from '../audio/analysis'
import type { Note } from '../audio/analysis'

// Rows: the C major notes from C6 down to C4.
const ROWS = [84, 83, 81, 79, 77, 76, 74, 72, 71, 69, 67, 65, 64, 62, 60]

type Props = { notes: Note[]; step: number; onChange?: (notes: Note[]) => void; fit?: boolean }

export function PianoRoll({ notes, step, onChange, fit }: Props) {
  // Read-only views only show the rows the melody uses (plus one either side), so the grid stays short.
  const used = ROWS.map((m, i) => (notes.some((n) => n.midi === m) ? i : -1)).filter((i) => i >= 0)
  const rows = fit && used.length ? ROWS.slice(Math.max(0, Math.min(...used) - 1), Math.max(...used) + 2) : ROWS
  const noteAt = (midi: number, s: number) => notes.find((n) => n.midi === midi && s >= n.start && s < n.start + n.len)
  const click = (midi: number, s: number) => {
    if (!onChange) return
    const n = noteAt(midi, s)
    if (n) onChange(notes.filter((x) => x !== n))
    else onChange([...notes, { start: s, len: Math.min(2, STEPS - s), midi }].sort((a, b) => a.start - b.start))
  }
  return (
    <div className="grid-wrap">
      <div className="grid roll">
        {rows.map((midi) => (
          <div className={`row${midi % 12 === 0 ? ' c-row' : ''}`} key={midi}>
            <div className="row-label key">
              <b>{noteName(midi)}</b>
            </div>
            {Array.from({ length: STEPS }, (_, s) => {
              const n = noteAt(midi, s)
              const cls = [
                'cell',
                s % 4 === 0 && 'beat',
                s % 16 === 0 && s > 0 && 'bar',
                s === step && 'now',
                n && 'on note',
                n && n.start === s && 'head',
                n && s === n.start + n.len - 1 && 'tail',
              ]
                .filter(Boolean)
                .join(' ')
              return <button key={s} className={cls} onClick={() => click(midi, s)} aria-label={`${noteName(midi)} step ${s + 1}`} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
