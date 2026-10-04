import { DRUMS } from '../audio/analysis'
import type { Drum, DrumGrid as Grid } from '../audio/analysis'
import type { CellMark } from '../audio/compare'
import { Icon } from './Icon'

const NAME: Record<Drum, string> = { kick: 'Kick', snare: 'Snare', hat: 'Hi-hat' }
const ICON = { kick: 'kick', snare: 'snare', hat: 'hihat' } as const
const COUNT = ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a']

type Props = {
  grid: Grid
  /** 1 = show one big bar with counts (for studying), 4 = the whole loop. */
  bars: 1 | 4
  step: number
  marks?: Record<Drum, CellMark[]>
  onToggle?: (d: Drum, s: number) => void
}

export function DrumGrid({ grid, bars, step, marks, onToggle }: Props) {
  const len = bars * 16
  const now = step < 0 ? -1 : bars === 1 ? step % 16 : step
  return (
    <div className="grid-wrap">
      <div className={`grid drum-grid bars-${bars}`}>
        {bars === 1 && (
          <div className="row counts">
            <div className="row-label" />
            {COUNT.map((c, s) => (
              <span key={s} className={`count-cell${s % 4 === 0 ? ' beat' : ''}${s === now ? ' now' : ''}`}>{c}</span>
            ))}
          </div>
        )}
        {DRUMS.map((d) => (
          <div className="row" key={d}>
            <div className="row-label">
              <Icon name={ICON[d]} size={bars === 1 ? 30 : 24} />
              <span className="row-name">
                <b>{NAME[d]}</b>
              </span>
            </div>
            {grid[d].slice(0, len).map((on, s) => {
              const mark = marks?.[d][s]
              const cls = mark ? ` mark-${mark}` : on ? ` on ${d}` : ''
              return (
                <button
                  key={s}
                  className={`cell${s % 4 === 0 ? ' beat' : ''}${s % 16 === 0 && s > 0 ? ' bar' : ''}${s === now ? ' now' : ''}${cls}`}
                  onClick={onToggle ? () => onToggle(d, s) : undefined}
                  disabled={!onToggle}
                  aria-label={`${NAME[d]} step ${s + 1}${on ? ' on' : ''}`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
