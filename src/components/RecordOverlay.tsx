import { BARS } from '../audio/analysis'
import { Icon } from './Icon'

type Props = { busy: 'drums' | 'hum' | 'sing' | null; count: string; step: number; lyrics?: string[] }

/** Count-in, then a recording card with a four-dot beat indicator. */
export function RecordOverlay({ busy, count, step, lyrics = [] }: Props) {
  if (!busy || !count) return null
  const live = count.startsWith('rec')
  const bar = step >= 0 ? Math.floor(step / 16) : 0
  const line = busy === 'sing' ? lyrics[live ? bar : 0] : ''
  return (
    <div className="overlay" aria-live="assertive">
      <div className="overlay-glow" />
      <div className={`count${live ? ' live' : ''}`}>
        {live ? (
          <>
            <Icon name={busy === 'drums' ? 'kick' : busy === 'sing' ? 'starmic' : 'mic'} size={84} className="bob" />
            <b>{busy === 'drums' ? 'Beatbox now' : 'Sing now'}</b>
            {line && <span className="sing-line">{line}</span>}
            <small>
              <span className="dot" /> Recording bar {count.slice(4)} of {BARS}
            </small>
            <div className="pulse-dots">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} className={step >= 0 && Math.floor(step / 4) % 4 === i ? 'lit' : ''} />
              ))}
            </div>
          </>
        ) : (
          <>
            <b className="big">{count}</b>
            <small>Get ready</small>
            {line && <span className="sing-line next">First line: {line}</span>}
          </>
        )}
      </div>
    </div>
  )
}
