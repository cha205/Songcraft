import { BARS } from '../audio/analysis'

type Props = { busy: 'drums' | 'hum' | null; count: string; step: number }

/** Count-in, then a big "go" card with a 4-dot beat pulse while the mic records. */
export function RecordOverlay({ busy, count, step }: Props) {
  if (!busy || !count) return null
  const live = count.startsWith('rec')
  return (
    <div className="overlay" aria-live="assertive">
      <div className={`count${live ? ' live' : ''}`}>
        {live ? (
          <>
            <span className="dot" />
            <b>{busy === 'drums' ? 'Beatbox now' : 'Hum now'}</b>
            <small>
              Bar {count.slice(4)} of {BARS}
            </small>
            <div className="pulse">
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
