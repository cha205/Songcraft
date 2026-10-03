import { BARS } from '../audio/analysis'
import { Icon } from './Icon'

type Props = { busy: 'drums' | 'hum' | null; count: string; step: number }

/** Count-in, then a recording card with a four-dot beat indicator. */
export function RecordOverlay({ busy, count, step }: Props) {
  if (!busy || !count) return null
  const live = count.startsWith('rec')
  return (
    <div className="overlay" aria-live="assertive">
      <div className="overlay-glow" />
      <div className={`count${live ? ' live' : ''}`}>
        {live ? (
          <>
            <Icon name={busy === 'drums' ? 'kick' : 'mic'} size={84} className="bob" />
            <b>{busy === 'drums' ? 'Beatbox now' : 'Sing now'}</b>
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
          </>
        )}
      </div>
    </div>
  )
}
